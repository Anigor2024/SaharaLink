'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Compass,
  Copy,
  Radio,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  ReceiptPreview,
  RouteIndicator,
  StatusBadge,
  TransferTimeline,
} from '@/components/ui/corridor-primitives';

const SAMPLE_IDS = ['SL-261002-A7K2', 'SL-261002-M9R4', 'SL-261002-N3P9'];

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

  // Newly created transfers not in the default 6 seed IDs
  const customCreatedIds = transfers
    .map((t) => t.id)
    .filter(
      (id) =>
        ![
          'SL-261002-A7K2',
          'SL-261002-M9R4',
          'SL-261002-C4V8',
          'SL-261002-N3P9',
          'SL-261002-T6H5',
          'SL-261002-K8W1',
        ].includes(id)
    );

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
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8">
      {/* Header & Search Instrument */}
      <div className="bg-[#FAF8F2] border border-[#14263D]/25 p-5 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#14263D]">
              <Compass className="w-3.5 h-3.5 text-[#DE655A]" />
              <span>{dict.tracking.sectionLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#10161F] mt-1">
              {dict.tracking.title}
            </h1>
            <p className="text-sm text-[#14263D]/80 mt-1 leading-relaxed">
              {dict.tracking.subtitle}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#2C6B5F] bg-[#7FAEA3]/15 border border-[#7FAEA3]/50 px-3 py-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{dict.tracking.liveSyncNotice}</span>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
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
              className="w-full bg-[#FAF8F2] border-2 border-[#14263D] px-4 py-3 text-base font-mono font-semibold text-[#10161F] uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#7FAEA3] min-h-[48px]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] whitespace-nowrap cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#7FAEA3]" />
            <span>{dict.tracking.searchButton}</span>
          </button>
        </form>

        {/* Sample & Recent IDs */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#C9D1D0]">
          {customCreatedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#DE655A]">
                {dict.tracking.recentCreatedLabel}
              </span>
              {customCreatedIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectSample(id)}
                  dir="ltr"
                  className={`px-3 py-1.5 text-xs font-mono font-semibold border transition-colors min-h-[34px] cursor-pointer ${
                    activeId.toUpperCase() === id.toUpperCase()
                      ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                      : 'bg-[#DE655A]/12 text-[#10161F] border-[#DE655A] hover:bg-[#14263D] hover:text-[#FAF8F2]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#14263D]/75">
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
                      ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                      : 'bg-[#F3F0E8] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                  }`}
                >
                  <span className="font-semibold">{id}</span>
                  {record && (
                    <span className="text-[10px] opacity-80">
                      ({dict.tracking.statuses[record.status]})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tracking Result or Not Found */}
      {!currentTransfer ? (
        <div className="bg-[#FAF8F2] border border-[#C9D1D0] p-8 text-center space-y-3">
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left/Main Column: Transfer Corridor Status & Financial Details (7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF8F2] border border-[#14263D]/25 p-5 sm:p-6 space-y-6">
            {/* Top Status & ID Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#C9D1D0]">
              <div>
                <span className="text-xs font-mono text-[#14263D]/70 block">
                  {dict.transferFlow.confirmation.transferIdLabel}
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <span
                    dir="ltr"
                    className="text-2xl font-mono font-bold text-[#10161F] tracking-wider tabular-nums"
                  >
                    {currentTransfer.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentTransfer.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#F3F0E8] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#C9D1D0] transition-colors min-h-[32px] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2C6B5F]" />
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

              <StatusBadge status={currentTransfer.status} size="lg" />
            </div>

            {/* Contextual Status Banner */}
            <div
              className={`p-4 border-s-4 text-sm leading-relaxed ${
                currentTransfer.status === 'accepted'
                  ? 'bg-[#7FAEA3]/15 border-[#7FAEA3] text-[#10161F]'
                  : currentTransfer.status === 'rejected'
                  ? 'bg-[#DE655A]/12 border-[#DE655A] text-[#8C2D25]'
                  : 'bg-[#F3F0E8] border-[#14263D] text-[#14263D]'
              }`}
            >
              <p className="font-medium">
                {dict.tracking.statusDescriptions[currentTransfer.status]}
              </p>
              {currentTransfer.status === 'rejected' && currentTransfer.rejectionReason && (
                <div className="mt-2 pt-2 border-t border-[#DE655A]/30 text-xs">
                  <span className="font-semibold block">
                    {dict.tracking.rejectionReasonLabel}
                  </span>
                  <p className="mt-0.5">{currentTransfer.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Route Indicator */}
            <RouteIndicator direction={currentTransfer.direction} />

            {/* Amounts Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F3F0E8] border border-[#C9D1D0] p-4">
              <div>
                <span className="text-xs text-[#14263D]/75 block">
                  {dict.quote.amountSentLabel}
                </span>
                <AmountDisplay
                  amount={currentTransfer.amountSent}
                  currency={currentTransfer.originCurrency}
                  size="xl"
                />
              </div>

              <div className="sm:text-end">
                <span className="text-xs text-[#2C6B5F] font-semibold block">
                  {dict.quote.estimatedReceivedLabel}
                </span>
                <AmountDisplay
                  amount={currentTransfer.estimatedReceived}
                  currency={currentTransfer.destinationCurrency}
                  size="xl"
                  highlight
                />
              </div>

              <div className="sm:col-span-2 pt-2.5 border-t border-[#C9D1D0] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#14263D]/80">
                <span>
                  {dict.quote.feeLabel}: {currentTransfer.fee} {currentTransfer.originCurrency}
                </span>
                <span>1 MRU = {currentTransfer.exchangeRate.toFixed(2)} XOF</span>
              </div>
            </div>

            {/* Sender, Recipient & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#C9D1D0] text-xs">
              <div>
                <span className="text-[#14263D]/70 block">
                  {dict.transferFlow.senderSection}
                </span>
                <p className="font-semibold text-sm text-[#10161F] mt-0.5">
                  {currentTransfer.senderName}
                </p>
                <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                  {currentTransfer.senderPhone}
                </p>
              </div>

              <div>
                <span className="text-[#14263D]/70 block">
                  {dict.transferFlow.recipientSection}
                </span>
                <p className="font-semibold text-sm text-[#10161F] mt-0.5">
                  {currentTransfer.recipientName}
                </p>
                <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                  {currentTransfer.recipientPhone}
                </p>
              </div>

              <div>
                <span className="text-[#14263D]/70 block">
                  {dict.transferFlow.methodLabel}
                </span>
                <p className="font-mono font-bold text-sm text-[#14263D] mt-0.5">
                  {currentTransfer.receivingMethod}
                </p>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="pt-2 border-t border-[#C9D1D0]">
              <ReceiptPreview
                dataUrl={currentTransfer.receiptDataUrl}
                fileName={currentTransfer.receiptFileName}
                fileSize={currentTransfer.receiptFileSize}
                readonly
              />
            </div>
          </div>

          {/* Right Column: Progressive Transfer Corridor Timeline & Quick Admin Review Link (5 Cols) */}
          <div className="lg:col-span-5 bg-[#FAF8F2] border border-[#14263D]/25 p-5 sm:p-6 space-y-6">
            <div className="pb-3 border-b border-[#C9D1D0] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#10161F]">
                {dict.tracking.timelineHeader}
              </h2>
              <span className="text-xs font-mono text-[#14263D]/70">
                {currentTransfer.timeline.length} STATIONS
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
                className="w-full py-3 px-4 bg-[#F3F0E8] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D]/35 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#7FAEA3]" />
                <span>{dict.transferFlow.confirmation.openAdminToReviewCta}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
