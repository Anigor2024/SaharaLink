'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Radio,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  ReceiptPreview,
  StatusBadge,
  TransferRoute,
  TransferTimeline,
} from '@/components/ui/corridor-primitives';
import { DESIGN_TOKENS } from '@/lib/design-tokens';

const SAMPLE_IDS = ['SL-261002-A7K2', 'SL-261002-M9R4', 'SL-261001-N3P9'];

export function TrackingView() {
  const {
    dict,
    transfers,
    trackedId,
    openTrackingForId,
    openAdminForTransferId,
  } = useCorridor();

  const [queryInput, setQueryInput] = useState(() => trackedId || 'SL-261002-A7K2');
  const activeId = trackedId || 'SL-261002-A7K2';
  const [copied, setCopied] = useState(false);

  const currentTransfer =
    transfers.find((t) => t.id.toUpperCase() === activeId.trim().toUpperCase()) || null;

  // Newly created transfers not in the default seed IDs
  const seedIdSet = new Set([
    'SL-261002-A7K2',
    'SL-261002-M9R4',
    'SL-261002-C4V8',
    'SL-261001-N3P9',
    'SL-261001-T6H5',
    'SL-261002-K8W1',
    'SL-261001-B2L7',
  ]);
  const customCreatedIds = transfers
    .map((t) => t.id)
    .filter((id) => !seedIdSet.has(id));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    openTrackingForId(queryInput.trim().toUpperCase());
  };

  const handleSelectSample = (id: string) => {
    setQueryInput(id);
    openTrackingForId(id);
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
      {/* Top Tracking Instrument Console */}
      <div className="bg-[#10161F] text-[#FAF8F2] border border-[#14263D] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#C9D1D0]/15 pb-5">
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3] tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#DE655A]" />
              <span>{dict.tracking.sectionLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-semibold text-[#FAF8F2] tracking-tight">
              {dict.tracking.title}
            </h1>
            <p className="text-sm text-[#C9D1D0] leading-relaxed">
              {dict.tracking.subtitle}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3] bg-[#14263D] border border-[#7FAEA3]/40 px-3.5 py-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{dict.tracking.liveSyncNotice}</span>
          </div>
        </div>

        {/* Lookup Entry Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="track-id-input" className="sr-only">
              {dict.tracking.searchPlaceholder}
            </label>
            <input
              id="track-id-input"
              type="text"
              dir="ltr"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={dict.tracking.searchPlaceholder}
              className="w-full bg-[#14263D]/70 border-2 border-[#C9D1D0]/30 focus:border-[#7FAEA3] px-4 py-3.5 text-lg font-mono font-bold text-[#FAF8F2] placeholder:text-[#C9D1D0]/40 uppercase tracking-wider focus:outline-none min-h-[52px]"
            />
          </div>
          <button
            type="submit"
            className="px-7 py-3.5 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[52px] whitespace-nowrap cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{dict.tracking.searchButton}</span>
          </button>
        </form>

        {/* Quick-Select Sample & Newly Created IDs */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {customCreatedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#7FAEA3]">
                {dict.tracking.recentCreatedLabel}
              </span>
              {customCreatedIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectSample(id)}
                  dir="ltr"
                  className={`px-3 py-1.5 text-xs font-mono font-bold border transition-colors min-h-[34px] cursor-pointer ${
                    activeId.toUpperCase() === id.toUpperCase()
                      ? 'bg-[#7FAEA3] text-[#10161F] border-[#7FAEA3]'
                      : 'bg-[#14263D] text-[#FAF8F2] border-[#7FAEA3]/50 hover:border-[#7FAEA3]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#C9D1D0]/80">
              {dict.tracking.sampleIdsLabel}
            </span>
            {SAMPLE_IDS.map((id) => {
              const record = transfers.find((t) => t.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectSample(id)}
                  dir="ltr"
                  className={`px-3 py-1.5 text-xs font-mono border transition-colors inline-flex items-center gap-2 min-h-[34px] cursor-pointer ${
                    activeId.toUpperCase() === id.toUpperCase()
                      ? 'bg-[#FAF8F2] text-[#10161F] border-[#FAF8F2] font-bold'
                      : 'bg-[#14263D]/60 text-[#C9D1D0] border-[#C9D1D0]/25 hover:border-[#FAF8F2]'
                  }`}
                >
                  <span className="font-semibold">{id}</span>
                  {record && (
                    <span className="text-[10px] opacity-80">
                      · {dict.tracking.statuses[record.status]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Not Found State */}
      {!currentTransfer ? (
        <div className="bg-[#FAF8F2] border border-[#14263D]/30 p-10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-[#DE655A] mx-auto" />
          <h2 className="text-lg font-semibold text-[#10161F]">
            {dict.tracking.notFoundTitle}
          </h2>
          <p className="text-sm text-[#14263D]/75 max-w-md mx-auto">
            {dict.tracking.notFoundDesc}
          </p>
        </div>
      ) : (
        <motion.div
          key={`${currentTransfer.id}-${currentTransfer.status}-${currentTransfer.updatedAt}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={DESIGN_TOKENS.motion.standard}
          className="space-y-6"
        >
          {/* Macro 4-Waypoint Corridor Status Strip */}
          <div className="bg-[#FAF8F2] border border-[#14263D] p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#C9D1D0]">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-[11px] font-mono text-[#14263D]/70 uppercase block">
                    {dict.transferFlow.confirmation.transferIdLabel}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span
                      dir="ltr"
                      className="text-2xl sm:text-3xl font-mono font-bold text-[#10161F] tracking-wider tabular-nums"
                    >
                      {currentTransfer.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentTransfer.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#F3F0E8] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#14263D]/30 transition-colors min-h-[34px] cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#1F5C50]" />
                          <span>{dict.transferFlow.confirmation.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{dict.transferFlow.confirmation.copyId}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <StatusBadge status={currentTransfer.status} size="lg" />
            </div>

            {/* 4-Node Macro Trajectory Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  idx: 1,
                  code: dict.tracking.timelineSteps.created.code,
                  label: dict.tracking.timelineSteps.created.title,
                  done: true,
                  active: false,
                },
                {
                  idx: 2,
                  code: dict.tracking.timelineSteps.receipt_uploaded.code,
                  label: dict.tracking.timelineSteps.receipt_uploaded.title,
                  done: true,
                  active: false,
                },
                {
                  idx: 3,
                  code: dict.tracking.timelineSteps.under_review.code,
                  label: dict.tracking.timelineSteps.under_review.title,
                  done: currentTransfer.status !== 'pending',
                  active: currentTransfer.status === 'pending',
                },
                {
                  idx: 4,
                  code:
                    currentTransfer.status === 'rejected'
                      ? dict.tracking.timelineSteps.rejected.code
                      : dict.tracking.timelineSteps.accepted.code,
                  label:
                    currentTransfer.status === 'rejected'
                      ? dict.tracking.timelineSteps.rejected.title
                      : dict.tracking.timelineSteps.accepted.title,
                  done: currentTransfer.status === 'accepted',
                  rejected: currentTransfer.status === 'rejected',
                  active: false,
                },
              ].map((node) => (
                <div
                  key={node.idx}
                  className={`p-3 border flex flex-col justify-between min-h-[68px] ${
                    node.rejected
                      ? 'bg-[#DE655A] text-[#FAF8F2] border-[#10161F]'
                      : node.done && node.idx === 4
                      ? 'bg-[#7FAEA3] text-[#10161F] border-[#14263D]'
                      : node.active
                      ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                      : node.done
                      ? 'bg-[#F3F0E8] text-[#10161F] border-[#14263D]/40'
                      : 'bg-[#FAF8F2] text-[#14263D]/40 border-[#C9D1D0]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>0{node.idx} · {node.code}</span>
                    {node.done && !node.rejected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {node.active && <Clock className="w-3.5 h-3.5 text-[#DE655A] animate-pulse" />}
                    {node.rejected && <XCircle className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-semibold mt-1">{node.label}</span>
                </div>
              ))}
            </div>

            {/* Contextual Status Explanation & Rejection Reason */}
            <div
              className={`p-4 border-s-4 text-sm leading-relaxed ${
                currentTransfer.status === 'accepted'
                  ? 'bg-[#7FAEA3]/20 border-[#7FAEA3] text-[#10161F]'
                  : currentTransfer.status === 'rejected'
                  ? 'bg-[#DE655A]/15 border-[#DE655A] text-[#7A221B]'
                  : 'bg-[#F3F0E8] border-[#14263D] text-[#14263D]'
              }`}
            >
              <p className="font-semibold">
                {dict.tracking.statusDescriptions[currentTransfer.status]}
              </p>
              {currentTransfer.status === 'rejected' && currentTransfer.rejectionReason && (
                <div className="mt-2 pt-2 border-t border-[#DE655A]/30 text-xs">
                  <span className="font-bold block">
                    {dict.tracking.rejectionReasonLabel}
                  </span>
                  <p className="mt-1 font-medium">{currentTransfer.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Two-Column Instrument View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Financial Trajectory, Parties & Voucher (7 Cols) */}
            <div className="lg:col-span-7 bg-[#FAF8F2] border border-[#14263D]/30 p-5 sm:p-6 space-y-6">
              <div className="pb-3 border-b border-[#C9D1D0]">
                <h2 className="text-sm font-mono font-bold text-[#14263D] uppercase">
                  {dict.tracking.detailsHeader}
                </h2>
              </div>

              <TransferRoute
                direction={currentTransfer.direction}
                centerLabel={`1 MRU = ${currentTransfer.exchangeRate.toFixed(2)} XOF`}
              />

              {/* Amount Journey Box */}
              <div className="bg-[#10161F] text-[#FAF8F2] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-mono text-[#C9D1D0] uppercase block">
                    {dict.quote.youSendTag}
                  </span>
                  <div className="mt-1">
                    <AmountDisplay
                      amount={currentTransfer.amountSent}
                      currency={currentTransfer.originCurrency}
                      size="xl"
                      inverted
                    />
                  </div>
                </div>

                <div className="sm:text-end">
                  <span className="text-[11px] font-mono text-[#7FAEA3] font-semibold uppercase block">
                    {dict.quote.recipientGetsTag}
                  </span>
                  <div className="mt-1">
                    <AmountDisplay
                      amount={currentTransfer.estimatedReceived}
                      currency={currentTransfer.destinationCurrency}
                      size="xl"
                      inverted
                      highlight
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-3 border-t border-[#C9D1D0]/15 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#C9D1D0]/80">
                  <span>
                    {dict.quote.feeLabel}: {currentTransfer.fee}{' '}
                    {currentTransfer.originCurrency}
                  </span>
                  <span>1 MRU = {currentTransfer.exchangeRate.toFixed(2)} XOF</span>
                </div>
              </div>

              {/* People & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-[#C9D1D0] text-xs">
                <div>
                  <span className="font-mono text-[11px] text-[#14263D]/70 uppercase block">
                    {dict.transferFlow.senderSection}
                  </span>
                  <p className="font-semibold text-sm text-[#10161F] mt-1">
                    {currentTransfer.senderName}
                  </p>
                  <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                    {currentTransfer.senderPhone}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] text-[#14263D]/70 uppercase block">
                    {dict.transferFlow.recipientSection}
                  </span>
                  <p className="font-semibold text-sm text-[#10161F] mt-1">
                    {currentTransfer.recipientName}
                  </p>
                  <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                    {currentTransfer.recipientPhone}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] text-[#14263D]/70 uppercase block">
                    {dict.transferFlow.methodLabel}
                  </span>
                  <p className="font-mono font-bold text-sm text-[#14263D] mt-1">
                    {currentTransfer.receivingMethod}
                  </p>
                </div>
              </div>

              {/* Receipt Voucher */}
              <ReceiptPreview
                dataUrl={currentTransfer.receiptDataUrl}
                fileName={currentTransfer.receiptFileName}
                fileSize={currentTransfer.receiptFileSize}
                mimeType={currentTransfer.receiptMimeType}
                persistenceStatus={currentTransfer.receiptPersistenceStatus}
                isSeededDemo={currentTransfer.isSeededDemo}
                readonly
              />
            </div>

            {/* Right Column: Detailed Operational Timeline & Admin Inspector Link (5 Cols) */}
            <div className="lg:col-span-5 bg-[#FAF8F2] border border-[#14263D]/30 p-5 sm:p-6 space-y-6">
              <div className="pb-3 border-b border-[#C9D1D0] flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-[#14263D] uppercase">
                  {dict.tracking.timelineHeader}
                </h2>
                <span className="text-xs font-mono text-[#14263D]/70 tabular-nums">
                  {currentTransfer.timeline.length} EVENTS
                </span>
              </div>

              <TransferTimeline
                status={currentTransfer.status}
                timeline={currentTransfer.timeline}
                rejectionReason={currentTransfer.rejectionReason}
              />

              <div className="pt-4 border-t border-[#C9D1D0]">
                <button
                  type="button"
                  onClick={() => openAdminForTransferId(currentTransfer.id)}
                  className="w-full py-3.5 px-4 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[46px] cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#7FAEA3]" />
                  <span>{dict.transferFlow.confirmation.openAdminToReviewCta}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
