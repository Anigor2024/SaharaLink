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
  Language,
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
}

const CorridorContext = createContext<CorridorContextValue | null>(null);

const LANG_STORAGE_KEY = 'saharalink_lang_v1';

export function CorridorProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [activeView, setActiveViewState] = useState<ActiveView>('corridor');
  const [transfers, setTransfers] = useState<TransferRequest[]>(() => getSeededTransfers());
  const [settings, setSettings] = useState<CorridorSettings>(() => DEFAULT_CORRIDOR_SETTINGS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [draftTransfer, setDraftTransfer] = useState<DraftTransferState>({
    direction: 'MRU_TO_XOF',
    amountSent: 2500,
    step: 1,
    version: 1,
    syncedFromAssistant: false,
  });

  const [trackedId, setTrackedId] = useState<string>('SL-261002-A7K2');
  const [adminInspectId, setAdminInspectId] = useState<string | null>(null);

  const dict = useMemo(() => getDictionary(language), [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // Hydrate initial state from localStorage / IndexedDB via dataService
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (typeof window !== 'undefined') {
        const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang === 'ar' || savedLang === 'fr') {
          setLanguageState(savedLang);
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
        // Ignore storage error on language switch
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
          const el = document.getElementById('transfer-studio-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      }
    },
    []
  );

  const openTrackingForId = useCallback((id: string) => {
    setTrackedId(id.trim().toUpperCase());
    setActiveViewState('track');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const openAdminForTransferId = useCallback((id: string) => {
    setAdminInspectId(id.trim().toUpperCase());
    setActiveViewState('admin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const createTransferRequest = useCallback(
    async (input: CreateTransferInput) => {
      try {
        setStorageError(null);
        const created = await dataService.createTransfer(input, settings);
        setTrackedId(created.id);
        return created;
      } catch (err) {
        setStorageError(dict.errors.storageFailed);
        throw err;
      }
    },
    [settings, dict.errors.storageFailed]
  );

  const updateTransferDecision = useCallback(
    async (id: string, status: 'accepted' | 'rejected', rejectionReason?: string) => {
      try {
        setStorageError(null);
        return await dataService.updateTransferStatus(id, status, rejectionReason);
      } catch (err) {
        setStorageError(dict.errors.storageFailed);
        throw err;
      }
    },
    [dict.errors.storageFailed]
  );

  const updateCorridorSettings = useCallback(
    async (partial: Partial<CorridorSettings>) => {
      try {
        setStorageError(null);
        return await dataService.updateSettings(partial);
      } catch (err) {
        setStorageError(dict.errors.storageFailed);
        throw err;
      }
    },
    [dict.errors.storageFailed]
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
    setStorageError(null);
    await dataService.resetDemoData();
    setTrackedId('SL-261002-A7K2');
    setAdminInspectId(null);
  }, []);

  const dismissStorageError = useCallback(() => {
    setStorageError(null);
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
      adminInspectId,
      openAdminForTransferId,
      setAdminInspectId,
      createTransferRequest,
      updateTransferDecision,
      updateCorridorSettings,
      appendChatMessages,
      clearChat,
      resetAllDemoData,
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
      adminInspectId,
      openAdminForTransferId,
      createTransferRequest,
      updateTransferDecision,
      updateCorridorSettings,
      appendChatMessages,
      clearChat,
      resetAllDemoData,
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
