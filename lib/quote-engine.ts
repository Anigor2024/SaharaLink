import {
  CorridorSettings,
  TransferDirection,
  TransferQuote,
} from '@/types/corridor';

/**
 * Deterministic Quote Engine
 * Never uses AI for arithmetic. All calculations use standard financial rounding.
 */
export function calculateTransferQuote(
  rawAmountSent: number,
  direction: TransferDirection,
  settings: CorridorSettings
): TransferQuote {
  const rateMruToXof = Math.max(0.0001, Number(settings.exchangeRateMruToXof) || 15.4);
  const fixedFeeMru = Math.max(0, Number(settings.fixedFeeMru) || 25);
  const minMru = Math.max(1, Number(settings.minTransferMru) || 500);
  const maxMru = Math.max(minMru, Number(settings.maxTransferMru) || 250000);

  const amountSent = Number.isFinite(rawAmountSent) && rawAmountSent >= 0 ? rawAmountSent : 0;

  if (direction === 'MRU_TO_XOF') {
    const originCurrency = 'MRU';
    const destinationCurrency = 'XOF';
    const feeInOrigin = Math.round(fixedFeeMru * 100) / 100;
    const minAllowedInOrigin = minMru;
    const maxAllowedInOrigin = maxMru;

    const netConvertibleAmount = Math.max(0, Math.round((amountSent - feeInOrigin) * 100) / 100);
    const estimatedReceived = Math.round(netConvertibleAmount * rateMruToXof);

    let isValid = true;
    let validationError: TransferQuote['validationError'] = undefined;

    if (!Number.isFinite(rawAmountSent) || rawAmountSent <= 0) {
      isValid = false;
      validationError = 'invalid_number';
    } else if (amountSent <= feeInOrigin) {
      isValid = false;
      validationError = 'insufficient_for_fee';
    } else if (amountSent < minAllowedInOrigin) {
      isValid = false;
      validationError = 'below_min';
    } else if (amountSent > maxAllowedInOrigin) {
      isValid = false;
      validationError = 'above_max';
    }

    return {
      direction,
      originCurrency,
      destinationCurrency,
      amountSent,
      exchangeRate: rateMruToXof,
      effectiveRateDisplay: `1 MRU = ${rateMruToXof.toFixed(2)} XOF`,
      feeInOrigin,
      feeInMru: fixedFeeMru,
      netConvertibleAmount,
      estimatedReceived,
      isValid,
      validationError,
      minAllowedInOrigin,
      maxAllowedInOrigin,
    };
  } else {
    // XOF_TO_MRU
    const originCurrency = 'XOF';
    const destinationCurrency = 'MRU';
    const feeInOrigin = Math.round(fixedFeeMru * rateMruToXof);
    const minAllowedInOrigin = Math.round(minMru * rateMruToXof);
    const maxAllowedInOrigin = Math.round(maxMru * rateMruToXof);

    const netConvertibleAmount = Math.max(0, Math.round(amountSent - feeInOrigin));
    const estimatedReceived = Math.round((netConvertibleAmount / rateMruToXof) * 100) / 100;

    let isValid = true;
    let validationError: TransferQuote['validationError'] = undefined;

    if (!Number.isFinite(rawAmountSent) || rawAmountSent <= 0) {
      isValid = false;
      validationError = 'invalid_number';
    } else if (amountSent <= feeInOrigin) {
      isValid = false;
      validationError = 'insufficient_for_fee';
    } else if (amountSent < minAllowedInOrigin) {
      isValid = false;
      validationError = 'below_min';
    } else if (amountSent > maxAllowedInOrigin) {
      isValid = false;
      validationError = 'above_max';
    }

    const inverseRate = 1 / rateMruToXof;

    return {
      direction,
      originCurrency,
      destinationCurrency,
      amountSent,
      exchangeRate: rateMruToXof,
      effectiveRateDisplay: `100 XOF = ${(inverseRate * 100).toFixed(2)} MRU`,
      feeInOrigin,
      feeInMru: fixedFeeMru,
      netConvertibleAmount,
      estimatedReceived,
      isValid,
      validationError,
      minAllowedInOrigin,
      maxAllowedInOrigin,
    };
  }
}

/**
 * Formats a Date into YYMMDD dynamically (e.g., October 2, 2026 -> "261002")
 */
