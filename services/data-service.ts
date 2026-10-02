import {
  calculateTransferQuote,
  createDemoReceiptSvgDataUrl,
  formatCurrencyAmount,
  generateTransferId,
} from '@/lib/quote-engine';
import { DEFAULT_CORRIDOR_SETTINGS, getSeededTransfers } from '@/services/demo-seed';
import { receiptStorage } from '@/services/receipt-storage';
import {
  ChatMessage,
  CorridorSettings,
  CreateTransferInput,
  DataService,
  StorageOperationError,
  TransferRequest,
} from '@/types/corridor';

const STORAGE_KEYS = {
  TRANSFERS: 'saharalink_transfers_v1',
  SETTINGS: 'saharalink_settings_v1',
  CHAT: 'saharalink_chat_v1',
  LANGUAGE: 'saharalink_lang_v1',
} as const;

export const BROADCAST_CHANNEL_NAME = 'saharalink_corridor_sync_v1';

export type SyncEventPayload =
  | { type: 'TRANSFERS_UPDATED'; transfers: TransferRequest[]; syncId: string }
  | { type: 'SETTINGS_UPDATED'; settings: CorridorSettings; syncId: string }
  | {
      type: 'DEMO_RESET';
      transfers: TransferRequest[];
      settings: CorridorSettings;
      syncId: string;
    };

/**
 * LocalDemoDataService
 * Browser-persisted repository for prototype mode with:
 * - IndexedDB Receipt Vault integration (Technical Fix 7)
 * - Accurate chronological ISO 8601 timestamps (Technical Fix 8)
 * - Deduplicated BroadcastChannel + storage event sync with cleanup (Technical Fix 9)
 * - User-meaningful StorageOperationError reporting (Technical Fix 10)
 */
