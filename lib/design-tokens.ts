import { ReceivingMethod, TransferDirection } from '@/types/corridor';

/**
 * SaharaLink Design System & Motion Tokens
 * Engineered for "THE TRANSFER CORRIDOR" visual architecture.
 */
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
    // FAST: 120-160ms for micro-interactions, filter switches, focus states
    fast: {
      duration: 0.14,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
    // STANDARD: 180-260ms for step progression, quote calculation transitions
    standard: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
    // ENTER: 300-420ms for major panels, drawers, and confirmation states
    enter: {
      duration: 0.36,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
    spring: {
      type: 'spring' as const,
      stiffness: 310,
      damping: 30,
      mass: 0.85,
    },
    gentleSpring: {
      type: 'spring' as const,
      stiffness: 220,
      damping: 26,
    },
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
  coordinatesLabel: string;
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
    coordinatesLabel: '18.0735° N · 15.9582° W',
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
    coordinatesLabel: '05.3600° N · 04.0083° W',
  },
};

export interface ReceivingMethodMeta {
  id: ReceivingMethod;
  labelAr: string;
  labelFr: string;
  regionCode: 'XOF' | 'MRU';
  settlementNoteAr: string;
  settlementNoteFr: string;
  networkTag: string;
}

export const RECEIVING_METHODS: ReceivingMethodMeta[] = [
  {
    id: 'Orange Money',
    labelAr: 'Orange Money',
    labelFr: 'Orange Money',
    regionCode: 'XOF',
    settlementNoteAr: 'محفظة الهاتف المحمول — ساحل العاج (+225)',
    settlementNoteFr: 'Portefeuille mobile — Côte d’Ivoire (+225)',
    networkTag: 'OM · CI',
  },
  {
    id: 'Wave',
    labelAr: 'Wave',
    labelFr: 'Wave',
    regionCode: 'XOF',
    settlementNoteAr: 'تحويل فوري عبر شبكة Wave — ساحل العاج (+225)',
    settlementNoteFr: 'Réseau mobile Wave — Côte d’Ivoire (+225)',
    networkTag: 'WAVE · CI',
  },
  {
    id: 'MTN Money',
    labelAr: 'MTN Money',
    labelFr: 'MTN Money',
    regionCode: 'XOF',
    settlementNoteAr: 'خدمة MTN MoMo — ساحل العاج (+225)',
    settlementNoteFr: 'Service MTN MoMo — Côte d’Ivoire (+225)',
    networkTag: 'MTN · CI',
  },
  {
    id: 'Bankily',
    labelAr: 'بنكيلي (Bankily)',
    labelFr: 'Bankily',
    regionCode: 'MRU',
    settlementNoteAr: 'الخدمة المصرفية عبر الهاتف — موريتانيا (+222)',
    settlementNoteFr: 'Paiement bancaire mobile — Mauritanie (+222)',
    networkTag: 'BPM · MR',
  },
  {
    id: 'Masrivi',
    labelAr: 'مصرفي (Masrivi)',
    labelFr: 'Masrivi',
    regionCode: 'MRU',
    settlementNoteAr: 'محفظة مصرفي الرقمية — موريتانيا (+222)',
    settlementNoteFr: 'Portefeuille numérique Masrivi — Mauritanie (+222)',
    networkTag: 'BMCI · MR',
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

/**
 * Returns contextual receiving methods partitioned by destination relevance
 * so MRU -> XOF shows Orange Money, Wave, MTN Money first,
 * and XOF -> MRU shows Bankily, Masrivi first.
 */
export function getContextualReceivingMethods(direction: TransferDirection) {
  const targetRegion = direction === 'MRU_TO_XOF' ? 'XOF' : 'MRU';
  const primary = RECEIVING_METHODS.filter((m) => m.regionCode === targetRegion);
  const secondary = RECEIVING_METHODS.filter((m) => m.regionCode !== targetRegion);
  return { primary, secondary };
}