export function formatCorridorDateSegment(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Generates a calibrated Transfer ID dynamically in the format SL-YYMMDD-XXXX
 * (Technical Fix 1: Never hard-codes the date segment; prevents collisions)
 */
export function generateTransferId(
  existingIds: string[] = [],
  referenceDate: Date = new Date()
): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existingSet = new Set(existingIds.map((id) => id.toUpperCase()));
  const dateSegment = formatCorridorDateSegment(referenceDate);

  for (let attempt = 0; attempt < 64; attempt++) {
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const candidate = `SL-${dateSegment}-${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  const fallbackSuffix = Date.now().toString(36).slice(-4).toUpperCase().padStart(4, 'X');
  return `SL-${dateSegment}-${fallbackSuffix}`;
}

/**
 * Formats numbers cleanly with tabular spaces/commas
 */
export function formatCurrencyAmount(amount: number, currency: 'MRU' | 'XOF'): string {
  if (!Number.isFinite(amount)) return `0 ${currency}`;
  const isWhole = Math.abs(amount - Math.round(amount)) < 0.005;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Formats number only (without currency code) for high-hierarchy tabular displays
 */
export function formatTabularNumber(amount: number, maxDecimals: number = 2): string {
  if (!Number.isFinite(amount)) return '0';
  const isWhole = Math.abs(amount - Math.round(amount)) < 0.005;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWhole ? 0 : Math.min(2, maxDecimals),
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}

/**
 * Generates a realistic demo receipt SVG Data URL (for seeded requests)
 */
export function createDemoReceiptSvgDataUrl(params: {
  refCode: string;
  senderName: string;
  recipientName: string;
  amount: string;
  method: string;
  dateStr: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="820" viewBox="0 0 640 820">
    <rect width="640" height="820" fill="#FAF8F2"/>
    <rect x="28" y="28" width="584" height="764" fill="#FFFFFF" stroke="#14263D" stroke-width="1.5"/>
    <rect x="28" y="28" width="584" height="112" fill="#14263D"/>
    <text x="60" y="76" fill="#FAF8F2" font-family="monospace, sans-serif" font-size="20" font-weight="700" letter-spacing="2">SAHARALINK · DEMO RECEIPT</text>
    <text x="60" y="106" fill="#C9D1D0" font-family="monospace, sans-serif" font-size="13">PROTOTYPE VOUCHER — NON-FINANCIAL INSTRUMENT</text>
    <circle cx="556" cy="84" r="22" fill="none" stroke="#7FAEA3" stroke-width="2"/>
    <path d="M546 84 L553 91 L567 77" fill="none" stroke="#7FAEA3" stroke-width="2.5"/>

    <line x1="60" y1="190" x2="580" y2="190" stroke="#C9D1D0" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="60" y="174" fill="#7FAEA3" font-family="monospace, sans-serif" font-size="12" font-weight="600">RECEIPT REFERENCE</text>
    <text x="580" y="174" text-anchor="end" fill="#10161F" font-family="monospace, sans-serif" font-size="16" font-weight="700">${escapeXml(params.refCode)}</text>

    <rect x="60" y="218" width="520" height="110" fill="#F3F0E8" stroke="#C9D1D0" stroke-width="1"/>
    <text x="84" y="252" fill="#14263D" font-family="monospace, sans-serif" font-size="12">DECLARED TRANSFER AMOUNT</text>
    <text x="84" y="298" fill="#10161F" font-family="monospace, sans-serif" font-size="32" font-weight="700">${escapeXml(params.amount)}</text>

    <g font-family="monospace, sans-serif" font-size="14">
      <text x="60" y="384" fill="#64748B">PAYMENT CHANNEL</text>
      <text x="580" y="384" text-anchor="end" fill="#10161F" font-weight="700">${escapeXml(params.method)}</text>
      <line x1="60" y1="404" x2="580" y2="404" stroke="#E2E8F0" stroke-width="1"/>

      <text x="60" y="446" fill="#64748B">SENDER</text>
      <text x="580" y="446" text-anchor="end" fill="#10161F" font-weight="700">${escapeXml(params.senderName)}</text>
      <line x1="60" y1="466" x2="580" y2="466" stroke="#E2E8F0" stroke-width="1"/>

      <text x="60" y="508" fill="#64748B">BENEFICIARY</text>
      <text x="580" y="508" text-anchor="end" fill="#10161F" font-weight="700">${escapeXml(params.recipientName)}</text>
      <line x1="60" y1="528" x2="580" y2="528" stroke="#E2E8F0" stroke-width="1"/>

      <text x="60" y="570" fill="#64748B">TIMESTAMP</text>
      <text x="580" y="570" text-anchor="end" fill="#10161F" font-weight="600">${escapeXml(params.dateStr)}</text>
      <line x1="60" y1="590" x2="580" y2="590" stroke="#E2E8F0" stroke-width="1"/>

      <text x="60" y="632" fill="#64748B">CORRIDOR VERIFICATION</text>
      <text x="580" y="632" text-anchor="end" fill="#7FAEA3" font-weight="700">DEMO-STAMP-OK</text>
    </g>

    <rect x="60" y="680" width="520" height="72" fill="#FAF8F2" stroke="#14263D" stroke-width="1"/>
    <text x="320" y="712" text-anchor="middle" fill="#14263D" font-family="monospace, sans-serif" font-size="12" font-weight="700">DEMO RECEIPT FOR PROTOTYPE EVALUATION ONLY</text>
    <text x="320" y="734" text-anchor="middle" fill="#64748B" font-family="monospace, sans-serif" font-size="11">NO REAL FUNDS TRANSFERRED · MRU ↔ XOF CORRIDOR</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}
