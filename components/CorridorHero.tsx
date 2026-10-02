'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Radio,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live deterministic demo calculation for 2,500 MRU -> XOF
  const heroSampleQuote = calculateTransferQuote(2500, 'MRU_TO_XOF', settings);

  // Controlled auto-progression across the 5 corridor stations when idle
  useEffect(() => {
    if (prefersReducedMotion || userInteractedWithStage) return;
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % 5);
    }, 4200);
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
    <section className="relative min-h-[100svh] flex flex-col justify-between bg-[#10161F] text-[#FAF8F2] overflow-hidden">
      {/* Cinematic Architectural Background Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(to_right,rgba(201,209,208,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,209,208,0.08)_1px,transparent_1px)] bg-[size:64px_64px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#14263D]/60 via-[#14263D]/20 to-transparent blur-3xl opacity-60"
      />

      {/* Main Full-Viewport Hero Body */}
      <div className="relative flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 flex flex-col justify-center">
        <div className="space-y-8 sm:space-y-10">
          {/* Top Corridor Kicker Bar */}
          <div className="inline-flex flex-wrap items-center gap-3 text-xs font-mono text-[#C9D1D0] border-b border-[#C9D1D0]/20 pb-3">
            <span className="w-2 h-2 bg-[#DE655A] animate-pulse" aria-hidden="true" />
            <span className="font-semibold tracking-wider">{dict.hero.kicker}</span>
            <span aria-hidden="true" className="text-[#C9D1D0]/40">
              /
            </span>
            <span dir="ltr" className="font-bold text-[#7FAEA3]">
              NKC (MRU) ↔ ABJ (XOF)
            </span>
            <span aria-hidden="true" className="text-[#C9D1D0]/40">
              /
            </span>
            <span className="text-[#C9D1D0]/75">
              1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
            </span>
          </div>

          {/* Large Architectural Editorial Headline */}
          <div className="max-w-4xl space-y-4 sm:space-y-5">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-semibold text-[#FAF8F2] leading-[1.12] tracking-tight text-balance">
              <span className="block">{dict.hero.headlineLine1}</span>
              <span className="block text-[#7FAEA3] mt-1 sm:mt-2">
                {dict.hero.headlineLine2}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-[#C9D1D0]/90 max-w-2xl leading-relaxed">
              {dict.hero.subtitle}
            </p>
          </div>

          {/* Primary CTA + Quick Track Instrument */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl pt-1">
            <button
              type="button"
              onClick={scrollToWorkspace}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FAF8F2] text-[#10161F] hover:bg-[#7FAEA3] active:scale-[0.99] transition-all text-sm font-semibold whitespace-nowrap min-h-[54px] cursor-pointer shadow-lg"
            >
              <span>{dict.hero.primaryCta}</span>
              <ArrowDown className="w-4 h-4 text-[#14263D]" aria-hidden="true" />
            </button>

            <form
              onSubmit={handleQuickTrackSubmit}
              className="flex-1 flex items-stretch border border-[#C9D1D0]/30 bg-[#14263D]/70 backdrop-blur-xs min-h-[54px]"
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
                className="w-full px-4 py-2 text-xs font-mono font-semibold text-[#FAF8F2] placeholder:text-[#C9D1D0]/50 bg-transparent focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-5 bg-[#14263D] hover:bg-[#FAF8F2] text-[#FAF8F2] hover:text-[#10161F] border-s border-[#C9D1D0]/25 text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#DE655A]" aria-hidden="true" />
                <span>{dict.hero.secondaryCta}</span>
              </button>
            </form>
          </div>

          {/* THE LIVE TRANSFER CORRIDOR — Prominent Node-to-Node Transformation Strip */}
          <div className="border border-[#C9D1D0]/25 bg-[#14263D]/60 backdrop-blur-md p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#C9D1D0]/15">
              <div className="flex items-center gap-2 text-xs font-mono text-[#7FAEA3]">
                <Radio className="w-3.5 h-3.5 text-[#7FAEA3] animate-pulse" aria-hidden="true" />
                <span className="font-semibold tracking-wider">THE LIVE TRANSFER CORRIDOR</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-[#C9D1D0]">
                <span>
                  {dict.quote.feeLabel}:{' '}
                  <strong className="text-[#FAF8F2]">{settings.fixedFeeMru} MRU</strong> (
                  {language === 'ar' ? 'ثابتة' : 'Fixe'})
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  1 MRU ={' '}
                  <strong className="text-[#7FAEA3]">{settings.exchangeRateMruToXof.toFixed(2)} XOF</strong>
                </span>
              </div>
            </div>

            {/* Origin <-> Route <-> Destination Trajectory */}
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 md:gap-2">
              {/* Origin Station: NKC / MRU */}
              <div className="md:col-span-4 border border-[#C9D1D0]/20 bg-[#10161F]/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#FAF8F2]">
                    NKC · MRU
                  </span>
                  <span className="w-2.5 h-2.5 bg-[#FAF8F2]" />
                </div>
                <p className="text-xs text-[#C9D1D0] mt-1 font-medium">
                  {language === 'ar'
                    ? `${CORRIDOR_NODES.MRU.countryAr} · ${CORRIDOR_NODES.MRU.cityAr}`
                    : `${CORRIDOR_NODES.MRU.countryFr} · ${CORRIDOR_NODES.MRU.cityFr}`}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#C9D1D0]/15">
                  <AmountDisplay amount={2500} currency="MRU" size="lg" inverted />
                  <span className="text-[11px] font-mono text-[#C9D1D0]/70 block mt-0.5">
                    {dict.quote.youSendTag}
                  </span>
                </div>
              </div>

              {/* Animated Signal Pulse Bridge */}
              <div className="md:col-span-3 flex flex-col items-center justify-center px-2 py-2">
                <span
                  dir="ltr"
                  className="font-mono text-xs text-[#7FAEA3] font-bold tabular-nums mb-1.5"
                >
                  × {settings.exchangeRateMruToXof.toFixed(2)}
                </span>

                <div className="w-full flex items-center">
                  <div className="h-[2px] flex-1 bg-[#C9D1D0]/25 relative overflow-hidden">
                    {isMounted && !prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-y-0 w-1/2 bg-[#DE655A]"
                        animate={{
                          x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2.1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                  </div>
                  <ArrowDirectional className="w-4 h-4 text-[#7FAEA3] mx-1.5 shrink-0" />
                  <div className="h-[2px] flex-1 bg-[#C9D1D0]/25" />
                </div>

                <button
                  type="button"
                  onClick={() => applyQuoteToTransferFlow('MRU_TO_XOF', 2500, 2)}
                  className="mt-2 text-[11px] font-mono text-[#C9D1D0] hover:text-[#FAF8F2] underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
                >
                  <span>{dict.hero.continueTransferCta || 'ابدأ بهذا المبلغ'}</span>
                  <Sparkles className="w-3 h-3 text-[#7FAEA3]" />
                </button>
              </div>

              {/* Destination Station: ABJ / XOF */}
              <div className="md:col-span-4 border border-[#7FAEA3]/40 bg-[#10161F]/80 p-4 text-end">
                <div className="flex items-center justify-between">
                  <span className="w-2.5 h-2.5 bg-[#DE655A]" />
                  <span className="font-mono text-xs font-bold text-[#FAF8F2]">
                    ABJ · XOF
                  </span>
                </div>
                <p className="text-xs text-[#C9D1D0] mt-1 font-medium">
                  {language === 'ar'
                    ? `${CORRIDOR_NODES.XOF.countryAr} · ${CORRIDOR_NODES.XOF.cityAr}`
                    : `${CORRIDOR_NODES.XOF.countryFr} · ${CORRIDOR_NODES.XOF.cityFr}`}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#C9D1D0]/15">
                  <AmountDisplay
                    amount={heroSampleQuote.estimatedReceived}
                    currency="XOF"
                    size="lg"
                    inverted
                    highlight
                  />
                  <span className="text-[11px] font-mono text-[#7FAEA3] block mt-0.5">
                    {dict.quote.recipientGetsTag}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Five Quiet Calibrated Corridor Stages (Bottom Rail) */}
      <div className="relative border-t border-[#C9D1D0]/20 bg-[#10161F]/95 backdrop-blur-md">
        {/* Continuous Calibrated Progress Rail */}
        <div className="h-1 bg-[#14263D] overflow-hidden">
          <motion.div
            className="h-full bg-[#7FAEA3]"
            animate={{ width: `${progressPercentage}%` }}
            transition={DESIGN_TOKENS.motion.standard}
          />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
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
                  className={`p-3 text-start border transition-all cursor-pointer min-h-[68px] flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#FAF8F2] text-[#10161F] border-[#FAF8F2] shadow-sm'
                      : isPassed
                      ? 'bg-[#14263D]/80 text-[#FAF8F2] border-[#7FAEA3]/40'
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
                  <div className="mt-1">
                    <span className="font-mono text-[10px] font-bold tracking-wider block">
                      {stage.code}
                    </span>
                    <span className="text-[11px] font-medium truncate block opacity-85">
                      {stage.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Editorial Subtitle */}
          <div className="mt-3 pt-2.5 border-t border-[#C9D1D0]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#7FAEA3] font-bold">
                0{activeStageIndex + 1} / 05 · {activeStage.code}
              </span>
              <span className="text-[#FAF8F2] font-semibold">
                &ldquo;{activeStage.quote}&rdquo;
              </span>
            </div>
            <span className="text-[#C9D1D0]/80 text-[11px]">
              {activeStage.detail}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
