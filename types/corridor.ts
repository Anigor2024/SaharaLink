export type Language = 'ar' | 'fr';

export type TransferDirection = 'MRU_TO_XOF' | 'XOF_TO_MRU';

export type CurrencyCode = 'MRU' | 'XOF';

export type ReceivingMethod =
  | 'Orange Money'
  | 'Wave'
  | 'MTN Money'
  | 'Bankily'
  | 'Masrivi';

export type TransferStatus = 'pending' | 'accepted' | 'rejected';

export type TimelineStepKey =
  | 'created'
  | 'receipt_uploaded'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export interface TimelineEvent {
  id: string;
  step: TimelineStepKey;
  timestamp: string;
  actor?: 'customer' | 'system' | 'admin';
  note?: string;
}

export interface TransferQuote {
  direction: TransferDirection;
  originCurrency: CurrencyCode;
  destinationCurrency: CurrencyCode;
  amountSent: number;
  exchangeRate: number; // Always expressed as 1 MRU = X XOF in settings, or effective rate
  effectiveRateDisplay: string;
  feeInOrigin: number;
  feeInMru: number;
  netConvertibleAmount: number;
  estimatedReceived: number;
  isValid: boolean;
  validationError?: 'below_min' | 'above_max' | 'insufficient_for_fee' | 'invalid_number';
  minAllowedInOrigin: number;
  maxAllowedInOrigin: number;
}

export interface TransferRequest {
  id: string;
  direction: TransferDirection;
  originCurrency: CurrencyCode;
  destinationCurrency: CurrencyCode;
  amountSent: number;
  exchangeRate: number; // 1 MRU = X XOF
  fee: number; // In origin currency
  estimatedReceived: number; // In destination currency
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  receivingMethod: ReceivingMethod;
  receiptDataUrl: string;
  receiptFileName: string;
  receiptFileSize: number;
  receiptMimeType: string;
  status: TransferStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface CorridorSettings {
  exchangeRateMruToXof: number; // Default: 15.40
  fixedFeeMru: number; // Default: 25 MRU
  minTransferMru: number; // Default: 500 MRU
  maxTransferMru: number; // Default: 250000 MRU
  acceptingNewRequests: boolean; // Default: true
  aiSimulationEnabled: boolean; // Default: true
  aiModeLabel: string; // "Local Simulation — No OpenAI API"
  updatedAt: string;
}

export type AssistantIntent =
  | 'quote_calculation'
  | 'direction_inquiry'
  | 'rate_inquiry'
  | 'fee_inquiry'
  | 'track_transfer'
  | 'create_guide'
  | 'greeting'
  | 'out_of_scope';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  intent?: AssistantIntent;
  quote?: TransferQuote;
  trackedTransferId?: string;
  suggestedDirection?: TransferDirection;
  suggestedAmount?: number;
}

export interface CreateTransferInput {
  direction: TransferDirection;
  amountSent: number;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  receivingMethod: ReceivingMethod;
  receiptDataUrl: string;
  receiptFileName: string;
  receiptFileSize: number;
  receiptMimeType: string;
}

export interface DataService {
  getTransfers(): Promise<TransferRequest[]>;
  getTransferById(id: string): Promise<TransferRequest | null>;
  createTransfer(input: CreateTransferInput, settings: CorridorSettings): Promise<TransferRequest>;
  updateTransferStatus(
    id: string,
    status: 'accepted' | 'rejected',
    rejectionReason?: string
  ): Promise<TransferRequest>;
  getSettings(): Promise<CorridorSettings>;
  updateSettings(partial: Partial<CorridorSettings>): Promise<CorridorSettings>;
  getChatHistory(): Promise<ChatMessage[]>;
  saveChatHistory(messages: ChatMessage[]): Promise<void>;
  clearChatHistory(): Promise<ChatMessage[]>;
  resetDemoData(): Promise<{ transfers: TransferRequest[]; settings: CorridorSettings }>;
}

export interface AIServiceResponse {
  replyText: string;
  intent: AssistantIntent;
  quote?: TransferQuote;
  trackedTransferId?: string;
  suggestedDirection?: TransferDirection;
  suggestedAmount?: number;
}

export interface AIService {
  readonly modeLabel: string;
  processMessage(
    userMessage: string,
    language: Language,
    settings: CorridorSettings,
    existingTransfers: TransferRequest[]
  ): Promise<AIServiceResponse>;
}
