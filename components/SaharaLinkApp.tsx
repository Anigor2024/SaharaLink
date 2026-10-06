'use client';

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Compass,
  FileCheck2,
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
    language,
    draftTransfer,
    trackedId,
    openTrackingForId,
    settings,
    transfers,
    applyQuoteToTransferFlow,
  } = useCorridor();

  // State for SECTION 2: Immediate Fluid Live Quote Instrument
  const [quickDirection, setQuickDirection] = useState<TransferDirection>('MRU_TO_XOF');
  const [quickAmountInput, setQuickAmountInput] = useState<string>('2500');
  const [trackingSearchInput, setTrackingSearchInput] = useState<string>('');

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

  const handleApplyQuickPreset = (preset: number) => {
    setQuickAmountInput(String(preset));
  };

  const handleContinueFromLiveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const amountToApply = liveBridgeQuote.isValid
      ? liveBridgeQuote.amountSent
      : quickDirection === 'MRU_TO_XOF'
      ? 2500
      : 50000;
    applyQuoteToTransferFlow(quickDirection, amountToApply, 2);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('corridor-workspace');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = trackingSearchInput.trim() || 'SL-261002-A7K2';
    openTrackingForId(target);
  };

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const CtaArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-[#FAF8F2] text-[#10161F] selection:bg-[#14263D] selection:text-[#FAF8F2]"
    >
      {/* Clean Single Navigation Layer */}
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
              {/* CHAPTER 1: FULL-SCREEN IMMERSIVE HERO (Deep Ink & Mineral Navy) */}
              <CorridorHero />

              {/* CHAPTER 2: FLUID INSTANT QUOTE COMPOSITION (Warm Porcelain #F3F0E8) */}
              <section
                id="live-quote-bridge"
                aria-label="Instant Quote Instrument"
                className="bg-[#F3F0E8] text-[#10161F] py-16 sm:py-20 border-b border-[#C9D1D0]/70"
              >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
                  {/* Subtle Chapter Marker & Direction Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-10 border-b border-[#C9D1D0]/60">
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-bold tracking-wider text-[#14263D] uppercase block">
                        01 · {dict.quote.sectionLabel}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-[#10161F]">
                        {dict.quote.title}
                      </h2>
                    </div>

                    {/* Understated Direction Switcher */}
                    <button
                      type="button"
                      onClick={handleToggleQuickDirection}
                      className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D]/25 transition-colors text-xs font-mono font-semibold min-h-[40px] cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#DE655A]" />
                      <span dir="ltr">
                        {quickDirection === 'MRU_TO_XOF' ? 'MRU → XOF' : 'XOF → MRU'}
                      </span>
                      <span className="opacity-75">· {dict.quote.swapDirection}</span>
                    </button>
                  </div>

                  {/* FLUID FINANCIAL COMPOSITION: Unboxed, High-Scale Typography */}
                  <form onSubmit={handleContinueFromLiveQuote} className="space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-baseline">
                      {/* Left: YOU SEND (Large editable number with underline focus) */}
                      <div className="lg:col-span-5 space-y-3">
                        <label
                          htmlFor="quick-quote-amount"
                          className="font-mono text-xs font-bold tracking-wider text-[#14263D]/75 uppercase block"
                        >
                          {dict.quote.youSendTag}
                        </label>
                        <div
                          dir="ltr"
                          className="flex items-baseline gap-3 border-b-2 border-[#14263D]/30 focus-within:border-[#DE655A] transition-colors pb-2"
                        >
                          <input
                            id="quick-quote-amount"
                            type="number"
                            inputMode="decimal"
                            min={1}
                            step="any"
                            value={quickAmountInput}
                            onChange={(e) => setQuickAmountInput(e.target.value)}
                            className="w-full bg-transparent text-5xl sm:text-6xl lg:text-7xl font-mono font-bold tabular-nums text-[#10161F] focus:outline-none"
                          />
                          <span className="font-mono text-xl sm:text-2xl font-bold text-[#14263D] shrink-0">
                            {liveBridgeQuote.originCurrency}
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {(quickDirection === 'MRU_TO_XOF'
                            ? [1000, 2500, 5000, 10000]
                            : [25000, 50000, 100000, 200000]
                          ).map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleApplyQuickPreset(val)}
                              className={`text-xs font-mono px-2.5 py-1 transition-colors cursor-pointer ${
                                Number(quickAmountInput) === val
                                  ? 'bg-[#14263D] text-[#FAF8F2]'
                                  : 'bg-[#FAF8F2] text-[#14263D] hover:bg-[#14263D]/10'
                              }`}
                            >
                              {val.toLocaleString('en-US')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Center: Fluid Route Transition Vector */}
                      <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-full flex items-center justify-center gap-2 text-[#14263D]">
                          <span className="hidden lg:inline-block h-[1.5px] w-12 bg-[#14263D]/30" />
                          <div className="w-10 h-10 bg-[#14263D] text-[#FAF8F2] flex items-center justify-center shrink-0">
                            <ArrowDown className="w-4 h-4 text-[#7FAEA3] lg:hidden" />
                            <CtaArrow className="w-4 h-4 text-[#7FAEA3] hidden lg:block" />
                          </div>
                          <span className="hidden lg:inline-block h-[1.5px] w-12 bg-[#14263D]/30" />
                        </div>
                        <span dir="ltr" className="font-mono text-xs text-[#14263D]/70 font-semibold mt-2">
                          1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
                        </span>
                      </div>

                      {/* Right: RECIPIENT GETS (Strongest Visual Number) */}
                      <div className="lg:col-span-5 space-y-3 lg:text-end">
                        <span className="font-mono text-xs font-bold tracking-wider text-[#1F5C50] uppercase block">
                          {dict.quote.recipientGetsTag}
                        </span>
                        <div
                          dir="ltr"
                          className="flex items-baseline lg:justify-end gap-3 pb-2"
                        >
                          <span className="text-5xl sm:text-6xl lg:text-7xl font-mono font-bold tabular-nums text-[#1F5C50] tracking-tight">
                            {liveBridgeQuote.isValid
                              ? formatTabularNumber(
                                  liveBridgeQuote.estimatedReceived,
                                  liveBridgeQuote.destinationCurrency === 'MRU' ? 2 : 0
                                )
                              : '0'}
                          </span>
                          <span className="font-mono text-xl sm:text-2xl font-bold text-[#14263D] shrink-0">
                            {liveBridgeQuote.destinationCurrency}
                          </span>
                        </div>
                        <p className="text-xs text-[#14263D]/75">
                          {language === 'ar'
                            ? `الرسوم المقتطعة: ${liveBridgeQuote.feeInOrigin} ${liveBridgeQuote.originCurrency} (ثابتة)`
                            : `Frais déduits : ${liveBridgeQuote.feeInOrigin} ${liveBridgeQuote.originCurrency} (fixe)`}
                        </p>
                      </div>
                    </div>

                    {/* Underneath: Transparent Financial Strip & Solid Direct Action */}
                    <div className="pt-6 border-t border-[#C9D1D0]/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#14263D]/80">
                        <span>
                          {dict.quote.feeLabel}:{' '}
                          <strong className="text-[#10161F]">
                            {liveBridgeQuote.feeInOrigin} {liveBridgeQuote.originCurrency}
                          </strong>
                        </span>
                        <span aria-hidden="true" className="text-[#C9D1D0]">
                          ·
                        </span>
                        <span>
                          {dict.quote.exchangeRateLabel}:{' '}
                          <strong className="text-[#10161F]">
                            1 : {ensureEnglishNumerals(settings.exchangeRateMruToXof.toFixed(2))}
                          </strong>
                        </span>
                        <span aria-hidden="true" className="text-[#C9D1D0]">
                          ·
                        </span>
                        <span className="text-[#1F5C50] font-semibold">
                          {language === 'ar'
                            ? 'عرض المبلغ الصافي وتفاصيل الرسوم قبل الإرسال'
                            : 'Montant net et frais détaillés affichés avant envoi'}
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-4 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-3 transition-colors min-h-[50px] cursor-pointer shadow-md"
                      >
                        <span>{dict.hero.continueTransferCta || 'متابعة إنشاء الطلب'}</span>
                        <CtaArrow className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* CHAPTER 3: AI CONCIERGE & GUIDED 4-STEP TRANSFER STUDIO (Warm Paper #FAF8F2) */}
              <section
                id="corridor-workspace"
                aria-label="Transfer Assistant and Studio Workspace"
                className="py-14 sm:py-20 bg-[#FAF8F2]"
              >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
                  {/* Workspace Heading */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-xs font-bold tracking-wider text-[#14263D] uppercase block">
                      02 · {dict.commandCenter.headerKicker}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#10161F]">
                      {dict.commandCenter.headerTitle}
                    </h2>
                  </div>

                  {/* Two-Column Responsive Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Financial AI Concierge (5 Cols) */}
                    <div className="lg:col-span-5 flex flex-col">
                      <TransferAssistant />
                    </div>

                    {/* 4-Step Guided Transfer Flow (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col">
                      <TransferFlow key={draftTransfer.version} />
                    </div>
                  </div>
                </div>
              </section>

              {/* CHAPTER 4: TRACKING EXPERIENCE (Deep Navy #10161F / #14263D) */}
              <section
                id="tracking-chapter"
                aria-label="Transfer Tracking Chapter"
                className="py-16 sm:py-24 bg-[#10161F] text-[#FAF8F2] border-t border-[#14263D]"
              >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
                  <div className="max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3]">
                      <span className="w-1.5 h-1.5 bg-[#7FAEA3]" aria-hidden="true" />
                      <span>02 · STATUS — {dict.tracking.sectionLabel}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-semibold text-[#FAF8F2]">
                      {language === 'ar'
                        ? 'تتبّع رحلة طلبك.'
                        : 'Suivez le parcours de votre transfert.'}
                    </h2>
                    <p className="text-sm sm:text-base text-[#C9D1D0]/85 leading-relaxed">
                      {language === 'ar'
                        ? 'أدخل معرّف الطلب الفريد لمتابعة خط سير المبلغ لحظة بلحظة، من توثيق الوصل وحتى تسليم المستفيد.'
                        : 'Saisissez votre identifiant unique de transfert pour suivre chaque étape en temps réel, de la validation du justificatif au règlement final.'}
                    </p>
                  </div>

                  {/* Main Tracking Instrument: High Contrast, Timeline Integrated */}
                  <div className="space-y-6">
                    <form
                      onSubmit={handleTrackingSubmit}
                      className="flex flex-col sm:flex-row items-stretch gap-3 max-w-2xl"
                    >
                      <label htmlFor="chapter-tracking-id" className="sr-only">
                        {dict.tracking.searchPlaceholder}
                      </label>
                      <input
                        id="chapter-tracking-id"
                        type="text"
                        dir="ltr"
                        value={trackingSearchInput}
                        onChange={(e) => setTrackingSearchInput(e.target.value)}
                        placeholder="SL-261002-A7K2"
                        className="flex-1 px-4 py-3.5 bg-[#14263D]/80 border border-[#C9D1D0]/30 text-sm font-mono font-bold uppercase tracking-wider text-[#FAF8F2] placeholder:text-[#C9D1D0]/50 focus:outline-none focus:border-[#7FAEA3] min-h-[50px]"
                      />
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-[#FAF8F2] hover:bg-[#7FAEA3] text-[#10161F] text-sm font-semibold transition-colors min-h-[50px] inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <Compass className="w-4 h-4 text-[#14263D]" />
                        <span>{dict.tracking.searchButton}</span>
                      </button>
                    </form>

                    {/* Quick Demo Transfer Links */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#C9D1D0]/70">
                      <span>{dict.tracking.sampleIdsLabel}</span>
                      {['SL-261002-A7K2', 'SL-261002-M9R4', 'SL-261002-C4V8'].map(
                        (demoId) => (
                          <button
                            key={demoId}
                            type="button"
                            onClick={() => openTrackingForId(demoId)}
                            className="px-2.5 py-1 bg-[#14263D] hover:bg-[#FAF8F2] hover:text-[#10161F] border border-[#C9D1D0]/20 text-[#FAF8F2] transition-colors cursor-pointer"
                          >
                            {demoId}
                          </button>
                        )
                      )}
                    </div>

                    {/* Integrated 4-Waypoint Route Motif */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#14263D]">
                      {[
                        {
                          idx: '01',
                          code: dict.tracking.timelineSteps.created.code,
                          label: dict.tracking.timelineSteps.created.title,
                        },
                        {
                          idx: '02',
                          code: dict.tracking.timelineSteps.receipt_uploaded.code,
                          label: dict.tracking.timelineSteps.receipt_uploaded.title,
                        },
                        {
                          idx: '03',
                          code: dict.tracking.timelineSteps.under_review.code,
                          label: dict.tracking.timelineSteps.under_review.title,
                        },
                        {
                          idx: '04',
                          code: dict.tracking.timelineSteps.accepted.code,
                          label: dict.tracking.timelineSteps.accepted.title,
                        },
                      ].map((wp) => (
                        <div key={wp.idx} className="space-y-1">
                          <span className="font-mono text-xs font-bold text-[#7FAEA3] block">
                            {wp.idx} · {wp.code}
                          </span>
                          <span className="text-xs text-[#C9D1D0]/80 block truncate">
                            {wp.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* CHAPTER 5: OPERATIONS PREVIEW CHAPTER (Warm Paper #FAF8F2) */}
              <section
                aria-label="Operations Pipeline Preview"
                className="py-16 sm:py-24 bg-[#FAF8F2] border-t border-[#C9D1D0]"
              >
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#C9D1D0]/70">
                    <div className="space-y-2 max-w-2xl">
                      <span className="font-mono text-xs font-bold tracking-wider text-[#14263D] uppercase block">
                        03 · OPERATIONS — {dict.admin.sectionLabel}
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-semibold text-[#10161F]">
                        {language === 'ar'
                          ? 'مراجعة وفحص العمليات.'
                          : 'Revue & contrôle des opérations.'}
                      </h2>
                      <p className="text-sm sm:text-base text-[#14263D]/80 leading-relaxed">
                        {language === 'ar'
                          ? 'نظام عمليات متكامل لفحص الوصولات البنكية وإصدار قرارات القبول أو الرفض مع تحديث حالة التتبع فورياً.'
                          : 'Système opérationnel dédié à la vérification des justificatifs bancaires et à l’émission des décisions d’acceptation ou de rejet.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView('admin')}
                      className="px-6 py-3.5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center gap-2.5 transition-colors min-h-[48px] cursor-pointer shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#7FAEA3]" />
                      <span>
                        {dict.nav.admin}{' '}
                        {pendingCount > 0 ? `(${pendingCount})` : ''}
                      </span>
                    </button>
                  </div>

                  {/* 3-Step Operations Pipeline Architecture Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1: Queue */}
                    <div className="bg-[#F3F0E8] p-6 space-y-3 border-t-2 border-[#14263D]">
                      <span className="font-mono text-xs font-bold text-[#14263D] uppercase block">
                        01 · REQUEST QUEUE
                      </span>
                      <h3 className="text-lg font-semibold text-[#10161F]">
                        {dict.admin.tabs.requests}
                      </h3>
                      <p className="text-xs text-[#14263D]/75 leading-relaxed">
                        {language === 'ar'
                          ? 'تصفية وبحث فوري عبر جميع الطلبات مع استعراض المعرّف، المبالغ، والمرسل.'
                          : 'Filtrage et recherche instantanés avec aperçu des montants et de l’émetteur.'}
                      </p>
                      <div className="pt-2">
                        <span className="text-xs font-mono font-semibold text-[#DE655A]">
                          {pendingCount} {language === 'ar' ? 'طلبات قيد المراجعة' : 'en attente'}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Inspector */}
                    <div className="bg-[#F3F0E8] p-6 space-y-3 border-t-2 border-[#14263D]">
                      <span className="font-mono text-xs font-bold text-[#14263D] uppercase block">
                        02 · RECEIPT AUDIT
                      </span>
                      <h3 className="text-lg font-semibold text-[#10161F]">
                        {dict.admin.drawer.receiptBox}
                      </h3>
                      <p className="text-xs text-[#14263D]/75 leading-relaxed">
                        {language === 'ar'
                          ? 'معاينة الوصل البنكي وفحص سلامة التوثيق ورقم العملية محلياً.'
                          : 'Visualisation agrandie du reçu bancaire et audit des références.'}
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#1F5C50]">
                        <FileCheck2 className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تخزين محلي آمن في المتصفح' : 'Stockage local dans le navigateur'}</span>
                      </div>
                    </div>

                    {/* Step 3: Decision */}
                    <div className="bg-[#F3F0E8] p-6 space-y-3 border-t-2 border-[#14263D]">
                      <span className="font-mono text-xs font-bold text-[#14263D] uppercase block">
                        03 · DECISION ENGINE
                      </span>
                      <h3 className="text-lg font-semibold text-[#10161F]">
                        {dict.admin.drawer.decisionBox}
                      </h3>
                      <p className="text-xs text-[#14263D]/75 leading-relaxed">
                        {language === 'ar'
                          ? 'إصدار قرار القبول أو الرفض مع سبب معلن يتزامن فورياً على شاشة العميل.'
                          : 'Décision immédiate d’acceptation ou rejet synchronisée en temps réel.'}
                      </p>
                      <div className="pt-2 flex items-center gap-3 text-xs font-semibold">
                        <span className="text-[#1F5C50]">ACCEPT</span>
                        <span className="text-[#DE655A]">REJECT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CHAPTER 6: FINAL CONFIDENT CALL TO ACTION (Deep Ink #10161F) */}
              <section className="bg-[#10161F] text-[#FAF8F2] py-20 border-t border-[#14263D]">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 text-center space-y-6">
                  <span className="w-2.5 h-2.5 bg-[#DE655A] mx-auto block" aria-hidden="true" />
                  <h2 className="text-3xl sm:text-5xl font-semibold text-[#FAF8F2] tracking-tight max-w-2xl mx-auto">
                    {language === 'ar'
                      ? 'مسار مالي موثوق يربط موريتانيا بساحل العاج.'
                      : 'Un corridor financier maîtrisé entre la Mauritanie et la Côte d’Ivoire.'}
                  </h2>
                  <p className="text-sm sm:text-base text-[#C9D1D0]/85 max-w-xl mx-auto">
                    {language === 'ar'
                      ? 'حساب رياضي شفاف، توثيق مضمون، وتتبع فوري لكل خطوة.'
                      : 'Calculs transparents, justificatifs sécurisés et traçabilité de bout en bout.'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-8 py-4 bg-[#FAF8F2] text-[#10161F] hover:bg-[#7FAEA3] text-sm font-semibold transition-colors min-h-[50px] cursor-pointer shadow-lg inline-flex items-center gap-2"
                    >
                      <span>{dict.hero.primaryCta}</span>
                      <CtaArrow className="w-4 h-4" />
                    </button>
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
      <footer className="bg-[#10161F] text-[#FAF8F2] border-t border-[#14263D]">
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
