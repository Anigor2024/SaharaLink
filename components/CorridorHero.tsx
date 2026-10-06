'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { CORRIDOR_NODES, DESIGN_TOKENS } from '@/lib/design-tokens';
import { calculateTransferQuote, formatTabularNumber } from '@/lib/quote-engine';

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

  // Live deterministic demo calculation for 2,500 MRU -> XOF
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
      {/* Cinematic Architectural Background Ambience */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(201,209,208,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,209,208,0.06)_1px,transparent_1px)] bg-[size:72px_72px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 start-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-[#14263D]/70 via-[#14263D]/25 to-transparent blur-3xl opacity-50"
      />

      {/* Main Hero Container */}
      <div className="relative flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 flex flex-col justify-center py-6 sm:py-10">
        <div className="space-y-10 sm:space-y-12">
          {/* 1. Kicker & Structural Geographical Coordinates (Unboxed, clean) */}
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
            <span>1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF</span>
            <span aria-hidden="true" className="text-[#C9D1D0]/30">
              ·
            </span>
            <span className="text-[#C9D1D0]/60">
              {language === 'ar' ? 'الرسوم 25 أوقية ثابتة' : 'Frais fixes : 25 MRU'}
            </span>
          </div>

          {/* 2. Large Dominant Architectural Headline & Subtitle */}
          <div className="max-w-4xl space-y-4 sm:space-y-5">
            <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-semibold text-[#FAF8F2] leading-[1.08] tracking-tight text-balance">
              <span className="block">{dict.hero.headlineLine1}</span>
              <span className="block text-[#7FAEA3] mt-1 sm:mt-2">
                {dict.hero.headlineLine2}
              </span>
            </h1>

            <p className="text-base sm:text-xl text-[#C9D1D0]/85 max-w-2xl leading-relaxed">
              {dict.hero.subtitle}
            </p>
          </div>

          {/* 3. THE SPATIAL TRANSFER CORRIDOR (Integrated into the canvas, NO large outer dashboard box) */}
          <div className="relative py-4 sm:py-6">
            <div className="flex flex-col gap-6">
              {/* Origin Station, Route Signal & Destination Station */}
              <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-4">
                {/* Station 1: NKC / MRU */}
                <div className="md:col-span-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#FAF8F2]" aria-hidden="true" />
                    <span className="font-mono text-sm font-bold tracking-wider text-[#FAF8F2]">
                      NKC · MRU
                    </span>
                    <span className="text-xs text-[#C9D1D0]/60 font-mono">
                      (18.07° N)
                    </span>
                  </div>
                  <p className="text-xs text-[#C9D1D0]/80">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.MRU.countryAr} · ${CORRIDOR_NODES.MRU.cityAr}`
                      : `${CORRIDOR_NODES.MRU.countryFr} · ${CORRIDOR_NODES.MRU.cityFr}`}
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono text-[#C9D1D0]/70 uppercase block">
                      {dict.quote.youSendTag}
                    </span>
                    <span
                      dir="ltr"
                      className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#FAF8F2] block mt-0.5 tabular-nums"
                    >
                      2,500 <span className="text-lg font-normal text-[#C9D1D0]">MRU</span>
                    </span>
                  </div>
                </div>

                {/* Spatial Animated Route Line & Rate Pulse */}
                <div className="md:col-span-4 flex flex-col items-center justify-center py-2">
                  <span
                    dir="ltr"
                    className="font-mono text-xs text-[#7FAEA3] font-bold tabular-nums mb-2"
                  >
                    × {settings.exchangeRateMruToXof.toFixed(2)}
                  </span>

                  {/* Route Trajectory */}
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

                  {/* Subtle Calibrated Station Nodes */}
                  <div
                    aria-hidden="true"
                    className="w-full flex justify-between px-2 mt-2 opacity-50 text-[10px] font-mono text-[#C9D1D0]"
                  >
                    <span>01</span>
                    <span>02</span>
                    <span>03</span>
                    <span>04</span>
                    <span>05</span>
                  </div>
                </div>

                {/* Station 2: ABJ / XOF (Destination with Focal Result) */}
                <div className="md:col-span-4 md:text-end space-y-2">
                  <div className="flex md:justify-end items-center gap-2">
                    <span className="text-xs text-[#C9D1D0]/60 font-mono">
                      (05.36° N)
                    </span>
                    <span className="font-mono text-sm font-bold tracking-wider text-[#FAF8F2]">
                      ABJ · XOF
                    </span>
                    <span className="w-2.5 h-2.5 bg-[#DE655A]" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-[#C9D1D0]/80">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.XOF.countryAr} · ${CORRIDOR_NODES.XOF.cityAr}`
                      : `${CORRIDOR_NODES.XOF.countryFr} · ${CORRIDOR_NODES.XOF.cityFr}`}
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono text-[#7FAEA3] uppercase block font-semibold">
                      {dict.quote.recipientGetsTag}
                    </span>
                    <span
                      dir="ltr"
                      className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold tracking-tight text-[#7FAEA3] block mt-0.5 tabular-nums"
                    >
                      {formatTabularNumber(heroSampleQuote.estimatedReceived, 0)}{' '}
                      <span className="text-lg font-normal text-[#FAF8F2]">XOF</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Simplified CTA Area (Clean pair, ZERO form input fields) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {/* Primary Action: Solid, Confident */}
            <button
              type="button"
              onClick={scrollToQuote}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FAF8F2] text-[#10161F] hover:bg-[#7FAEA3] active:scale-[0.99] transition-all text-sm font-semibold whitespace-nowrap min-h-[52px] cursor-pointer shadow-lg"
            >
              <span>{dict.hero.primaryCta}</span>
              <ArrowDown className="w-4 h-4 text-[#14263D]" aria-hidden="true" />
            </button>

            {/* Secondary Action: Elegant Text + Compass Route Action */}
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
        </div>
      </div>

      {/* 5. Spatial Five-Stage Corridor Rail (Integrated subtly along bottom of hero) */}
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
