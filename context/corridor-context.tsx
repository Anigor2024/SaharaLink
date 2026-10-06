'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getDictionary, TranslationDictionary } from '@/lib/i18n';
import { dataService } from '@/services/data-service';
import { DEFAULT_CORRIDOR_SETTINGS, getSeededTransfers } from '@/services/demo-seed';
import {
  ChatMessage,
  CorridorSettings,
  CreateTransferInput,
  InAppNotification,
  Language,
  RecentQuoteItem,
  SavedRecipient,
  SettingHistoryItem,
  StorageErrorCode,
  StorageOperationError,
  TransferDirection,
  TransferRequest,
} from '@/types/corridor';

export type ActiveView = 'corridor' | 'track' | 'admin';

interface DraftTransferState {
  direction: TransferDirection;
  amountSent: number;
  step: 1 | 2 | 3 | 4;
  version: number;
  syncedFromAssistant: boolean;
}

interface CorridorContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dict: TranslationDictionary;
  dir: 'rtl' | 'ltr';
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  transfers: TransferRequest[];
  settings: CorridorSettings;
  chatMessages: ChatMessage[];
  isHydrated: boolean;
  storageError: string | null;
  dismissStorageError: () => void;
  draftTransfer: DraftTransferState;
  applyQuoteToTransferFlow: (direction: TransferDirection, amountSent: number, goToStep?: 1 | 2) => void;
  trackedId: string;
  openTrackingForId: (id: string) => void;
  getTrackingShareUrl: (id: string) => string;
  adminInspectId: string | null;
  openAdminForTransferId: (id: string) => void;
  setAdminInspectId: (id: string | null) => void;
  createTransferRequest: (input: CreateTransferInput) => Promise<TransferRequest>;
  updateTransferDecision: (
    id: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ) => Promise<TransferRequest>;
  updateCorridorSettings: (partial: Partial<CorridorSettings>) => Promise<CorridorSettings>;
  appendChatMessages: (newMsgs: ChatMessage[]) => Promise<void>;
  clearChat: () => Promise<void>;
  resetAllDemoData: () => Promise<void>;

  // Phase 6 Extensions
  recentQuotes: RecentQuoteItem[];
  addRecentQuote: (quote: Omit<RecentQuoteItem, 'id' | 'timestamp'>) => void;
  clearRecentQuotes: () => void;

  savedRecipients: SavedRecipient[];
  addSavedRecipient: (rec: Omit<SavedRecipient, 'id' | 'lastUsedAt'>) => void;
  removeSavedRecipient: (id: string) => void;
  clearSavedRecipients: () => void;

  notifications: InAppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  settingsHistory: SettingHistoryItem[];
  findDuplicateReceiptTransfer: (sha256?: string, currentTransferId?: string) => TransferRequest | null;
}

const CorridorContext = createContext<CorridorContextValue | null>(null);

const LANG_STORAGE_KEY = 'saharalink_lang_v1';
const RECENT_QUOTES_KEY = 'saharalink_recent_quotes_v1';
const SAVED_RECIPIENTS_KEY = 'saharalink_saved_recipients_v1';
const NOTIFICATIONS_KEY = 'saharalink_notifications_v1';
const SETTINGS_HISTORY_KEY = 'saharalink_settings_history_v1';

