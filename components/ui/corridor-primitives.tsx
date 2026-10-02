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
  Maximize2,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  CorridorNodeMeta,
  DESIGN_TOKENS,
  getOriginAndDestination,
} from '@/lib/design-tokens';
import { formatTabularNumber } from '@/lib/quote-engine';
import {
  CurrencyCode,
  TimelineEvent,
  TransferDirection,
  TransferStatus,
} from '@/types/corridor';

/**
 * BrandMark
 * Architectural mark representing two locations (Nouakchott & Abidjan) connected by a controlled route.
 */
export function BrandMark({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        aria-hidden="true"
        className={`inline-flex items-center gap-1 px-1.5 py-1 border ${
          inverted
            ? 'border-[#C9D1D0]/30 bg-[#10161F] text-[#FAF8F2]'
            : 'border-[#14263D]/30 bg-[#14263D] text-[#FAF8F2]'
        }`}
      >
        <span className="w-1.5 h-1.5 bg-[#FAF8F2]" />
        <span className="w-4 h-[1.5px] bg-[#7FAEA3]" />
        <span className="w-1.5 h-1.5 bg-[#DE655A]" />
      </span>
      <span
        className={`font-semibold tracking-tight ${
          inverted ? 'text-[#FAF8F2]' : 'text-[#10161F]'
        } ${compact ? 'text-base' : 'text-lg'}`}
      >
        SaharaLink
      </span>
    </span>
  );
}

/**
 * DemoBanner
 * Tasteful, persistent global prototype disclosure + storage error recovery notice.
 */
