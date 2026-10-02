import { ReceivingMethod, TransferDirection } from '@/types/corridor';

export const DESIGN_TOKENS = {
  colors: {
    mineralNavy: '#14263D',
    deepInk: '#10161F',
    porcelain: '#F3F0E8',
    warmPaper: '#FAF8F2',
    signalCoral: '#DE655A',
    mutedSeaGlass: '#7FAEA3',
    silverMist: '#C9D1D0',
  },
  motion: {
    spring: { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.8 },
    gentleSpring: { type: 'spring' as const, stiffness: 220, damping: 26 },
    snappyEase: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
} as const;

export interface CorridorNodeMeta {
  code: 'MRU' | 'XOF';
  stationCode: 'NKC' | 'ABJ';
  countryAr: string;
  countryFr: string;
  cityAr: string;
  cityFr: string;
  currencyNameAr: string;
  currencyNameFr: string;
  phonePrefix: string;
  phonePlaceholder: string;
}

export const CORRIDOR_NODES: Record<'MRU' | 'XOF', CorridorNodeMeta> = {
  MRU: {
    code: 'MRU',
    stationCode: 'NKC',
    countryAr: 'موريتانيا',
    countryFr: 'Mauritanie',
    cityAr: 'نواكشوط',
    cityFr: 'Nouakchott',
    currencyNameAr: 'أوقية موريتانية',
    currencyNameFr: 'Ouguiya mauritanien',
    phonePrefix: '+222',
    phonePlaceholder: '+222 36 12 45 78',
  },
  XOF: {
    code: 'XOF',
    stationCode: 'ABJ',
    countryAr: 'ساحل العاج',
    countryFr: 'Côte d’Ivoire',
    cityAr: 'أبيدجان',
    cityFr: 'Abidjan',
    currencyNameAr: 'فرنك غرب أفريقي',
    currencyNameFr: 'Franc CFA (BCEAO)',
    phonePrefix: '+225',
    phonePlaceholder: '+225 07 08 42 19 30',
  },
};

export interface ReceivingMethodMeta {
  id: ReceivingMethod;
  labelAr: string;
  labelFr: string;
  regionCode: 'XOF' | 'MRU' | 'BOTH';
  settlementNoteAr: string;
  settlementNoteFr: string;
}

export const RECEIVING_METHODS: ReceivingMethodMeta[] = [
  {
    id: 'Orange Money',
    labelAr: 'Orange Money',
    labelFr: 'Orange Money',
    regionCode: 'XOF',
    settlementNoteAr: 'محفظة الهاتف المحمول — ساحل العاج',
    settlementNoteFr: 'Portefeuille mobile — Côte d’Ivoire',
  },
  {
    id: 'Wave',
    labelAr: 'Wave',
    labelFr: 'Wave',
    regionCode: 'XOF',
    settlementNoteAr: 'تحويل فوري عبر شبكة Wave — ساحل العاج',
    settlementNoteFr: 'Réseau mobile Wave — Côte d’Ivoire',
  },
  {
    id: 'MTN Money',
    labelAr: 'MTN Money',
    labelFr: 'MTN Money',
    regionCode: 'XOF',
    settlementNoteAr: 'خدمة MTN MoMo — ساحل العاج',
    settlementNoteFr: 'Service MTN MoMo — Côte d’Ivoire',
  },
  {
    id: 'Bankily',
    labelAr: 'بنكيلي (Bankily)',
    labelFr: 'Bankily',
    regionCode: 'MRU',
    settlementNoteAr: 'خدمة الدفع المصرفي عبر الهاتف — موريتانيا',
    settlementNoteFr: 'Paiement bancaire mobile — Mauritanie',
  },
  {
    id: 'Masrivi',
    labelAr: 'مصرفي (Masrivi)',
    labelFr: 'Masrivi',
    regionCode: 'MRU',
    settlementNoteAr: 'محفظة مصرفي الرقمية — موريتانيا',
    settlementNoteFr: 'Portefeuille numérique Masrivi — Mauritanie',
  },
];

export function getOriginAndDestination(direction: TransferDirection) {
  if (direction === 'MRU_TO_XOF') {
    return {
      origin: CORRIDOR_NODES.MRU,
      destination: CORRIDOR_NODES.XOF,
    };
  }
  return {
    origin: CORRIDOR_NODES.XOF,
    destination: CORRIDOR_NODES.MRU,
  };
}
