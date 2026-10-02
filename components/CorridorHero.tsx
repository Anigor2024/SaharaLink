'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { AmountDisplay } from '@/components/ui/corridor-primitives';
import { CORRIDOR_NODES, DESIGN_TOKENS } from '@/lib/design-tokens';
import { calculateTransferQuote } from '@/lib/quote-engine';

export function CorridorHero() {
  const {
    dict,
    dir,
    language,
    settings,
    openTrackingForId,
    applyQuoteToTransferFlow,
  } = useCorridor();

  const prefersReducedMotion = useReducedMotion();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [userInteractedWithStage, setUserInteractedWithStage] = useState(false);
  const [quickTrackInput, setQuickTrackInput] = useState('');

  // Live deterministic demo calculation for 2,500 MRU -> XOF
  const heroSampleQuote = calculateTransferQuote(2500, 'MRU_TO_XOF', settings);

  // Scroll-linked progression across the 5 Transfer Corridor stations
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const scrollY = window.scrollY;
      if (scrollY > 30 && scrollY < 540) {
        const computedIndex = Math.min(
          4,
          Math.max(0, Math.floor(((scrollY - 30) / 400) * 5))
        );
        setActiveStageIndex(computedIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Controlled auto-progression when idle
  useEffect(() => {
    if (prefersReducedMotion || userInteractedWithStage) return;
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % 5);
    }, 3800);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, userInteractedWithStage]);

  const scrollToWorkspace = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('corridor-workspace');
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = quickTrackInput.trim() || 'SL-261002-A7K2';
    openTrackingForId(targetId);
  };

  const ArrowDirectional = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const activeStage = dict.hero.stages[activeStageIndex] || dict.hero.stages[0];
  const progressPercentage = ((activeStageIndex + 1) / 5) * 100;

  return (
    <section className="relative bg-[#FAF8F2] border-b border-[#14263D]/20 overflow-hidden">
      {/* Subtle architectural coordinate grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(to_right,rgba(20,38,61,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,38,61,0.05)_1px,transparent_1px)] bg-[size:72px_72px]"
      />

      <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 pt-7 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* LEFT / MAIN: Editorial Proposition & Structural Financial Hierarchy (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              {/* 3-Second Corridor Identification Bar */}
              <div className="inline-flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#14263D] border-b border-[#14263D]/20 pb-2">
                <span className="w-2 h-2 bg-[#DE655A]" aria-hidden="true" />
                <span className="font-semibold tracking-wide">{dict.hero.kicker}</span>
                <span aria-hidden="true" className="text-[#14263D]/40">
                  /
                </span>
                <span dir="ltr" className="font-bold text-[#10161F]">
                  MRU ↔ XOF
                </span>
              </div>

              {/* Bold Architectural Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-semibold text-[#10161F] leading-[1.14] tracking-tight text-balance">
                <span className="block">{dict.hero.headlineLine1}</span>
                <span className="block text-[#14263D] mt-1.5">
                  {dict.hero.headlineLine2}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#14263D]/85 max-w-xl leading-relaxed">
                {dict.hero.subtitle}
              </p>

              {/* Primary CTA + Quick Track Instrument */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={scrollToWorkspace}
                  className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] active:scale-[0.99] transition-all text-sm font-semibold whitespace-nowrap min-h-[52px] cursor-pointer"
                >
                  <span>{dict.hero.primaryCta}</span>
                  <ArrowDown className="w-4 h-4 text-[#7FAEA3]" aria-hidden="true" />
                </button>

                <form
                  onSubmit={handleQuickTrackSubmit}
                  className="flex-1 flex items-stretch border border-[#14263D]/35 bg-[#F3F0E8] min-h-[52px]"
                >
                  <label htmlFor="hero-quick-track" className="sr-only">
                    {dict.hero.secondaryCta}
                  </label>
                  <input
                    id="hero-quick-track"
                    type="text"
                    dir="ltr"
                    value={quickTrackInput}
                    onChange={(e) => setQuickTrackInput(e.target.value)}
                    placeholder={dict.hero.quickTrackPlaceholder}
                    className="w-full px-3.5 py-2 text-xs font-mono font-semibold text-[#10161F] placeholder:text-[#14263D]/55 bg-transparent focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border-s border-[#14263D]/25 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#DE655A]" aria-hidden="true" />
                    <span>{dict.hero.secondaryCta}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Structural Financial Numbers Bar (No cards-within-cards; hairline architectural layout) */}
            <div className="pt-6 border-t border-[#14263D]/20 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-[11px] font-mono text-[#14263D]/70 block uppercase">
                  {dict.quote.exchangeRateLabel}
                </span>
                <span
                  dir="ltr"
                  className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#10161F] mt-1 block"
                >
                  1 : {settings.exchangeRateMruToXof.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#14263D]/65 font-mono">
                  MRU → XOF
                </span>
              </div>

              <div className="border-s border-[#14263D]/15 ps-4 sm:ps-6">
                <span className="text-[11px] font-mono text-[#14263D]/70 block uppercase">
                  {dict.quote.feeLabel}
                </span>
                <span
                  dir="ltr"
                  className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#10161F] mt-1 block"
                >
                  {settings.fixedFeeMru} MRU
                </span>
                <span className="text-[11px] text-[#2C6B5F] font-medium">
                  {language === 'ar' ? 'ثابتة ومعلنة مسبقاً' : 'Forfait fixe transparent'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-s border-[#14263D]/15 pt-4 sm:pt-0 sm:ps-6">
                <span className="text-[11px] font-mono text-[#14263D]/70 block uppercase">
                  {dict.hero.instrumentActiveAmount}
                </span>
                <button
                  type="button"
                  onClick={() => applyQuoteToTransferFlow('MRU_TO_XOF', 2500, 2)}
                  className="group text-start mt-1 block cursor-pointer"
                >
                  <span
                    dir="ltr"
                    className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#14263D] group-hover:text-[#DE655A] transition-colors block"
                  >
                    {heroSampleQuote.estimatedReceived.toLocaleString('en-US')} XOF
                  </span>
                  <span
                    dir="ltr"
                    className="text-[11px] font-mono text-[#14263D]/70 underline underline-offset-4"
                  >
                    2,500 MRU →
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT / VISUAL SYSTEM: Interactive Animated Transfer Corridor Machine (6 Cols) */}
          <div className="lg:col-span-6 bg-[#10161F] text-[#FAF8F2] border border-[#14263D] flex flex-col justify-between relative overflow-hidden">
            {/* Top Instrument Calibration Header */}
            <div className="px-5 py-3.5 bg-[#14263D]/70 border-b border-[#C9D1D0]/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#7FAEA3] animate-pulse" aria-hidden="true" />
                <span className="font-mono text-[11px] tracking-wider text-[#C9D1D0] uppercase">
                  {dict.hero.instrumentHeader}
                </span>
              </div>
              <span
                dir="ltr"
                className="font-mono text-xs font-bold tabular-nums text-[#7FAEA3]"
              >
                0{activeStageIndex + 1} / 05 · {activeStage.code}
              </span>
            </div>

            {/* Main Corridor Trajectory Display */}
            <div className="p-5 sm:p-7 space-y-6 flex-1 flex flex-col justify-between">
              {/* Origin <-> Destination Node Matrix */}
              <div className="grid grid-cols-11 items-center gap-2">
                {/* Origin Station: NKC / MRU */}
                <div className="col-span-4 border border-[#C9D1D0]/20 bg-[#14263D]/40 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#FAF8F2]">
                      NKC · MRU
                    </span>
                    <span className="w-2 h-2 bg-[#7FAEA3]" />
                  </div>
                  <p className="text-xs text-[#C9D1D0] mt-1 truncate">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.MRU.countryAr} · ${CORRIDOR_NODES.MRU.cityAr}`
                      : `${CORRIDOR_NODES.MRU.countryFr} · ${CORRIDOR_NODES.MRU.cityFr}`}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-[#C9D1D0]/15">
                    <AmountDisplay amount={2500} currency="MRU" size="md" inverted />
                  </div>
                </div>

                {/* Animated Signal Pulse Bridge */}
                <div className="col-span-3 flex flex-col items-center justify-center px-1">
                  <span
                    dir="ltr"
                    className="font-mono text-[10px] text-[#7FAEA3] tabular-nums mb-1.5"
                  >
                    ×{settings.exchangeRateMruToXof.toFixed(2)}
                  </span>

                  <div className="w-full flex items-center">
                    <div className="h-[2px] flex-1 bg-[#C9D1D0]/20 relative overflow-hidden">
                      {!prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-y-0 w-1/2 bg-[#DE655A]"
                          animate={{
                            x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 1.9,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      )}
                    </div>
                    <ArrowDirectional className="w-4 h-4 text-[#7FAEA3] mx-1 shrink-0" />
                    <div className="h-[2px] flex-1 bg-[#C9D1D0]/20" />
                  </div>

                  {/* Calibration ticks */}
                  <div
                    aria-hidden="true"
                    className="w-full flex justify-between px-1 mt-1.5 opacity-40"
                  >
                    <span className="w-[1px] h-1.5 bg-[#C9D1D0]" />
                    <span className="w-[1px] h-1 bg-[#C9D1D0]" />
                    <span className="w-[1px] h-2 bg-[#7FAEA3]" />
                    <span className="w-[1px] h-1 bg-[#C9D1D0]" />
                    <span className="w-[1px] h-1.5 bg-[#C9D1D0]" />
                  </div>
                </div>

                {/* Destination Station: ABJ / XOF */}
                <div className="col-span-4 border border-[#7FAEA3]/40 bg-[#14263D]/60 p-3.5 text-end">
                  <div className="flex items-center justify-between">
                    <span className="w-2 h-2 bg-[#DE655A]" />
                    <span className="font-mono text-xs font-bold text-[#FAF8F2]">
                      ABJ · XOF
                    </span>
                  </div>
                  <p className="text-xs text-[#C9D1D0] mt-1 truncate">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.XOF.countryAr} · ${CORRIDOR_NODES.XOF.cityAr}`
                      : `${CORRIDOR_NODES.XOF.countryFr} · ${CORRIDOR_NODES.XOF.cityFr}`}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-[#C9D1D0]/15">
                    <AmountDisplay
                      amount={heroSampleQuote.estimatedReceived}
                      currency="XOF"
                      size="md"
                      inverted
                      highlight
                    />
                  </div>
                </div>
              </div>

              {/* 5-Stage Calibrated Corridor Progress Rail inside the Machine */}
              <div className="space-y-3">
                {/* Continuous Calibrated Rail */}
                <div className="relative h-1.5 bg-[#14263D] overflow-hidden">
                  <motion.div
                    className="h-full bg-[#7FAEA3]"
                    animate={{ width: `${progressPercentage}%` }}
                    transition={DESIGN_TOKENS.motion.standard}
                  />
                </div>

                {/* 5 Interactive Waypoint Selectors */}
                <div className="grid grid-cols-5 gap-1.5">
                  {dict.hero.stages.map((stage, idx) => {
                    const isActive = idx === activeStageIndex;
                    const isPassed = idx < activeStageIndex;

                    return (
                      <button
                        key={stage.code}
                        type="button"
                        onClick={() => {
                          setUserInteractedWithStage(true);
                          setActiveStageIndex(idx);
                        }}
                        className={`p-2.5 text-start border transition-all cursor-pointer min-h-[68px] flex flex-col justify-between ${
                          isActive
                            ? 'bg-[#FAF8F2] text-[#10161F] border-[#FAF8F2]'
                            : isPassed
                            ? 'bg-[#14263D]/80 text-[#FAF8F2] border-[#7FAEA3]/50'
                            : 'bg-[#14263D]/30 text-[#C9D1D0]/70 border-[#C9D1D0]/15 hover:border-[#C9D1D0]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              isActive
                                ? 'text-[#DE655A]'
                                : isPassed
                                ? 'text-[#7FAEA3]'
                                : 'text-[#C9D1D0]/60'
                            }`}
                          >
                            {stage.number}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 ${
                              isActive
                                ? 'bg-[#DE655A]'
                                : isPassed
                                ? 'bg-[#7FAEA3]'
                                : 'bg-[#C9D1D0]/30'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-semibold tracking-wider truncate block mt-1">
                          {stage.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Stage Editorial Readout */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStage.code}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={DESIGN_TOKENS.motion.fast}
                  className="bg-[#14263D] border-s-4 border-[#DE655A] p-4 sm:p-5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#7FAEA3]">
                    <span>
                      {activeStage.number} — {activeStage.code}
                    </span>
                    <span>{activeStage.label}</span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-[#FAF8F2]">
                    &ldquo;{activeStage.quote}&rdquo;
                  </p>
                  <p className="text-xs sm:text-sm text-[#C9D1D0] leading-relaxed">
                    {activeStage.detail}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