export function DemoBanner() {
  const { dict, settings, storageError, dismissStorageError, resetAllDemoData } =
    useCorridor();

  return (
    <div role="region" aria-label="Prototype Disclosure" className="w-full">
      <div className="w-full bg-[#10161F] text-[#F3F0E8] border-b border-[#14263D] px-4 sm:px-6 py-1.5 text-xs">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 bg-[#DE655A] shrink-0" aria-hidden="true" />
            <span className="truncate font-medium tracking-wide text-[#F3F0E8]/90">
              {dict.demoBanner.notice}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-[#C9D1D0] font-mono tabular-nums shrink-0">
            <span>NKC (MRU) ↔ ABJ (XOF)</span>
            <span aria-hidden="true" className="text-[#7FAEA3]">
              ·
            </span>
            <span>1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF</span>
            <span aria-hidden="true" className="text-[#7FAEA3]">
              ·
            </span>
            <span className="text-[#7FAEA3]">{dict.demoBanner.aiSimDetail}</span>
          </div>
        </div>
      </div>

      {storageError && (
        <div
          role="alert"
          className="w-full bg-[#DE655A] text-[#FAF8F2] px-4 sm:px-6 py-2 text-xs font-medium"
        >
          <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{storageError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAllDemoData}
                className="px-2.5 py-1 bg-[#10161F] text-[#FAF8F2] font-mono text-[11px] cursor-pointer"
              >
                {dict.admin.settings.resetDemoBtn}
              </button>
              <button
                type="button"
                onClick={dismissStorageError}
                aria-label="Dismiss"
                className="p-1 hover:bg-[#10161F]/20 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RouteNode
 * Displays a calibrated origin or destination station node.
 */
export function RouteNode({
  node,
  role,
  align = 'start',
  inverted = false,
}: {
  node: CorridorNodeMeta;
  role: 'origin' | 'destination';
  align?: 'start' | 'end';
  inverted?: boolean;
}) {
  const { language } = useCorridor();
  const isEnd = align === 'end';

  return (
    <div className={`min-w-0 ${isEnd ? 'text-end' : 'text-start'}`}>
      <div
        className={`inline-flex items-center gap-1.5 ${
          isEnd ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <span
          aria-hidden="true"
          className={`w-2 h-2 shrink-0 ${
            role === 'origin'
              ? inverted
                ? 'bg-[#FAF8F2]'
                : 'bg-[#14263D]'
              : 'bg-[#7FAEA3]'
          }`}
        />
        <span
          className={`font-mono text-xs font-bold tracking-wider ${
            inverted ? 'text-[#FAF8F2]' : 'text-[#10161F]'
          }`}
        >
          {node.stationCode} · {node.code}
        </span>
      </div>
      <p
        className={`text-xs font-medium truncate mt-0.5 ${
          inverted ? 'text-[#C9D1D0]' : 'text-[#14263D]/85'
        }`}
      >
        {language === 'ar'
          ? `${node.countryAr} (${node.cityAr})`
          : `${node.countryFr} (${node.cityFr})`}
      </p>
    </div>
  );
}

/**
 * TransferRoute (and RouteIndicator alias)
 * Calibrated route line connecting Origin and Destination with animated signal pulse and ticks.
 */
export function TransferRoute({
  direction,
  compact = false,
  inverted = false,
  centerLabel,
}: {
  direction: TransferDirection;
  compact?: boolean;
  inverted?: boolean;
  centerLabel?: string;
}) {
  const { dir } = useCorridor();
  const prefersReducedMotion = useReducedMotion();
  const { origin, destination } = getOriginAndDestination(direction);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 text-xs font-mono tabular-nums ${
          inverted ? 'text-[#FAF8F2]' : 'text-[#14263D]'
        }`}
      >
        <span className="font-bold">{origin.code}</span>
        <span className="opacity-50">──</span>
        <ArrowIcon className="w-3.5 h-3.5 text-[#7FAEA3] shrink-0" aria-hidden="true" />
        <span className="font-bold">{destination.code}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 px-4 border ${
        inverted
          ? 'bg-[#10161F]/90 border-[#C9D1D0]/20 text-[#FAF8F2]'
          : 'bg-[#F3F0E8]/70 border-[#14263D]/20 text-[#10161F]'
      }`}
    >
      <RouteNode node={origin} role="origin" align="start" inverted={inverted} />

      <div className="flex-1 flex flex-col items-center justify-center px-2 max-w-[220px]">
        {centerLabel && (
          <span
            dir="ltr"
            className={`text-[10px] font-mono tabular-nums mb-1 ${
              inverted ? 'text-[#7FAEA3]' : 'text-[#14263D]/75'
            }`}
          >
            {centerLabel}
          </span>
        )}
        <div className="w-full flex items-center gap-1.5">
          <div
            className={`h-[1.5px] flex-1 relative overflow-hidden ${
              inverted ? 'bg-[#C9D1D0]/25' : 'bg-[#14263D]/25'
            }`}
          >
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-y-0 w-1/2 bg-[#7FAEA3]"
                animate={{ x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
          <ArrowIcon
            className={`w-3.5 h-3.5 shrink-0 ${
              inverted ? 'text-[#7FAEA3]' : 'text-[#14263D]'
            }`}
            aria-hidden="true"
          />
          <div
            className={`h-[1.5px] flex-1 ${
              inverted ? 'bg-[#C9D1D0]/25' : 'bg-[#14263D]/25'
            }`}
          />
        </div>
      </div>

      <RouteNode node={destination} role="destination" align="end" inverted={inverted} />
    </div>
  );
}

export const RouteIndicator = TransferRoute;

/**
 * StatusBadge
 * Non-color-only semantic status indicator with crisp architectural framing.
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
        className={`inline-flex items-center font-semibold border border-[#7FAEA3] bg-[#7FAEA3]/20 text-[#10161F] whitespace-nowrap shrink-0 ${sizeClasses}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5C50] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center font-semibold border border-[#DE655A] bg-[#DE655A]/15 text-[#7A221B] whitespace-nowrap shrink-0 ${sizeClasses}`}
      >
        <XCircle className="w-3.5 h-3.5 text-[#DE655A] shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold border border-[#14263D]/40 bg-[#F3F0E8] text-[#14263D] whitespace-nowrap shrink-0 ${sizeClasses}`}
    >
      <Clock className="w-3.5 h-3.5 text-[#DE655A] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/**
 * AmountDisplay
 * Tabular numeral monetary figure with clean currency designation and optional dramatic scale.
 */
export function AmountDisplay({
  amount,
  currency,
  size = 'md',
  highlight = false,
  inverted = false,
}: {
  amount: number;
  currency: CurrencyCode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  highlight?: boolean;
  inverted?: boolean;
}) {
  const formattedNumber = formatTabularNumber(amount);

  const sizeClass =
    size === '2xl'
      ? 'text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-none'
      : size === 'xl'
      ? 'text-2xl sm:text-3xl font-bold tracking-tight'
      : size === 'lg'
      ? 'text-xl font-semibold'
      : size === 'sm'
      ? 'text-xs font-semibold'
      : 'text-base font-semibold';

  const colorClass = inverted
    ? highlight
      ? 'text-[#7FAEA3]'
      : 'text-[#FAF8F2]'
    : highlight
    ? 'text-[#14263D]'
    : 'text-[#10161F]';

  return (
    <span
      dir="ltr"
      className={`inline-flex items-baseline gap-1.5 font-mono tabular-nums ${sizeClass} ${colorClass}`}
    >
      <span>{formattedNumber}</span>
      <span
        className={`text-[0.62em] font-semibold tracking-wider ${
          inverted ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
        }`}
      >
        {currency}
      </span>
    </span>
  );
}

/**
 * TransferTimeline
 * Operational ledger timeline showing Timestamp, Actor, Station code, and calibrated progress rail.
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

  const findEvent = (stepKey: TimelineEvent['step']) => {
    return timeline.find((t) => t.step === stepKey) || null;
  };

  const formatEventTime = (iso?: string) => {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-MR' : 'fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  };

  const finalStepKey: 'accepted' | 'rejected' =
    status === 'rejected' ? 'rejected' : 'accepted';

  const steps = [
    {
      key: 'created' as const,
      code: dict.tracking.timelineSteps.created.code,
      title: dict.tracking.timelineSteps.created.title,
      desc: dict.tracking.timelineSteps.created.desc,
      state: 'completed' as const,
      event: findEvent('created'),
      defaultActor: 'customer' as const,
    },
    {
      key: 'receipt_uploaded' as const,
      code: dict.tracking.timelineSteps.receipt_uploaded.code,
      title: dict.tracking.timelineSteps.receipt_uploaded.title,
      desc: dict.tracking.timelineSteps.receipt_uploaded.desc,
      state: 'completed' as const,
      event: findEvent('receipt_uploaded'),
      defaultActor: 'customer' as const,
    },
    {
      key: 'under_review' as const,
      code: dict.tracking.timelineSteps.under_review.code,
      title: dict.tracking.timelineSteps.under_review.title,
      desc: dict.tracking.timelineSteps.under_review.desc,
      state: status === 'pending' ? ('active' as const) : ('completed' as const),
      event: findEvent('under_review'),
      defaultActor: 'system' as const,
    },
    {
      key: finalStepKey,
      code:
        status === 'rejected'
          ? dict.tracking.timelineSteps.rejected.code
          : dict.tracking.timelineSteps.accepted.code,
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
      event: findEvent(finalStepKey),
      defaultActor: 'admin' as const,
    },
  ];

  return (
    <div className="relative space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const formattedTime = formatEventTime(step.event?.timestamp);
        const actorKey = step.event?.actor || step.defaultActor;
        const actorLabel = dict.tracking.actors[actorKey];

        let nodeStyle = 'border-[#C9D1D0] bg-[#FAF8F2] text-[#14263D]/40';
        let lineStyle = 'bg-[#C9D1D0]';

        if (step.state === 'completed') {
          nodeStyle = 'border-[#14263D] bg-[#14263D] text-[#FAF8F2]';
          lineStyle = 'bg-[#14263D]';
        } else if (step.state === 'active') {
          nodeStyle =
            'border-[#DE655A] bg-[#14263D] text-[#FAF8F2] ring-4 ring-[#DE655A]/20';
          lineStyle = 'bg-[#C9D1D0]';
        } else if (step.state === 'accepted') {
          nodeStyle = 'border-[#14263D] bg-[#7FAEA3] text-[#10161F]';
        } else if (step.state === 'rejected') {
          nodeStyle = 'border-[#10161F] bg-[#DE655A] text-[#FAF8F2]';
        }

        return (
          <div key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Vertical Calibrated Rail */}
            {!isLast && (
              <div
                aria-hidden="true"
                className={`absolute top-8 bottom-0 start-[15px] w-[1.5px] ${lineStyle}`}
              />
            )}

            {/* Waypoint Node */}
            <div
              className={`relative z-10 w-8 h-8 shrink-0 border flex items-center justify-center transition-colors ${nodeStyle}`}
            >
              {step.state === 'completed' && <CheckCircle2 className="w-4 h-4" />}
              {step.state === 'active' && (
                <Clock className="w-4 h-4 text-[#DE655A] animate-pulse" />
              )}
              {step.state === 'accepted' && <CheckCircle2 className="w-4 h-4" />}
              {step.state === 'rejected' && <AlertTriangle className="w-4 h-4" />}
              {step.state === 'upcoming' && (
                <span className="font-mono text-[10px] font-bold">0{index + 1}</span>
              )}
            </div>

            {/* Station Ledger Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] font-bold tracking-wider ${
                      step.state === 'active'
                        ? 'text-[#DE655A]'
                        : step.state === 'accepted'
                        ? 'text-[#1F5C50]'
                        : step.state === 'rejected'
                        ? 'text-[#DE655A]'
                        : 'text-[#14263D]/60'
                    }`}
                  >
                    0{index + 1} · {step.code}
                  </span>
                </div>
                {formattedTime && (
                  <span className="text-[11px] font-mono tabular-nums text-[#14263D]/75">
                    {formattedTime}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-2 mt-0.5">
                <h4
                  className={`text-sm font-semibold ${
                    step.state === 'upcoming' ? 'text-[#14263D]/45' : 'text-[#10161F]'
                  }`}
                >
                  {step.title}
                </h4>
                {step.state !== 'upcoming' && (
                  <span className="text-[11px] font-mono text-[#14263D]/60">
                    {actorLabel}
                  </span>
                )}
              </div>

              <p
                className={`text-xs mt-1 leading-relaxed ${
                  step.state === 'rejected'
                    ? 'text-[#7A221B] font-medium bg-[#DE655A]/12 border-s-2 border-[#DE655A] ps-3 py-2 mt-2'
                    : step.state === 'upcoming'
                    ? 'text-[#14263D]/40'
                    : 'text-[#14263D]/80'
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
 * Verification-style voucher display with format badge, size, lightbox zoom, replace, and remove actions.
 */
export function ReceiptPreview({
  dataUrl,
  fileName,
  fileSize,
  mimeType,
  onReplace,
  onRemove,
  readonly = false,
}: {
  dataUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  onReplace?: () => void;
  onRemove?: () => void;
  readonly?: boolean;
}) {
  const { dict } = useCorridor();
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const formattedSize = fileSize
    ? `${(fileSize / 1024).toFixed(1)} KB`
    : 'INDEXED VOUCHER';

  const formatBadge = mimeType
    ? mimeType.replace('image/', '').toUpperCase()
    : fileName.split('.').pop()?.toUpperCase() || 'IMG';

  return (
    <>
      <div className="border border-[#14263D]/25 bg-[#FAF8F2]">
        {/* Voucher Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F3F0E8] border-b border-[#C9D1D0]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-[#14263D] text-[#7FAEA3] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-semibold text-[#10161F] truncate">
                {fileName}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[#14263D]/70">
                <span>{formatBadge}</span>
                <span aria-hidden="true">·</span>
                <span>{formattedSize}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14263D] bg-[#FAF8F2] hover:bg-[#14263D] hover:text-[#FAF8F2] border border-[#14263D]/30 transition-colors whitespace-nowrap min-h-[36px] cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{dict.admin.drawer.zoomReceipt}</span>
            </button>
            {!readonly && onReplace && (
              <button
                type="button"
                onClick={onReplace}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#14263D] bg-[#FAF8F2] hover:bg-[#14263D] hover:text-[#FAF8F2] border border-[#14263D]/30 transition-colors whitespace-nowrap min-h-[36px] cursor-pointer"
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
                className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-[#7A221B] bg-[#FAF8F2] hover:bg-[#DE655A] hover:text-[#FAF8F2] border border-[#DE655A]/50 transition-colors min-h-[36px] min-w-[36px] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Voucher Canvas Frame */}
        <div
          onClick={() => setIsZoomOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setIsZoomOpen(true);
          }}
          className="relative group cursor-pointer overflow-hidden bg-[#10161F]/5 p-3 max-h-[280px] flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={fileName}
            referrerPolicy="no-referrer"
            className="max-h-[250px] w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[#10161F]/0 group-hover:bg-[#10161F]/25 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3.5 py-2 bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#7FAEA3]" />
              <span>{dict.admin.drawer.zoomReceipt}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Inspection Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={DESIGN_TOKENS.motion.fast}
            className="fixed inset-0 z-50 bg-[#10161F]/90 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={DESIGN_TOKENS.motion.standard}
              className="relative max-w-2xl w-full bg-[#FAF8F2] border border-[#14263D] p-4 max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-[#C9D1D0]">
                <span className="font-mono text-xs font-semibold text-[#10161F] truncate">
                  {fileName} · {formatBadge} · {formattedSize}
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] transition-colors min-h-[36px] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>{dict.admin.drawer.close}</span>
                </button>
              </div>
              <div className="overflow-auto flex-1 flex items-center justify-center bg-[#F3F0E8] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={fileName}
                  referrerPolicy="no-referrer"
                  className="max-h-[76vh] w-auto object-contain"
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
 * DecisionBar
 * Dedicated operational decision surface for Admin (Accept / Reject with confirmation & note).
 * Designed to anchor cleanly in the mobile thumb zone or desktop inspector.
 */
export function DecisionBar({
  status,
  onAccept,
  onReject,
}: {
  status: TransferStatus;
  onAccept: () => void;
  onReject: (reason: string) => void;
}) {
  const { dict } = useCorridor();
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  return (
    <div className="bg-[#F3F0E8] border-t-2 border-[#14263D] p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-[#14263D] tracking-wider">
          {dict.admin.drawer.decisionBox}
        </span>
        <span className="text-[11px] text-[#14263D]/75">
          {status === 'pending'
            ? dict.admin.drawer.decisionHint
            : dict.admin.drawer.alreadyDecidedNote}
        </span>
      </div>

      {!isConfirmingReject ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="py-3.5 px-4 bg-[#7FAEA3] hover:bg-[#6a9c90] active:scale-[0.99] text-[#10161F] font-semibold text-sm inline-flex items-center justify-center gap-2 border border-[#14263D] transition-all min-h-[48px] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{dict.admin.drawer.acceptBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfirmingReject(true)}
            className="py-3.5 px-4 bg-[#DE655A] hover:bg-[#c85247] active:scale-[0.99] text-[#FAF8F2] font-semibold text-sm inline-flex items-center justify-center gap-2 border border-[#10161F] transition-all min-h-[48px] cursor-pointer"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{dict.admin.drawer.rejectBtn}</span>
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={DESIGN_TOKENS.motion.fast}
          className="bg-[#FAF8F2] border border-[#DE655A] p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A221B]">
            <AlertTriangle className="w-4 h-4 text-[#DE655A] shrink-0" />
            <span>{dict.admin.drawer.confirmRejectTitle}</span>
          </div>

          <div>
            <label
              htmlFor="decision-reject-note"
              className="block text-xs font-medium text-[#10161F] mb-1"
            >
              {dict.admin.drawer.rejectionNoteLabel}
            </label>
            <input
              id="decision-reject-note"
              type="text"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder={dict.admin.drawer.rejectionNotePlaceholder}
              className="w-full bg-[#F3F0E8] border border-[#14263D]/30 px-3 py-2.5 text-xs text-[#10161F] focus:outline-none focus:border-[#DE655A] min-h-[42px]"
            />

            <div className="flex flex-wrap gap-1.5 mt-2">
              {dict.admin.drawer.rejectionPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionNote(preset)}
                  className="text-[11px] px-2.5 py-1 bg-[#F3F0E8] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#C9D1D0] transition-colors text-start cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onReject(rejectionNote);
                setIsConfirmingReject(false);
                setRejectionNote('');
              }}
              className="flex-1 py-2.5 px-4 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-xs font-semibold min-h-[44px] cursor-pointer"
            >
              {dict.admin.drawer.confirmRejectSubmit}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingReject(false)}
              className="px-4 py-2.5 bg-[#F3F0E8] text-[#10161F] border border-[#C9D1D0] text-xs font-medium min-h-[44px] cursor-pointer"
            >
              {dict.admin.drawer.cancelReject}
            </button>
          </div>
        </motion.div>
      )}
    </div>
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
      className="inline-flex items-center border border-[#14263D]/30 bg-[#F3F0E8] p-0.5"
    >
      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap min-h-[32px] cursor-pointer ${
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
        className={`px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap min-h-[32px] cursor-pointer ${
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
