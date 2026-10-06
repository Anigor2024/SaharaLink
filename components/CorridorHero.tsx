'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
  Radio,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { CORRIDOR_NODES, DESIGN_TOKENS } from '@/lib/design-tokens';
import { calculateTransferQuote, ensureEnglishNumerals, formatTabularNumber } from '@/lib/quote-engine';

export function CorridorHero() {
  const {
    dict,
    dir,
    language,
    settings,
    setActiveView,
  } = useCorridor();

  const prefersReducedMotion = useReducedMotion();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [userInteractedWithStage, setUserInteractedWithStage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Live deterministic calculation for 2,500 MRU -> XOF
  const heroSampleQuote = calculateTransferQuote(2500, 'MRU_TO_XOF', settings);

  // Controlled auto-progression across the 5 corridor stations when idle
  useEffect(() => {
    if (prefersReducedMotion || userInteractedWithStage) return;
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, userInteractedWithStage]);

  const scrollToQuote = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('live-quote-bridge');
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  const scrollToTracking = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('tracking-chapter');
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        return;
      }
    }
    setActiveView('track');
  };

  const ArrowDirectional = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const activeStage = dict.hero.stages[activeStageIndex] || dict.hero.stages[0];
  const progressPercentage = ((activeStageIndex + 1) / 5) * 100;

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-between bg-[#10161F] text-[#FAF8F2] overflow-hidden pt-20 sm:pt-24 pb-6">
      {/* Cinematic Architectural Background Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(201,209,208,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,209,208,0.06)_1px,transparent_1px)] bg-[size:72px_72px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-[#14263D]/70 via-[#14263D]/25 to-transparent blur-3xl opacity-50"
      />

      {/* Main Hero Viewport Container — Balanced 12-Column Spatial Composition */}
      <div className="relative flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 flex flex-col justify-center py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT / START (7 Cols): Headline, Subtitle, Direct CTAs & Trust Metrics */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10">
            {/* Kicker & Route Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#C9D1D0]/80">
              <span className="w-2 h-2 bg-[#DE655A]" aria-hidden="true" />
              <span className="font-semibold tracking-wider text-[#FAF8F2]">
                {dict.hero.kicker}
              </span>
              <span aria-hidden="true" className="text-[#C9D1D0]/30">
                ·
              </span>
              <span dir="ltr" className="text-[#7FAEA3] font-bold">
                NKC (MRU) ↔ ABJ (XOF)
              </span>
              <span aria-hidden="true" className="text-[#C9D1D0]/30">
                ·
              </span>
              <span dir="ltr">
                1 MRU = {ensureEnglishNumerals(settings.exchangeRateMruToXof.toFixed(2))} XOF
              </span>
            </div>

            {/* Large Architectural Headline */}
            <div className="space-y-4 sm:space-y-5">
              <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-semibold text-[#FAF8F2] leading-[1.08] tracking-tight text-balance">
                <span className="block">{dict.hero.headlineLine1}</span>
                <span className="block text-[#7FAEA3] mt-1 sm:mt-2">
                  {dict.hero.headlineLine2}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#C9D1D0]/85 max-w-xl leading-relaxed">
                {dict.hero.subtitle}
              </p>
            </div>

            {/* Confident Primary & Secondary Action Pair */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToQuote}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FAF8F2] text-[#10161F] hover:bg-[#7FAEA3] active:scale-[0.99] transition-all text-sm font-semibold whitespace-nowrap min-h-[52px] cursor-pointer shadow-lg"
              >
                <span>{dict.hero.primaryCta}</span>
                <ArrowDown className="w-4 h-4 text-[#14263D]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={scrollToTracking}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-medium text-[#FAF8F2] hover:text-[#7FAEA3] transition-colors whitespace-nowrap min-h-[52px] cursor-pointer border-b border-[#FAF8F2]/30 hover:border-[#7FAEA3]"
              >
                <Compass className="w-4 h-4 text-[#DE655A]" aria-hidden="true" />
                <span>{dict.hero.secondaryCta}</span>
                <ArrowDirectional className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
              </button>
            </div>

            {/* Trust & Integrity Indicators (Integrated quietly into start column with strictly English digits) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#C9D1D0]/15 text-xs text-[#C9D1D0]/80">
              <div className="space-y-1">
                <span className="font-mono text-[11px] text-[#7FAEA3] font-bold block">
                  01 · ZERO HIDDEN FEES
                </span>
                <p className="font-medium text-[#FAF8F2]">
                  {language === 'ar' ? '25 أوقية رسوم ثابتة فقط' : 'Frais fixes à 25 MRU'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[11px] text-[#7FAEA3] font-bold block">
                  02 · LIVE STATUS
                </span>
                <p className="font-medium text-[#FAF8F2]">
                  {language === 'ar' ? 'تتبع لحظي متزامن' : 'Traçabilité en direct'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[11px] text-[#7FAEA3] font-bold block">
                  03 · MOBILE WALLET
                </span>
                <p className="font-medium text-[#FAF8F2]">
                  {language === 'ar' ? 'تسليم فوري ومباشر' : 'Règlement instantané'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT / END (5 Cols) — CORRIDOR ROUTE INTELLIGENCE & TRANSIT SIGNAL MAP */}
          {/* Spatial, borderless, architecturally integrated — fills the dark blue hero space with purpose */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Backlight Aura */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 bg-gradient-to-tr from-[#14263D]/40 via-[#7FAEA3]/5 to-transparent blur-2xl"
            />

            <div className="relative space-y-6">
              {/* Telemetry Status Bar — Clean & Integrated without Heavy Card Frames */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[#C9D1D0]/20 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#7FAEA3]">
                  <Radio className="w-3.5 h-3.5 text-[#7FAEA3] animate-pulse" aria-hidden="true" />
                  <span className="font-semibold tracking-wider">
                    CORRIDOR ROUTE INTELLIGENCE
                  </span>
                </div>
                <span className="text-[#C9D1D0]/70 uppercase tracking-widest text-[11px]">
                  LIVE TELEMETRY
                </span>
              </div>

              {/* Transit Nodes: Origin ─── Pulse ─── Destination */}
              <div className="space-y-5">
                {/* Station 1: NKC / MRU */}
                <div className="space-y-1.5 p-3.5 sm:p-4 bg-[#14263D]/30 border-s-2 border-[#FAF8F2]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FAF8F2]" aria-hidden="true" />
                      <span className="font-bold text-[#FAF8F2]">NKC · MRU</span>
                      <span className="text-[#C9D1D0]/60">(18.07° N, 15.96° W)</span>
                    </div>
                    <span className="text-[#C9D1D0]/70 uppercase text-[11px]">
                      {dict.quote.youSendTag}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#C9D1D0]/80">
                      {language === 'ar'
                        ? `${CORRIDOR_NODES.MRU.countryAr} · ${CORRIDOR_NODES.MRU.cityAr}`
                        : `${CORRIDOR_NODES.MRU.countryFr} · ${CORRIDOR_NODES.MRU.cityFr}`}
                    </span>
                    <span dir="ltr" className="font-mono text-2xl font-bold text-[#FAF8F2]">
                      2,500 <span className="text-sm font-normal text-[#C9D1D0]">MRU</span>
                    </span>
                  </div>
                </div>

                {/* Animated Pulse Route Bridge & Signal Transmission */}
                <div className="py-1 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#7FAEA3]">
                    <span dir="ltr">RATE: 1 MRU = {ensureEnglishNumerals(settings.exchangeRateMruToXof.toFixed(2))} XOF</span>
                    <span className="inline-flex items-center gap-1 text-[#C9D1D0]">
                      <Zap className="w-3 h-3 text-[#DE655A]" />
                      <span>{language === 'ar' ? 'تسليم فوري' : 'Instantané'}</span>
                    </span>
                  </div>

                  <div className="w-full flex items-center">
                    <div className="h-[2px] flex-1 bg-[#C9D1D0]/20 relative overflow-hidden">
                      {isMounted && !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-y-0 w-1/2 bg-[#DE655A]"
                          animate={{
                            x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      )}
                    </div>
                    <ArrowDirectional className="w-4 h-4 text-[#7FAEA3] mx-2 shrink-0" />
                    <div className="h-[2px] flex-1 bg-[#C9D1D0]/20" />
                  </div>

                  {/* Micro Stage Waypoint Indicators (English numerals only: 01 to 05) */}
                  <div
                    aria-hidden="true"
                    className="flex justify-between text-[10px] font-mono text-[#C9D1D0]/60 pt-0.5"
                  >
                    <span>01 ORIGIN</span>
                    <span>02 QUOTE</span>
                    <span>03 RECEIPT</span>
                    <span>04 REVIEW</span>
                    <span>05 STATUS</span>
                  </div>
                </div>

                {/* Station 2: ABJ / XOF (Luminous Focal Payout) */}
                <div className="space-y-1.5 p-3.5 sm:p-4 bg-[#14263D]/40 border-s-2 border-[#7FAEA3]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#7FAEA3]" aria-hidden="true" />
                      <span className="font-bold text-[#FAF8F2]">ABJ · XOF</span>
                      <span className="text-[#C9D1D0]/60">(05.36° N, 04.00° W)</span>
                    </div>
                    <span className="text-[#7FAEA3] font-semibold uppercase text-[11px]">
                      {dict.quote.recipientGetsTag}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#C9D1D0]/80">
                      {language === 'ar'
                        ? `${CORRIDOR_NODES.XOF.countryAr} · ${CORRIDOR_NODES.XOF.cityAr}`
                        : `${CORRIDOR_NODES.XOF.countryFr} · ${CORRIDOR_NODES.XOF.cityFr}`}
                    </span>
                    <span
                      dir="ltr"
                      className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#7FAEA3] tabular-nums"
                    >
                      {formatTabularNumber(heroSampleQuote.estimatedReceived, 0)}{' '}
                      <span className="text-base font-normal text-[#FAF8F2]">XOF</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Transit Network Ecosystem Strip */}
              <div className="pt-3 border-t border-[#C9D1D0]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#C9D1D0]/80 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7FAEA3]" />
                  <span>Bankily · Wave · Orange Money · MTN</span>
                </div>
                <button
                  type="button"
                  onClick={scrollToQuote}
                  className="text-xs font-mono font-semibold text-[#7FAEA3] hover:text-[#FAF8F2] underline underline-offset-4 cursor-pointer"
                >
                  {language === 'ar' ? 'عرض الحساب الرياضي ←' : 'Calculer le montant →'}
                </button>
              </div>

              {/* Integrated Trust & Operational Signal Markers (Secondary visual layer filling the space) */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-[#C9D1D0]/70">
                <div className="p-2 bg-[#14263D]/20 border-t border-[#C9D1D0]/10">
                  <span className="text-[#7FAEA3] block font-bold">256-BIT</span>
                  <span>ENCRYPTED VAULT</span>
                </div>
                <div className="p-2 bg-[#14263D]/20 border-t border-[#C9D1D0]/10">
                  <span className="text-[#7FAEA3] block font-bold">ZERO</span>
                  <span>HIDDEN SPREAD</span>
                </div>
                <div className="p-2 bg-[#14263D]/20 border-t border-[#C9D1D0]/10">
                  <span className="text-[#7FAEA3] block font-bold">&lt; 15 MIN</span>
                  <span>SETTLEMENT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Spatial Five-Stage Corridor Rail (Integrated along bottom of hero) */}
      <div className="relative border-t border-[#C9D1D0]/15 bg-[#10161F]/80 backdrop-blur-md">
        {/* Continuous Calibrated Progress Rail */}
        <div className="h-[2px] bg-[#14263D] overflow-hidden">
          <motion.div
            className="h-full bg-[#7FAEA3]"
            animate={{ width: `${progressPercentage}%` }}
            transition={DESIGN_TOKENS.motion.standard}
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                  className={`text-start py-2 px-1 transition-all cursor-pointer border-b-2 flex flex-col justify-between ${
                    isActive
                      ? 'border-[#DE655A] text-[#FAF8F2]'
                      : isPassed
                      ? 'border-[#7FAEA3]/60 text-[#FAF8F2]/90'
                      : 'border-transparent text-[#C9D1D0]/50 hover:text-[#C9D1D0]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold tabular-nums ${
                        isActive
                          ? 'text-[#DE655A]'
                          : isPassed
                          ? 'text-[#7FAEA3]'
                          : 'text-[#C9D1D0]/50'
                      }`}
                    >
                      {stage.number}
                    </span>
                    <span className="font-mono text-[11px] font-semibold tracking-wider">
                      {stage.code}
                    </span>
                  </div>
                  <span className="text-xs truncate block mt-0.5 opacity-80">
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Editorial Readout */}
          <div className="mt-3 pt-2 border-t border-[#C9D1D0]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#7FAEA3] font-bold">
                0{activeStageIndex + 1} / 05 · {activeStage.code}
              </span>
              <span className="text-[#FAF8F2] font-medium">
                &ldquo;{activeStage.quote}&rdquo;
              </span>
            </div>
            <span className="text-[#C9D1D0]/70 text-[11px]">
              {activeStage.detail}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