export class LocalDemoDataService implements DataService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(payload: SyncEventPayload) => void> = new Set();
  private lastProcessedSyncId: string = '';
  private boundStorageHandler: ((event: StorageEvent) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSyncChannels();
    }
  }

  private initSyncChannels() {
    if ('BroadcastChannel' in window && !this.channel) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = async (event: MessageEvent<SyncEventPayload>) => {
          const data = event.data;
          if (!data || data.syncId === this.lastProcessedSyncId) return;
          this.lastProcessedSyncId = data.syncId;

          if (data.type === 'TRANSFERS_UPDATED') {
            const hydrated = await this.hydrateReceipts(data.transfers);
            this.notifyListeners({ ...data, transfers: hydrated });
          } else {
            this.notifyListeners(data);
          }
        };
      } catch {
        this.channel = null;
      }
    }

    if (!this.boundStorageHandler) {
      this.boundStorageHandler = async (event: StorageEvent) => {
        if (event.key === STORAGE_KEYS.TRANSFERS && event.newValue) {
          try {
            const rawTransfers = JSON.parse(event.newValue) as TransferRequest[];
            const hydrated = await this.hydrateReceipts(rawTransfers);
            const syncId = `storage-tx-${Date.now()}`;
            this.lastProcessedSyncId = syncId;
            this.notifyListeners({
              type: 'TRANSFERS_UPDATED',
              transfers: hydrated,
              syncId,
            });
          } catch {
            // Ignore malformed storage payload
          }
        } else if (event.key === STORAGE_KEYS.SETTINGS && event.newValue) {
          try {
            const settings = JSON.parse(event.newValue) as CorridorSettings;
            const syncId = `storage-cfg-${Date.now()}`;
            this.lastProcessedSyncId = syncId;
            this.notifyListeners({
              type: 'SETTINGS_UPDATED',
              settings,
              syncId,
            });
          } catch {
            // Ignore malformed storage payload
          }
        }
      };

      window.addEventListener('storage', this.boundStorageHandler);
    }
  }

  public subscribe(listener: (payload: SyncEventPayload) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public dispose() {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignore
      }
      this.channel = null;
    }
    if (typeof window !== 'undefined' && this.boundStorageHandler) {
      window.removeEventListener('storage', this.boundStorageHandler);
      this.boundStorageHandler = null;
    }
    this.listeners.clear();
  }

  private notifyListeners(payload: SyncEventPayload) {
    this.listeners.forEach((listener) => listener(payload));
  }

  private broadcast(payload: SyncEventPayload) {
    this.lastProcessedSyncId = payload.syncId;
    this.notifyListeners(payload);
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {
        // Safe fallback if channel is closed
      }
    }
  }

  /**
   * Hydrates transfer records with their receipt binary/DataURL from IndexedDB
   * or generates a clean fallback voucher if storage was cleared externally.
   */
  private async hydrateReceipts(transfers: TransferRequest[]): Promise<TransferRequest[]> {
    return Promise.all(
      transfers.map(async (item) => {
        if (item.receiptStorageKey) {
          const storedReceipt = await receiptStorage.getReceipt(item.receiptStorageKey);
          if (storedReceipt) {
            return { ...item, receiptDataUrl: storedReceipt };
          }
        }
        if (item.receiptDataUrl && item.receiptDataUrl.length > 0) {
          return item;
        }
        // Fallback procedural voucher if binary receipt was evicted
        return {
          ...item,
          receiptDataUrl: createDemoReceiptSvgDataUrl({
            refCode: item.id,
            senderName: item.senderName,
            recipientName: item.recipientName,
            amount: formatCurrencyAmount(item.amountSent, item.originCurrency),
            method: item.receivingMethod,
            dateStr: item.createdAt.slice(0, 16).replace('T', ' ') + ' UTC',
          }),
        };
      })
    );
  }

  /**
   * Persists lightweight transfer metadata to localStorage while keeping heavy receipt blobs in IndexedDB.
   */
  private persistTransfersMetadata(transfers: TransferRequest[]): void {
    if (typeof window === 'undefined') return;

    const lightweightList = transfers.map((item) => {
      // If stored in IndexedDB via receiptStorageKey, omit the large base64 string from localStorage
      if (item.receiptStorageKey) {
        return {
          ...item,
          receiptDataUrl: '',
        };
      }
      return item;
    });

    try {
      window.localStorage.setItem(
        STORAGE_KEYS.TRANSFERS,
        JSON.stringify(lightweightList)
      );
    } catch {
      // Secondary fallback: strip all inline SVG data URLs so transfer metadata is never lost
      try {
        const ultraCompact = lightweightList.map((t) => ({
          ...t,
          receiptDataUrl: '',
        }));
        window.localStorage.setItem(
          STORAGE_KEYS.TRANSFERS,
          JSON.stringify(ultraCompact)
        );
      } catch {
        throw new StorageOperationError(
          'TRANSFER_SAVE_FAILED',
          'Browser local storage capacity is full. Please reset demo data or clear space.'
        );
      }
    }
  }

  async getTransfers(): Promise<TransferRequest[]> {
    if (typeof window === 'undefined') return getSeededTransfers();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (!raw) {
        const seeded = getSeededTransfers();
        this.persistTransfersMetadata(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw) as TransferRequest[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const seeded = getSeededTransfers();
        this.persistTransfersMetadata(seeded);
        return seeded;
      }
      return await this.hydrateReceipts(parsed);
    } catch {
      return getSeededTransfers();
    }
  }

  async getTransferById(id: string): Promise<TransferRequest | null> {
    const normalized = id.trim().toUpperCase();
    const list = await this.getTransfers();
    return list.find((item) => item.id.toUpperCase() === normalized) || null;
  }

  async createTransfer(
    input: CreateTransferInput,
    settings: CorridorSettings
  ): Promise<TransferRequest> {
    const existing = await this.getTransfers();
    const quote = calculateTransferQuote(input.amountSent, input.direction, settings);

    const now = new Date();
    const newId = generateTransferId(
      existing.map((t) => t.id),
      now
    );

    // Technical Fix 8: Logical, non-future ISO 8601 timestamps
    const nowIso = now.toISOString();
    const receiptTimeIso =
      input.receiptUploadedAt && input.receiptUploadedAt <= nowIso
        ? input.receiptUploadedAt
        : nowIso;

    // Technical Fix 7: Save binary/DataURL receipt to IndexedDB vault
    const receiptKey = `rcpt_${newId}`;
    await receiptStorage.saveReceipt(receiptKey, input.receiptDataUrl);

    const newTransfer: TransferRequest = {
      id: newId,
      direction: input.direction,
      originCurrency: quote.originCurrency,
      destinationCurrency: quote.destinationCurrency,
      amountSent: quote.amountSent,
      exchangeRate: quote.exchangeRate,
      fee: quote.feeInOrigin,
      estimatedReceived: quote.estimatedReceived,
      senderName: sanitizeText(input.senderName),
      senderPhone: sanitizeText(input.senderPhone),
      recipientName: sanitizeText(input.recipientName),
      recipientPhone: sanitizeText(input.recipientPhone),
      receivingMethod: input.receivingMethod,
      receiptStorageKey: receiptKey,
      receiptDataUrl: input.receiptDataUrl,
      receiptFileName: sanitizeText(input.receiptFileName),
      receiptFileSize: input.receiptFileSize,
      receiptMimeType: input.receiptMimeType,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          id: `evt-${newId}-1`,
          step: 'created',
          timestamp: receiptTimeIso,
          actor: 'customer',
        },
        {
          id: `evt-${newId}-2`,
          step: 'receipt_uploaded',
          timestamp: receiptTimeIso,
          actor: 'customer',
        },
        {
          id: `evt-${newId}-3`,
          step: 'under_review',
          timestamp: nowIso,
          actor: 'system',
        },
      ],
    };

    const updatedList = [newTransfer, ...existing];
    this.persistTransfersMetadata(updatedList);

    this.broadcast({
      type: 'TRANSFERS_UPDATED',
      transfers: updatedList,
      syncId: `create-${newId}-${now.getTime()}`,
    });

    return newTransfer;
  }

  async updateTransferStatus(
    id: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ): Promise<TransferRequest> {
    const existing = await this.getTransfers();
    const now = new Date();
    const nowIso = now.toISOString();
    const normalizedId = id.trim().toUpperCase();

    let updatedRecord: TransferRequest | null = null;

    const updatedList = existing.map((item) => {
      if (item.id.toUpperCase() !== normalizedId) return item;

      const baseTimeline = item.timeline.filter(
        (evt) => evt.step !== 'accepted' && evt.step !== 'rejected'
      );

      const cleanNote = rejectionReason ? sanitizeText(rejectionReason) : undefined;

      const decisionEvent = {
        id: `evt-${item.id}-${status}-${now.getTime()}`,
        step: status,
        timestamp: nowIso,
        actor: 'admin' as const,
        note: status === 'rejected' ? cleanNote : undefined,
      };

      updatedRecord = {
        ...item,
        status,
        rejectionReason: status === 'rejected' ? cleanNote : undefined,
        updatedAt: nowIso,
        timeline: [...baseTimeline, decisionEvent],
      };

      return updatedRecord;
    });

    if (!updatedRecord) {
      throw new StorageOperationError(
        'TRANSFER_SAVE_FAILED',
        `Transfer request ${id} not found.`
      );
    }

    this.persistTransfersMetadata(updatedList);

    this.broadcast({
      type: 'TRANSFERS_UPDATED',
      transfers: updatedList,
      syncId: `status-${normalizedId}-${status}-${now.getTime()}`,
    });

    return updatedRecord;
  }

  async getSettings(): Promise<CorridorSettings> {
    if (typeof window === 'undefined') return DEFAULT_CORRIDOR_SETTINGS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) {
        window.localStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(DEFAULT_CORRIDOR_SETTINGS)
        );
        return DEFAULT_CORRIDOR_SETTINGS;
      }
      return {
        ...DEFAULT_CORRIDOR_SETTINGS,
        ...(JSON.parse(raw) as Partial<CorridorSettings>),
        aiModeLabel: 'Local Simulation — No OpenAI API',
      };
    } catch {
      return DEFAULT_CORRIDOR_SETTINGS;
    }
  }

  async updateSettings(partial: Partial<CorridorSettings>): Promise<CorridorSettings> {
    const current = await this.getSettings();
    const now = new Date();
    const nextSettings: CorridorSettings = {
      ...current,
      ...partial,
      aiModeLabel: 'Local Simulation — No OpenAI API',
      updatedAt: now.toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
      } catch {
        throw new StorageOperationError(
          'SETTINGS_SAVE_FAILED',
          'Settings could not be saved to browser storage.'
        );
      }
    }

    this.broadcast({
      type: 'SETTINGS_UPDATED',
      settings: nextSettings,
      syncId: `settings-${now.getTime()}`,
    });

    return nextSettings;
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.CHAT);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.CHAT,
        JSON.stringify(messages.slice(-40))
      );
    } catch {
      // Safe non-fatal chat history fallback
    }
  }

  async clearChatHistory(): Promise<ChatMessage[]> {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.CHAT);
    }
    return [];
  }

  async resetDemoData(): Promise<{
    transfers: TransferRequest[];
    settings: CorridorSettings;
  }> {
    await receiptStorage.clearAllReceipts();
    const transfers = getSeededTransfers();
    const now = new Date();
    const settings = {
      ...DEFAULT_CORRIDOR_SETTINGS,
      updatedAt: now.toISOString(),
    };

    if (typeof window !== 'undefined') {
      this.persistTransfersMetadata(transfers);
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.localStorage.removeItem(STORAGE_KEYS.CHAT);
    }

    this.broadcast({
      type: 'DEMO_RESET',
      transfers,
      settings,
      syncId: `reset-${now.getTime()}`,
    });

    return { transfers, settings };
  }
}

