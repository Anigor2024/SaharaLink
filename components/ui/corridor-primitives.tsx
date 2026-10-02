'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Globe,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { CORRIDOR_NODES, getOriginAndDestination } from '@/lib/design-tokens';
import {
  CurrencyCode,
  TimelineEvent,
  TransferDirection,
  TransferStatus,
} from '@/types/corridor';

/**
 * BrandMark
 * Minimal geometric architectural mark representing two locations connected by a controlled route.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1 px-1.5 py-1 border border-[#14263D]/25 bg-[#14263D] text-[#FAF8F2]"
      >
        <span className="w-1.5 h-1.5 bg-[#FAF8F2]" />
        <span className="w-3.5 h-[1.5px] bg-[#7FAEA3]" />
        <span className="w-1.5 h-1.5 border border-[#DE655A] bg-[#DE655A]" />
      </span>
      <span
        className={`font-semibold tracking-tight text-[#10161F] ${
          compact ? 'text-base' : 'text-lg'
        }`}
      >
        SaharaLink
      </span>
    </span>
  );
}

/**
 * DemoBanner
 * Discreet global notice required by prototype safety guidelines.
 */
export function DemoBanner() {
  const { dict } = useCorridor();

  return (
    <div
      role="region"
      aria-label="Prototype Disclosure"
      className="w-full bg-[#10161F] text-[#F3F0E8] border-b border-[#14263D] px-4 py-1.5 text-xs"
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-3.5 h-3.5 text-[#DE655A] shrink-0" aria-hidden="true" />
          <span className="truncate font-medium tracking-wide">
            {dict.demoBanner.notice}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#C9D1D0] font-mono shrink-0">
          <span>{dict.demoBanner.aiSimTag}</span>
          <span aria-hidden="true">·</span>
          <span>MRU ↔ XOF</span>
        </div>
      </div>
    </div>
  );
}

/**
 * StatusBadge
 * Non-color-only semantic status indicator with crisp architectural framing (no rounded pill capsules).
 */
export function StatusBadge({
  status,
  size = 'md',
}: {
  status: TransferStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const { dict } = useCorridor();
  const label = dict.tracking.statuses[status];

  const sizeClasses =
    size === 'sm'
      ? 'text-xs py-0.5 px-2 gap-1.5'
      : size === 'lg'
      ? 'text-sm py-1.5 px-3.5 gap-2'
      : 'text-xs py-1 px-2.5 gap-1.5';

  if (status === 'accepted') {
    return (
      <span
        className={`inline-flex items-center font-medium border border-[#7FAEA3]/50 bg-[#7FAEA3]/15 text-[#14263D] whitespace-nowrap shrink-0 ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6B5F] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center font-medium border border-[#DE655A]/50 bg-[#DE655A]/12 text-[#8C2D25] whitespace-nowrap shrink-0 ${sizeClasses}`}
      >
        <XCircle className="w-3.5 h-3.5 text-[#DE655A] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium border border-[#14263D]/30 bg-[#F3F0E8] text-[#14263D] whitespace-nowrap shrink-0 ${sizeClasses}`}
    >
      <Clock className="w-3.5 h-3.5 text-[#14263D] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * RouteIndicator
 * Displays the origin and destination stations along a calibrated corridor line.
 */
export function RouteIndicator({
  direction,
  compact = false,
}: {
  direction: TransferDirection;
  compact?: boolean;
}) {
  const { language, dir } = useCorridor();
  const { origin, destination } = getOriginAndDestination(direction);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-mono tabular-nums text-[#14263D]">
        <span className="font-semibold">{origin.code}</span>
        <span className="text-[#C9D1D0]">───</span>
        <ArrowIcon className="w-3.5 h-3.5 text-[#7FAEA3] shrink-0" aria-hidden="true" />
        <span className="font-semibold">{destination.code}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3.5 bg-[#F3F0E8]/70 border border-[#C9D1D0]/70">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#14263D] shrink-0" />
          <span className="font-mono text-xs font-semibold text-[#10161F]">
            {origin.code} · {origin.stationCode}
          </span>
        </div>
        <p className="text-xs text-[#14263D]/80 truncate mt-0.5">
          {language === 'ar'
            ? `${origin.countryAr} (${origin.cityAr})`
            : `${origin.countryFr} (${origin.cityFr})`}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-2 max-w-[140px]">
        <div className="w-full flex items-center gap-1">
          <div className="h-[1px] flex-1 bg-[#14263D]/30 relative overflow-hidden">
            <motion.div
              className="absolute inset-y-0 w-1/2 bg-[#7FAEA3]"
              animate={{ x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <ArrowIcon className="w-3.5 h-3.5 text-[#14263D] shrink-0" aria-hidden="true" />
          <div className="h-[1px] flex-1 bg-[#14263D]/30" />
        </div>
      </div>

      <div className="min-w-0 text-end">
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-mono text-xs font-semibold text-[#10161F]">
            {destination.code} · {destination.stationCode}
          </span>
          <span className="w-2 h-2 bg-[#7FAEA3] shrink-0" />
        </div>
        <p className="text-xs text-[#14263D]/80 truncate mt-0.5">
          {language === 'ar'
            ? `${destination.countryAr} (${destination.cityAr})`
            : `${destination.countryFr} (${destination.cityFr})`}
        </p>
      </div>
    </div>
  );
}

/**
 * AmountDisplay
 * Tabular numeral monetary figure with clean currency designation.
 */
export function AmountDisplay({
  amount,
  currency,
  size = 'md',
  highlight = false,
}: {
  amount: number;
  currency: CurrencyCode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlight?: boolean;
}) {
  const isWhole = Math.abs(amount - Math.round(amount)) < 0.005;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

  const sizeClass =
    size === 'xl'
      ? 'text-2xl sm:text-3xl font-semibold'
      : size === 'lg'
      ? 'text-xl font-semibold'
      : size === 'sm'
      ? 'text-xs font-medium'
      : 'text-base font-semibold';

  return (
    <span
      dir="ltr"
      className={`inline-flex items-baseline gap-1.5 font-mono tabular-nums ${sizeClass} ${
        highlight ? 'text-[#14263D]' : 'text-[#10161F]'
      }`}
    >
      <span>{formattedNumber}</span>
      <span className="text-[0.75em] font-medium text-[#14263D]/75">{currency}</span>
    </span>
  );
}

/**
 * TransferTimeline
 * Progressive architectural timeline showing the controlled journey of a transfer request.
 */
export function TransferTimeline({
  status,
  timeline,
  rejectionReason,
}: {
  status: TransferStatus;
  timeline: TimelineEvent[];
  rejectionReason?: string;
}) {
  const { dict, language } = useCorridor();

  const findTimestamp = (stepKey: TimelineEvent['step']) => {
    const found = timeline.find((t) => t.step === stepKey);
    if (!found) return null;
    try {
      const date = new Date(found.timestamp);
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-MR' : 'fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return found.timestamp;
    }
  };

  const finalStepKey: 'accepted' | 'rejected' =
    status === 'rejected' ? 'rejected' : 'accepted';

  const steps = [
    {
      key: 'created' as const,
      title: dict.tracking.timelineSteps.created.title,
      desc: dict.tracking.timelineSteps.created.desc,
      state: 'completed' as const,
      time: findTimestamp('created'),
    },
    {
      key: 'receipt_uploaded' as const,
      title: dict.tracking.timelineSteps.receipt_uploaded.title,
      desc: dict.tracking.timelineSteps.receipt_uploaded.desc,
      state: 'completed' as const,
      time: findTimestamp('receipt_uploaded'),
    },
    {
      key: 'under_review' as const,
      title: dict.tracking.timelineSteps.under_review.title,
      desc: dict.tracking.timelineSteps.under_review.desc,
      state: status === 'pending' ? ('active' as const) : ('completed' as const),
      time: findTimestamp('under_review'),
    },
    {
      key: finalStepKey,
      title:
        status === 'rejected'
          ? dict.tracking.timelineSteps.rejected.title
          : dict.tracking.timelineSteps.accepted.title,
      desc:
        status === 'rejected'
          ? rejectionReason || dict.tracking.timelineSteps.rejected.desc
          : dict.tracking.timelineSteps.accepted.desc,
      state:
        status === 'pending'
          ? ('upcoming' as const)
          : status === 'accepted'
          ? ('accepted' as const)
          : ('rejected' as const),
      time: findTimestamp(finalStepKey),
    },
  ];

  return (
    <div className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        let nodeStyle = 'border-[#C9D1D0] bg-[#FAF8F2] text-[#14263D]/40';
        let lineStyle = 'bg-[#C9D1D0]';

        if (step.state === 'completed') {
          nodeStyle = 'border-[#14263D] bg-[#14263D] text-[#FAF8F2]';
          lineStyle = 'bg-[#14263D]';
        } else if (step.state === 'active') {
          nodeStyle = 'border-[#14263D] bg-[#FAF8F2] text-[#14263D] ring-4 ring-[#14263D]/10';
          lineStyle = 'bg-[#C9D1D0]';
        } else if (step.state === 'accepted') {
          nodeStyle = 'border-[#7FAEA3] bg-[#7FAEA3] text-[#10161F]';
        } else if (step.state === 'rejected') {
          nodeStyle = 'border-[#DE655A] bg-[#DE655A] text-[#FAF8F2]';
        }

        return (
          <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical Corridor Rail */}
            {!isLast && (
              <div
                aria-hidden="true"
                className={`absolute top-7 bottom-0 start-[13px] w-[1.5px] ${lineStyle}`}
              />
            )}

            {/* Calibrated Station Node */}
            <div
              className={`relative z-10 w-7 h-7 shrink-0 border flex items-center justify-center transition-colors ${nodeStyle}`}
            >
              {step.state === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {step.state === 'active' && <Clock className="w-3.5 h-3.5 animate-pulse" />}
              {step.state === 'accepted' && <CheckCircle2 className="w-4 h-4" />}
              {step.state === 'rejected' && <AlertTriangle className="w-3.5 h-3.5" />}
              {step.state === 'upcoming' && (
                <span className="font-mono text-[10px]">0{index + 1}</span>
              )}
            </div>

            {/* Station Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4
                  className={`text-sm font-semibold ${
                    step.state === 'upcoming' ? 'text-[#14263D]/50' : 'text-[#10161F]'
                  }`}
                >
                  {step.title}
                </h4>
                {step.time && (
                  <span className="text-[11px] font-mono tabular-nums text-[#14263D]/70">
                    {step.time}
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  step.state === 'rejected'
                    ? 'text-[#8C2D25] font-medium bg-[#DE655A]/10 border-s-2 border-[#DE655A] ps-2.5 py-1.5 mt-1.5'
                    : step.state === 'upcoming'
                    ? 'text-[#14263D]/40'
                    : 'text-[#14263D]/75'
                }`}
              >
                {step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * ReceiptPreview
 * Displays an uploaded or seeded demo receipt image with lightbox zoom, replace, and remove actions.
 */
export function ReceiptPreview({
  dataUrl,
  fileName,
  fileSize,
  onReplace,
  onRemove,
  readonly = false,
}: {
  dataUrl: string;
  fileName: string;
  fileSize?: number;
  onReplace?: () => void;
  onRemove?: () => void;
  readonly?: boolean;
}) {
  const { dict } = useCorridor();
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const formattedSize = fileSize
    ? `${(fileSize / 1024).toFixed(1)} KB`
    : 'DEMO VOUCHER';

  return (
    <>
      <div className="border border-[#C9D1D0] bg-[#FAF8F2] p-3">
        <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-[#C9D1D0]/60">
          <div className="flex items-center gap-2 min-w-0">
            <FileCheck2 className="w-4 h-4 text-[#2C6B5F] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-mono font-medium text-[#10161F] truncate">
                {fileName}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-[#14263D]/65">
                {formattedSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#14263D] bg-[#F3F0E8] hover:bg-[#14263D] hover:text-[#FAF8F2] border border-[#C9D1D0] transition-colors whitespace-nowrap min-h-[36px]"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{dict.admin.drawer.zoomReceipt}</span>
            </button>
            {!readonly && onReplace && (
              <button
                type="button"
                onClick={onReplace}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#14263D] hover:bg-[#F3F0E8] border border-[#C9D1D0] transition-colors whitespace-nowrap min-h-[36px]"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{dict.transferFlow.receipt.replaceImage}</span>
              </button>
            )}
            {!readonly && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={dict.transferFlow.receipt.removeImage}
                className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-[#8C2D25] hover:bg-[#DE655A]/15 border border-[#DE655A]/40 transition-colors min-h-[36px] min-w-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div
          onClick={() => setIsZoomOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsZoomOpen(true);
          }}
          className="relative group cursor-pointer overflow-hidden bg-[#10161F]/5 border border-[#C9D1D0]/60 max-h-[260px] flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={fileName}
            referrerPolicy="no-referrer"
            className="max-h-[250px] w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[#10161F]/0 group-hover:bg-[#10161F]/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-[#10161F] text-[#FAF8F2] text-xs font-medium inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{dict.admin.drawer.zoomReceipt}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for full receipt inspection */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#10161F]/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative max-w-2xl w-full bg-[#FAF8F2] border border-[#14263D] p-4 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-[#C9D1D0]">
                <span className="font-mono text-xs font-semibold text-[#10161F] truncate">
                  {fileName} ({formattedSize})
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] transition-colors min-h-[36px]"
                >
                  <X className="w-4 h-4" />
                  <span>{dict.admin.drawer.close}</span>
                </button>
              </div>
              <div className="overflow-auto flex-1 flex items-center justify-center bg-[#F3F0E8] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={fileName}
                  referrerPolicy="no-referrer"
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * LanguageSwitcher
 * Instant toggle between Arabic (RTL) and French (LTR).
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useCorridor();

  return (
    <div
      role="group"
      aria-label="Language Switcher"
      className="inline-flex items-center border border-[#C9D1D0] bg-[#F3F0E8] p-0.5"
    >
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] ${
          language === 'ar'
            ? 'bg-[#14263D] text-[#FAF8F2]'
            : 'text-[#14263D] hover:text-[#10161F]'
        }`}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap min-h-[32px] ${
          language === 'fr'
            ? 'bg-[#14263D] text-[#FAF8F2]'
            : 'text-[#14263D] hover:text-[#10161F]'
        }`}
      >
        FR
      </button>
    </div>
  );
}
