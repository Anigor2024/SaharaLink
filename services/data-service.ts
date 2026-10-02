import { calculateTransferQuote, generateTransferId } from '@/lib/quote-engine';
import { DEFAULT_CORRIDOR_SETTINGS, getSeededTransfers } from '@/services/demo-seed';
import {
  ChatMessage,
  CorridorSettings,
  CreateTransferInput,
  DataService,
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
  | { type: 'TRANSFERS_UPDATED'; transfers: TransferRequest[] }
  | { type: 'SETTINGS_UPDATED'; settings: CorridorSettings }
  | { type: 'DEMO_RESET'; transfers: TransferRequest[]; settings: CorridorSettings };

/**
 * LocalDemoDataService
 * Browser-persisted repository for prototype mode with cross-tab BroadcastChannel sync.
 * UI components never access localStorage directly; they interact strictly through DataService.
 */
export class LocalDemoDataService implements DataService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(payload: SyncEventPayload) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event: MessageEvent<SyncEventPayload>) => {
            if (event.data) {
              this.notifyListeners(event.data);
            }
          };
        } catch {
          this.channel = null;
        }
      }

      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEYS.TRANSFERS && event.newValue) {
          try {
            const transfers = JSON.parse(event.newValue) as TransferRequest[];
            this.notifyListeners({ type: 'TRANSFERS_UPDATED', transfers });
          } catch {
            // Ignore malformed storage payload
          }
        } else if (event.key === STORAGE_KEYS.SETTINGS && event.newValue) {
          try {
            const settings = JSON.parse(event.newValue) as CorridorSettings;
            this.notifyListeners({ type: 'SETTINGS_UPDATED', settings });
          } catch {
            // Ignore malformed storage payload
          }
        }
      });
    }
  }

  public subscribe(listener: (payload: SyncEventPayload) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(payload: SyncEventPayload) {
    this.listeners.forEach((listener) => listener(payload));
  }

  private broadcast(payload: SyncEventPayload) {
    this.notifyListeners(payload);
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {
        // Safe fallback if channel is closed
      }
    }
  }

  async getTransfers(): Promise<TransferRequest[]> {
    if (typeof window === 'undefined') return getSeededTransfers();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.TRANSFERS);
      if (!raw) {
        const seeded = getSeededTransfers();
        window.localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw) as TransferRequest[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : getSeededTransfers();
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

    const newId = generateTransferId(existing.map((t) => t.id));
    const now = new Date();
    const tCreated = now.toISOString();
    const tReceipt = new Date(now.getTime() + 1200).toISOString();
    const tReview = new Date(now.getTime() + 2400).toISOString();

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
      receiptDataUrl: input.receiptDataUrl,
      receiptFileName: sanitizeText(input.receiptFileName),
      receiptFileSize: input.receiptFileSize,
      receiptMimeType: input.receiptMimeType,
      status: 'pending',
      createdAt: tCreated,
      updatedAt: tReview,
      timeline: [
        {
          id: `evt-${Date.now()}-1`,
          step: 'created',
          timestamp: tCreated,
          actor: 'customer',
        },
        {
          id: `evt-${Date.now()}-2`,
          step: 'receipt_uploaded',
          timestamp: tReceipt,
          actor: 'customer',
        },
        {
          id: `evt-${Date.now()}-3`,
          step: 'under_review',
          timestamp: tReview,
          actor: 'system',
        },
      ],
    };

    const updatedList = [newTransfer, ...existing];
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(updatedList));
      } catch {
        // Handle storage quota gracefully by trimming oldest receipt data if necessary
      }
    }

    this.broadcast({ type: 'TRANSFERS_UPDATED', transfers: updatedList });
    return newTransfer;
  }

  async updateTransferStatus(
    id: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ): Promise<TransferRequest> {
    const existing = await this.getTransfers();
    const nowIso = new Date().toISOString();
    const normalizedId = id.trim().toUpperCase();

    let updatedRecord: TransferRequest | null = null;

    const updatedList = existing.map((item) => {
      if (item.id.toUpperCase() !== normalizedId) return item;

      // Keep base timeline events (created, receipt_uploaded, under_review) and append the new decision
      const baseTimeline = item.timeline.filter(
        (evt) => evt.step !== 'accepted' && evt.step !== 'rejected'
      );

      const cleanNote = rejectionReason ? sanitizeText(rejectionReason) : undefined;

      const decisionEvent = {
        id: `evt-${Date.now()}`,
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
      throw new Error(`Transfer request ${id} not found.`);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(updatedList));
    }

    this.broadcast({ type: 'TRANSFERS_UPDATED', transfers: updatedList });
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
    const nextSettings: CorridorSettings = {
      ...current,
      ...partial,
      aiModeLabel: 'Local Simulation — No OpenAI API',
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nextSettings));
    }

    this.broadcast({ type: 'SETTINGS_UPDATED', settings: nextSettings });
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
      window.localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages.slice(-50)));
    } catch {
      // Ignore storage error
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
    const transfers = getSeededTransfers();
    const settings = {
      ...DEFAULT_CORRIDOR_SETTINGS,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.localStorage.removeItem(STORAGE_KEYS.CHAT);
    }

    this.broadcast({ type: 'DEMO_RESET', transfers, settings });
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
  async getTransferById(_id: string): Promise<TransferRequest | null> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async createTransfer(
    _input: CreateTransferInput,
    _settings: CorridorSettings
  ): Promise<TransferRequest> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async updateTransferStatus(
    _id: string,
    _status: 'accepted' | 'rejected',
    _rejectionReason?: string
  ): Promise<TransferRequest> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async getSettings(): Promise<CorridorSettings> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async updateSettings(_partial: Partial<CorridorSettings>): Promise<CorridorSettings> {
    throw new Error('FutureSupabaseDataService is a production adapter blueprint.');
  }
  async getChatHistory(): Promise<ChatMessage[]> {
    return [];
  }
  async saveChatHistory(_messages: ChatMessage[]): Promise<void> {}
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