/**
 * FutureSupabaseDataService
 * Production-ready adapter blueprint for migrating to Supabase PostgreSQL, Auth, and Storage
 * without altering UI components or business logic.
 */
export class FutureSupabaseDataService implements DataService {
  async getTransfers(): Promise<TransferRequest[]> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async getTransferById(id: string): Promise<TransferRequest | null> {
    throw new Error(`FutureSupabaseDataService is a production adapter blueprint (${id}).`);
  }
  async createTransfer(
    input: CreateTransferInput,
    settings: CorridorSettings
  ): Promise<TransferRequest> {
    throw new Error(
      `FutureSupabaseDataService is a production adapter blueprint (${input.direction}, ${settings.exchangeRateMruToXof}).`
    );
  }
  async updateTransferStatus(
    id: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ): Promise<TransferRequest> {
    throw new Error(
      `FutureSupabaseDataService is a production adapter blueprint (${id}, ${status}, ${rejectionReason ?? ''}).`
    );
  }
  async getSettings(): Promise<CorridorSettings> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async updateSettings(partial: Partial<CorridorSettings>): Promise<CorridorSettings> {
    throw new Error(
      `FutureSupabaseDataService is a production adapter blueprint (${Object.keys(partial).length}).`
    );
  }
  async getChatHistory(): Promise<ChatMessage[]> {
    return [];
  }
  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    if (messages.length < 0) {
      throw new Error('Invalid chat history.');
    }
  }
  async clearChatHistory(): Promise<ChatMessage[]> {
    return [];
  }
  async resetDemoData(): Promise<{
    transfers: TransferRequest[];
    settings: CorridorSettings;
  }> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
}

function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 300);
}

// Singleton instance for prototype usage
export const dataService = new LocalDemoDataService();