export function CorridorProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [activeView, setActiveViewState] = useState<ActiveView>('corridor');
  const [transfers, setTransfers] = useState<TransferRequest[]>(() => getSeededTransfers());
  const [settings, setSettings] = useState<CorridorSettings>(() => DEFAULT_CORRIDOR_SETTINGS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageErrorCode, setStorageErrorCode] = useState<StorageErrorCode | null>(null);

  const [draftTransfer, setDraftTransfer] = useState<DraftTransferState>({
    direction: 'MRU_TO_XOF',
    amountSent: 2500,
    step: 1,
    version: 1,
    syncedFromAssistant: false,
  });

  const [trackedId, setTrackedId] = useState<string>('SL-261002-A7K2');
  const [adminInspectId, setAdminInspectId] = useState<string | null>(null);

  // Phase 6 Local state
  const [recentQuotes, setRecentQuotes] = useState<RecentQuoteItem[]>([]);
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [settingsHistory, setSettingsHistory] = useState<SettingHistoryItem[]>([]);

  const dict = useMemo(() => getDictionary(language), [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const storageError = useMemo(() => {
    if (!storageErrorCode) return null;
    if (storageErrorCode === 'RECEIPT_STORAGE_FAILED') {
      return dict.errors.receiptPersistenceWarning;
    }
    if (storageErrorCode === 'TRANSFER_SAVE_FAILED') {
      return dict.errors.transferSaveFailed;
    }
    if (storageErrorCode === 'SETTINGS_SAVE_FAILED') {
      return dict.errors.settingsSaveFailed;
    }
    return dict.errors.storageFailed;
  }, [storageErrorCode, dict.errors]);

  // Hydrate initial state from localStorage / IndexedDB via dataService
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (typeof window !== 'undefined') {
        try {
          const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
          if (savedLang === 'ar' || savedLang === 'fr') {
            setLanguageState(savedLang);
          }

          const rawQuotes = window.localStorage.getItem(RECENT_QUOTES_KEY);
          if (rawQuotes) {
            setRecentQuotes(JSON.parse(rawQuotes));
          } else {
            // Seed a few realistic recent quotes
            setRecentQuotes([
              {
                id: 'rq-1',
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                direction: 'MRU_TO_XOF',
                amountSent: 2500,
                estimatedReceived: 38115,
                exchangeRate: 15.4,
                fee: 25,
              },
              {
                id: 'rq-2',
                timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
                direction: 'XOF_TO_MRU',
                amountSent: 77000,
                estimatedReceived: 4975,
                exchangeRate: 15.4,
                fee: 385,
              },
            ]);
          }

          const rawRecipients = window.localStorage.getItem(SAVED_RECIPIENTS_KEY);
          if (rawRecipients) {
            setSavedRecipients(JSON.parse(rawRecipients));
          } else {
            // Seed realistic recipients
            setSavedRecipients([
              {
                id: 'rec-1',
                name: 'Aïcha Koné',
                phone: '+225 07 08 42 19 30',
                receivingMethod: 'Wave',
                lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              },
              {
                id: 'rec-2',
                name: 'Yao Konan Serge',
                phone: '+225 01 42 78 55 12',
                receivingMethod: 'Orange Money',
                lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
              },
            ]);
          }

          const rawNotifs = window.localStorage.getItem(NOTIFICATIONS_KEY);
          if (rawNotifs) {
            setNotifications(JSON.parse(rawNotifs));
          } else {
            setNotifications([
              {
                id: 'notif-1',
                titleAr: 'طلب تحويل جديد قيد المراجعة',
                titleFr: 'Nouvelle demande en cours d’examen',
                detailAr: 'تم تسجيل طلبك SL-261002-A7K2 في طابور العمليات.',
                detailFr: 'La demande SL-261002-A7K2 a été ajoutée à la file opérationnelle.',
                timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
                transferId: 'SL-261002-A7K2',
                isRead: false,
                type: 'created',
              },
            ]);
          }

          const rawHistory = window.localStorage.getItem(SETTINGS_HISTORY_KEY);
          if (rawHistory) {
            setSettingsHistory(JSON.parse(rawHistory));
          } else {
            setSettingsHistory([
              {
                id: 'sh-1',
                timestamp: '2026-10-02T06:00:00.000Z',
                rate: 15.4,
                fee: 25,
                min: 500,
                max: 250000,
              },
            ]);
          }

          // Check URL parameter: ?track=SL-XXXX
          const params = new URLSearchParams(window.location.search);
          const trackParam = params.get('track');
          if (trackParam && trackParam.trim().length > 3) {
            setTrackedId(trackParam.trim().toUpperCase());
            setActiveViewState('track');
          }
        } catch (e) {
          console.warn('Storage hydration notice:', e);
        }
      }

      const [loadedTransfers, loadedSettings, loadedChat] = await Promise.all([
        dataService.getTransfers(),
        dataService.getSettings(),
        dataService.getChatHistory(),
      ]);

      if (!mounted) return;
      setTransfers(loadedTransfers);
      setSettings(loadedSettings);
      setChatMessages(loadedChat);
      setIsHydrated(true);
    }

    hydrate();

    const unsubscribe = dataService.subscribe((payload) => {
      if (!mounted) return;
      if (payload.type === 'TRANSFERS_UPDATED') {
        setTransfers(payload.transfers);
      } else if (payload.type === 'SETTINGS_UPDATED') {
        setSettings(payload.settings);
      } else if (payload.type === 'DEMO_RESET') {
        setTransfers(payload.transfers);
        setSettings(payload.settings);
        setChatMessages([]);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sync HTML dir and lang attributes whenever language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [dir, language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'ar' ? 'fr' : 'ar';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LANG_STORAGE_KEY, next);
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const setActiveView = useCallback((view: ActiveView) => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const applyQuoteToTransferFlow = useCallback(
    (direction: TransferDirection, amountSent: number, goToStep: 1 | 2 = 2) => {
      setDraftTransfer((prev) => ({
        direction,
        amountSent,
        step: goToStep,
        version: prev.version + 1,
        syncedFromAssistant: true,
      }));
      setActiveViewState('corridor');
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          const el = document.getElementById('corridor-workspace');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      }
    },
    []
  );

  const openTrackingForId = useCallback((id: string) => {
    const cleanId = id.trim().toUpperCase();
    setTrackedId(cleanId);
    setActiveViewState('track');
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('track', cleanId);
        window.history.replaceState(null, '', url.toString());
      } catch {
        // Ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const getTrackingShareUrl = useCallback((id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (typeof window === 'undefined') return `?track=${cleanId}`;
    return `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(cleanId)}`;
  }, []);

  const openAdminForTransferId = useCallback((id: string) => {
    setAdminInspectId(id.trim().toUpperCase());
    setActiveViewState('admin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Notifications
  const addNotification = useCallback((notif: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const item: InAppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => {
      const next = [item, ...prev].slice(0, 20);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(NOTIFICATIONS_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Recent Quotes
  const addRecentQuote = useCallback((quote: Omit<RecentQuoteItem, 'id' | 'timestamp'>) => {
    const item: RecentQuoteItem = {
      ...quote,
      id: `rq-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setRecentQuotes((prev) => {
      // Avoid duplicate exact top quote
      const filtered = prev.filter(
        (q) => !(q.direction === quote.direction && q.amountSent === quote.amountSent)
      );
      const next = [item, ...filtered].slice(0, 5);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(RECENT_QUOTES_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const clearRecentQuotes = useCallback(() => {
    setRecentQuotes([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(RECENT_QUOTES_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Saved Recipients
  const addSavedRecipient = useCallback((rec: Omit<SavedRecipient, 'id' | 'lastUsedAt'>) => {
    const item: SavedRecipient = {
      ...rec,
      id: `rec-${Date.now()}`,
      lastUsedAt: new Date().toISOString(),
    };
    setSavedRecipients((prev) => {
      const filtered = prev.filter(
        (r) => r.phone.trim() !== rec.phone.trim()
      );
      const next = [item, ...filtered].slice(0, 6);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(SAVED_RECIPIENTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const removeSavedRecipient = useCallback((id: string) => {
    setSavedRecipients((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(SAVED_RECIPIENTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
      }
      return next;
    });
  }, []);

  const clearSavedRecipients = useCallback(() => {
    setSavedRecipients([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(SAVED_RECIPIENTS_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Duplicate receipt detector
  const findDuplicateReceiptTransfer = useCallback(
    (sha256?: string, currentTransferId?: string): TransferRequest | null => {
      if (!sha256 || sha256.length < 16) return null;
      const targetId = currentTransferId?.toUpperCase();
      return (
        transfers.find(
          (t) => t.receiptSha256 === sha256 && t.id.toUpperCase() !== targetId
        ) || null
      );
    },
    [transfers]
  );

  const createTransferRequest = useCallback(
    async (input: CreateTransferInput) => {
      try {
        setStorageErrorCode(null);
        const created = await dataService.createTransfer(input, settings);
        setTrackedId(created.id);
        if (created.receiptPersistenceStatus && created.receiptPersistenceStatus !== 'persistent') {
          setStorageErrorCode('RECEIPT_STORAGE_FAILED');
        }

        // Save recipient to recent recipients
        addSavedRecipient({
          name: created.recipientName,
          phone: created.recipientPhone,
          receivingMethod: created.receivingMethod,
        });

        // Add in-app notification
        addNotification({
          titleAr: 'تم تسجيل طلب التحويل بنجاح',
          titleFr: 'Demande enregistrée avec succès',
          detailAr: `تم تسجيل طلبك ${created.id} بنجاح ودخل مرحلة الفحص التشغيلي.`,
          detailFr: `Votre demande ${created.id} a été enregistrée pour examen opérationnel.`,
          transferId: created.id,
          type: 'created',
        });

        return created;
      } catch (err) {
        if (err instanceof StorageOperationError) {
          setStorageErrorCode(err.code);
        } else {
          setStorageErrorCode('TRANSFER_SAVE_FAILED');
        }
        throw err;
      }
    },
    [settings, addSavedRecipient, addNotification]
  );

  const updateTransferDecision = useCallback(
    async (id: string, status: 'accepted' | 'rejected', rejectionReason?: string) => {
      try {
        setStorageErrorCode(null);
        const updated = await dataService.updateTransferStatus(id, status, rejectionReason);

        // Add in-app notification
        addNotification({
          titleAr: status === 'accepted' ? 'تم اعتماد طلب التحويل' : 'لم يتم اعتماد الطلب',
          titleFr: status === 'accepted' ? 'Demande approuvée' : 'Demande rejetée',
          detailAr:
            status === 'accepted'
              ? `تم اعتماد طلب التحويل ${id} بنجاح من لوحة العمليات.`
              : `تم رفض الطلب ${id}. ملاحظة الإدارة: ${rejectionReason || 'تعذر مطابقة الوصل.'}`,
          detailFr:
            status === 'accepted'
              ? `La demande ${id} a été approuvée par l'équipe opérationnelle.`
              : `La demande ${id} a été rejetée. Motif : ${rejectionReason || 'Justificatif non conforme.'}`,
          transferId: id,
          type: 'status_change',
        });

        return updated;
      } catch (err) {
        if (err instanceof StorageOperationError) {
          setStorageErrorCode(err.code);
        } else {
          setStorageErrorCode('TRANSFER_SAVE_FAILED');
        }
        throw err;
      }
    },
    [addNotification]
  );

  const updateCorridorSettings = useCallback(
    async (partial: Partial<CorridorSettings>) => {
      try {
        setStorageErrorCode(null);
        const updated = await dataService.updateSettings(partial);

        // Record setting change in history
        const historyItem: SettingHistoryItem = {
          id: `sh-${Date.now()}`,
          timestamp: new Date().toISOString(),
          rate: updated.exchangeRateMruToXof,
          fee: updated.fixedFeeMru,
          min: updated.minTransferMru,
          max: updated.maxTransferMru,
        };

        setSettingsHistory((prev) => {
          const next = [historyItem, ...prev].slice(0, 10);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(SETTINGS_HISTORY_KEY, JSON.stringify(next));
            } catch {
              // Ignore
            }
          }
          return next;
        });

        // Add in-app notification
        addNotification({
          titleAr: 'تم تحديث إعدادات المسار',
          titleFr: 'Paramètres du corridor mis à jour',
          detailAr: `تم تحديث سعر الصرف إلى 1 MRU = ${updated.exchangeRateMruToXof} XOF والرسوم إلى ${updated.fixedFeeMru} MRU.`,
          detailFr: `Taux mis à jour : 1 MRU = ${updated.exchangeRateMruToXof} XOF. Frais : ${updated.fixedFeeMru} MRU.`,
          type: 'settings_updated',
        });

        return updated;
      } catch (err) {
        if (err instanceof StorageOperationError) {
          setStorageErrorCode(err.code);
        } else {
          setStorageErrorCode('SETTINGS_SAVE_FAILED');
        }
        throw err;
      }
    },
    [addNotification]
  );

  const appendChatMessages = useCallback(async (newMsgs: ChatMessage[]) => {
    setChatMessages((prev) => {
      const updated = [...prev, ...newMsgs];
      dataService.saveChatHistory(updated);
      return updated;
    });
  }, []);

  const clearChat = useCallback(async () => {
    await dataService.clearChatHistory();
    setChatMessages([]);
  }, []);

  const resetAllDemoData = useCallback(async () => {
    setStorageErrorCode(null);
    await dataService.resetDemoData();
    setTrackedId('SL-261002-A7K2');
    setAdminInspectId(null);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(RECENT_QUOTES_KEY);
        window.localStorage.removeItem(SAVED_RECIPIENTS_KEY);
        window.localStorage.removeItem(NOTIFICATIONS_KEY);
        window.localStorage.removeItem(SETTINGS_HISTORY_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  const dismissStorageError = useCallback(() => {
    setStorageErrorCode(null);
  }, []);

  const value = useMemo<CorridorContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      dict,
      dir,
      activeView,
      setActiveView,
      transfers,
      settings,
      chatMessages,
      isHydrated,
      storageError,
      dismissStorageError,
      draftTransfer,
      applyQuoteToTransferFlow,
      trackedId,
      openTrackingForId,
      getTrackingShareUrl,
      adminInspectId,
      openAdminForTransferId,
      setAdminInspectId,
      createTransferRequest,
      updateTransferDecision,
      updateCorridorSettings,
      appendChatMessages,
      clearChat,
      resetAllDemoData,
      recentQuotes,
      addRecentQuote,
      clearRecentQuotes,
      savedRecipients,
      addSavedRecipient,
      removeSavedRecipient,
      clearSavedRecipients,
      notifications,
      unreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      settingsHistory,
      findDuplicateReceiptTransfer,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      dict,
      dir,
      activeView,
      setActiveView,
      transfers,
      settings,
      chatMessages,
      isHydrated,
      storageError,
      dismissStorageError,
      draftTransfer,
      applyQuoteToTransferFlow,
      trackedId,
      openTrackingForId,
      getTrackingShareUrl,
      adminInspectId,
      openAdminForTransferId,
      createTransferRequest,
      updateTransferDecision,
      updateCorridorSettings,
      appendChatMessages,
      clearChat,
      resetAllDemoData,
      recentQuotes,
      addRecentQuote,
      clearRecentQuotes,
      savedRecipients,
      addSavedRecipient,
      removeSavedRecipient,
      clearSavedRecipients,
      notifications,
      unreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      settingsHistory,
      findDuplicateReceiptTransfer,
    ]
  );

  return <CorridorContext.Provider value={value}>{children}</CorridorContext.Provider>;
}

export function useCorridor() {
  const ctx = useContext(CorridorContext);
  if (!ctx) {
    throw new Error('useCorridor must be used within a CorridorProvider');
  }
  return ctx;
}
