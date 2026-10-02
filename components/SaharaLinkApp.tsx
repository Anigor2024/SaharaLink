'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { AdminDashboard } from '@/components/AdminDashboard';
import { CorridorHero } from '@/components/CorridorHero';
import { Navigation } from '@/components/Navigation';
import { TrackingView } from '@/components/TrackingView';
import { TransferAssistant } from '@/components/TransferAssistant';
import { TransferFlow } from '@/components/TransferFlow';
import { BrandMark } from '@/components/ui/corridor-primitives';
import { calculateTransferQuote, formatTabularNumber } from '@/lib/quote-engine';
import { TransferDirection } from '@/types/corridor';

export function SaharaLinkApp() {
  const {
    activeView,
    setActiveView,
    dict,
    dir,
    draftTransfer,
    trackedId,
    settings,
    transfers,
    applyQuoteToTransferFlow,
  } = useCorridor();

  // State for SECTION 2: Immediate Live Quote Instrument directly after Hero
  const [quickDirection, setQuickDirection] = useState<TransferDirection>('MRU_TO_XOF');
  const [quickAmountInput, setQuickAmountInput] = useState<string>('2500');

  const parsedQuickAmount = Number(quickAmountInput);
  const liveBridgeQuote = calculateTransferQuote(
    Number.isFinite(parsedQuickAmount) ? parsedQuickAmount : 0,
    quickDirection,
    settings
  );

  const handleToggleQuickDirection = () => {
    const nextDir: TransferDirection =
      quickDirection === 'MRU_TO_XOF' ? 'XOF_TO_MRU' : 'MRU_TO_XOF';
    setQuickDirection(nextDir);
    setQuickAmountInput(nextDir === 'MRU_TO_XOF' ? '2500' : '50000');
  };

  const handleContinueFromLiveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToApply = liveBridgeQuote.isValid
      ? liveBridgeQuote.amountSent
      : quickDirection === 'MRU_TO_XOF'
      ? 2500
      : 50000;
    applyQuoteToTransferFlow(quickDirection, amountToApply, 2);
  };

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const CtaArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-[#FAF8F2] text-[#10161F] pb-16 md:pb-0 selection:bg-[#14263D] selection:text-[#FAF8F2]"
    >
      {/* Single Unified Navigation Layer (Overlays Hero at Top) */}
      <Navigation />

      {/* Main Content Viewport */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeView === 'corridor' && (
            <motion.div
              key="view-corridor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* SECTION 1: FULL-SCREEN IMMERSIVE HERO (100svh) */}
              <CorridorHero />

              {/* SECTION 2: LIVE QUOTE / TRANSFER COMMAND BRIDGE (Directly Connected to Hero Corridor) */}
              <section
                id="live-quote-bridge"
                aria-label="Live Quote Instrument"
                className="relative bg-[#F3F0E8] border-b border-[#C9D1D0]"
              >
                {/* Continuous Vertical Route Line Entering from Hero */}
                <div
                  aria-hidden="true"
                  className="mx-auto w-[1.5px] h-8 bg-[#14263D]"
                />

                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-10 lg:pb-12">
                  <form
                    onSubmit={handleContinueFromLiveQuote}
                    className="bg-[#FAF8F2] border-2 border-[#14263D] p-5 sm:p-8"
                  >
                    {/* Top Corridor Instrument Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#C9D1D0]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2 h-2 bg-[#DE655A]"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-xs font-bold tracking-wider text-[#14263D] uppercase">
                          02 · QUOTE — {dict.commandCenter.headerKicker}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleQuickDirection}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F3F0E8] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D]/30 text-xs font-mono font-semibold transition-colors min-h-[36px] cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-[#DE655A]" />
                        <span dir="ltr">
                          {quickDirection === 'MRU_TO_XOF'
                            ? 'MRU → XOF'
                            : 'XOF → MRU'}
                        </span>
                        <span>· {dict.quote.swapDirection}</span>
                      </button>
                    </div>

                    {/* Direct Quote Transformation Grid: YOU SEND -> RECIPIENT GETS -> RATE/FEE -> CTA */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* YOU SEND */}
                      <div className="lg:col-span-4 bg-[#F3F0E8] border border-[#14263D]/30 p-4 sm:p-5">
                        <label
                          htmlFor="quick-quote-amount"
                          className="block font-mono text-[11px] font-bold tracking-wider text-[#14263D] uppercase mb-2"
                        >
                          {dict.quote.youSendTag}
                        </label>
                        <div
                          dir="ltr"
                          className="flex items-baseline justify-between gap-3"
                        >
                          <input
                            id="quick-quote-amount"
                            type="number"
                            inputMode="decimal"
                            min={1}
                            step="any"
                            value={quickAmountInput}
                            onChange={(e) => setQuickAmountInput(e.target.value)}
                            className="w-full bg-transparent text-2xl sm:text-3xl font-mono font-bold tabular-nums text-[#10161F] focus:outline-none border-b border-[#14263D]/30 focus:border-[#DE655A] pb-1"
                          />
                          <span className="font-mono text-base font-bold text-[#14263D] shrink-0">
                            {liveBridgeQuote.originCurrency}
                          </span>
                        </div>
                      </div>

                      {/* DIRECTIONAL TRANSFORMATION CONNECTOR */}
                      <div className="lg:col-span-1 flex lg:flex-col items-center justify-center">
                        <div className="w-8 h-8 bg-[#14263D] text-[#FAF8F2] flex items-center justify-center">
                          <ArrowDown className="w-4 h-4 text-[#7FAEA3] lg:hidden" />
                          <CtaArrow className="w-4 h-4 text-[#7FAEA3] hidden lg:block" />
                        </div>
                      </div>

                      {/* RECIPIENT GETS */}
                      <div className="lg:col-span-4 bg-[#10161F] text-[#FAF8F2] border border-[#14263D] p-4 sm:p-5">
                        <span className="block font-mono text-[11px] font-bold tracking-wider text-[#7FAEA3] uppercase mb-2">
                          {dict.quote.recipientGetsTag}
                        </span>
                        <div
                          dir="ltr"
                          className="flex items-baseline justify-between gap-3 pb-1"
                        >
                          <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-[#7FAEA3] truncate">
                            {liveBridgeQuote.isValid
                              ? formatTabularNumber(
                                  liveBridgeQuote.estimatedReceived,
                                  liveBridgeQuote.destinationCurrency === 'MRU' ? 2 : 0
                                )
                              : '0'}
                          </span>
                          <span className="font-mono text-base font-bold text-[#FAF8F2] shrink-0">
                            {liveBridgeQuote.destinationCurrency}
                          </span>
                        </div>
                      </div>

                      {/* RATE, FEE & PRIMARY CTA */}
                      <div className="lg:col-span-3 flex flex-col justify-between gap-3">
                        <div
                          dir="ltr"
                          className="flex lg:flex-col justify-between gap-1 text-xs font-mono text-[#14263D] bg-[#F3F0E8] px-3.5 py-2.5 border border-[#C9D1D0]"
                        >
                          <span>
                            Rate:{' '}
                            <strong className="text-[#10161F]">
                              1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
                            </strong>
                          </span>
                          <span>
                            Fee:{' '}
                            <strong className="text-[#10161F]">
                              {liveBridgeQuote.feeInOrigin}{' '}
                              {liveBridgeQuote.originCurrency}
                            </strong>
                          </span>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 px-5 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-colors min-h-[48px] cursor-pointer"
                        >
                          <span>{dict.hero.continueTransferCta}</span>
                          <CtaArrow className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              {/* SECTIONS 3 & 4: AI TRANSFER ASSISTANT + GUIDED TRANSFER FLOW WORKSPACE */}
              <section
                id="corridor-workspace"
                className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* SECTION 3: AI Transfer Assistant (5 Cols on Desktop) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <TransferAssistant />
                  </div>

                  {/* SECTION 4: Guided 4-Step Transfer Flow (7 Cols on Desktop) */}
                  <div className="lg:col-span-7 flex flex-col">
                    <TransferFlow key={draftTransfer.version} />
                  </div>
                </div>
              </section>

              {/* SECTIONS 5 & 6: PROGRESSIVE DISCLOSURE BRIDGE TO TRACKING & ADMIN OPERATIONS */}
              <section
                aria-label="Corridor Tracking and Operations Access"
                className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[#C9D1D0] pt-8">
                  {/* Section 5 Bridge: Live Tracking */}
                  <div className="bg-[#F3F0E8] border border-[#14263D]/25 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                        05 · STATUS — {dict.tracking.sectionLabel}
                      </span>
                      <h3 className="text-lg font-semibold text-[#10161F]">
                        {dict.tracking.title}
                      </h3>
                      <p className="text-xs text-[#14263D]/80 leading-relaxed">
                        {dict.tracking.subtitle}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveView('track')}
                        className="px-5 py-3 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-[#7FAEA3]" />
                        <span>{dict.nav.track}</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 6 Bridge: Admin Operations */}
                  <div className="bg-[#F3F0E8] border border-[#14263D]/25 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                        04 · REVIEW — {dict.admin.sectionLabel}
                      </span>
                      <h3 className="text-lg font-semibold text-[#10161F]">
                        {dict.admin.title}
                      </h3>
                      <p className="text-xs text-[#14263D]/80 leading-relaxed">
                        {dict.admin.subtitle}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveView('admin')}
                        className="px-5 py-3 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D] text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#DE655A]" />
                        <span>
                          {dict.nav.admin}{' '}
                          {pendingCount > 0 ? `(${pendingCount})` : ''}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeView === 'track' && (
            <motion.div
              key="view-track"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <TrackingView key={trackedId} />
            </motion.div>
          )}

          {activeView === 'admin' && (
            <motion.div
              key="view-admin"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <AdminDashboard key={settings.updatedAt} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#10161F] text-[#FAF8F2] border-t border-[#14263D] mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <BrandMark compact inverted />
            <p className="text-xs text-[#C9D1D0]/75">{dict.demoBanner.notice}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#C9D1D0]">
            <button
              type="button"
              onClick={() => setActiveView('corridor')}
              className="hover:text-[#FAF8F2] transition-colors cursor-pointer"
            >
              {dict.nav.transfer}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('track')}
              className="hover:text-[#FAF8F2] transition-colors cursor-pointer"
            >
              {dict.nav.track}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="hover:text-[#FAF8F2] transition-colors cursor-pointer"
            >
              {dict.nav.admin}
            </button>
            <span dir="ltr" className="text-[#7FAEA3] font-mono">
              MRU ↔ XOF
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
