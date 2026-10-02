'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck2,
  Layers,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { CORRIDOR_NODES } from '@/lib/design-tokens';

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

  // Scroll-linked and gentle auto-progression across the 5 Transfer Corridor stations
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const scrollY = window.scrollY;
      if (scrollY > 40 && scrollY < 560) {
        const computedIndex = Math.min(
          4,
          Math.max(0, Math.floor(((scrollY - 40) / 420) * 5))
        );
        setActiveStageIndex(computedIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const ArrowDirectional = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const activeStage = dict.hero.stages[activeStageIndex] || dict.hero.stages[0];

  return (
    <section className="relative bg-[#FAF8F2] border-b border-[#C9D1D0] overflow-hidden">
      {/* Subtle architectural coordinate grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(to_right,rgba(20,38,61,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,38,61,0.06)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-12 lg:pt-14 lg:pb-16">
        {/* Top Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Primary Editorial Proposition (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#14263D] tracking-wide">
              <span className="w-2 h-2 bg-[#DE655A]" aria-hidden="true" />
              <span>{dict.hero.kicker}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold text-[#10161F] leading-[1.12] tracking-tight text-balance">
              <span className="block">{dict.hero.headlineLine1}</span>
              <span className="block text-[#14263D] mt-1">{dict.hero.headlineLine2}</span>
            </h1>

            <p className="text-base sm:text-lg text-[#14263D]/85 max-w-xl leading-relaxed">
              {dict.hero.subtitle}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={scrollToWorkspace}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] active:scale-[0.99] transition-all text-sm font-medium whitespace-nowrap min-h-[48px] cursor-pointer"
              >
                <span>{dict.hero.primaryCta}</span>
                <ArrowDown className="w-4 h-4 text-[#7FAEA3]" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('track')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#F3F0E8] text-[#10161F] hover:bg-[#C9D1D0]/50 border border-[#14263D]/30 transition-colors text-sm font-medium whitespace-nowrap min-h-[48px] cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#14263D]" aria-hidden="true" />
                <span>{dict.hero.secondaryCta}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Calibrated Corridor Telemetry & Live Rate Instrument (5 Cols) */}
          <div className="lg:col-span-5 bg-[#F3F0E8] border border-[#14263D]/25 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#C9D1D0]">
              <span className="text-xs font-mono font-semibold text-[#14263D]">
                NKC (MRU) ↔ ABJ (XOF)
              </span>
              <span className="text-xs font-mono tabular-nums text-[#2C6B5F] font-medium">
                1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
              </span>
            </div>

            {/* Two-Station Calibrated Route Visual */}
            <div className="grid grid-cols-11 items-center gap-2 py-2">
              <div className="col-span-4 bg-[#FAF8F2] border border-[#C9D1D0] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#10161F]">MRU</span>
                  <span className="font-mono text-[10px] text-[#14263D]/60">NKC</span>
                </div>
                <p className="text-xs font-medium text-[#14263D] mt-1 truncate">
                  {language === 'ar'
                    ? CORRIDOR_NODES.MRU.countryAr
                    : CORRIDOR_NODES.MRU.countryFr}
                </p>
                <p className="text-[11px] text-[#14263D]/65 font-mono mt-0.5">+222</p>
              </div>

              <div className="col-span-3 flex flex-col items-center justify-center px-1">
                <div className="w-full flex items-center">
                  <span className="w-2 h-2 bg-[#14263D] shrink-0" />
                  <div className="h-[1.5px] flex-1 bg-[#14263D]/30 relative overflow-hidden">
                    {!prefersReducedMotion && (
                      <motion.div
                        className="absolute inset-y-0 w-1/2 bg-[#DE655A]"
                        animate={{
                          x: dir === 'rtl' ? ['100%', '-100%'] : ['-100%', '100%'],
                        }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </div>
                  <ArrowDirectional className="w-3.5 h-3.5 text-[#14263D] mx-0.5 shrink-0" />
                  <div className="h-[1.5px] flex-1 bg-[#14263D]/30" />
                  <span className="w-2 h-2 bg-[#7FAEA3] shrink-0" />
                </div>
                <span className="text-[10px] font-mono text-[#14263D]/70 mt-1.5 tabular-nums">
                  {settings.fixedFeeMru} MRU FEE
                </span>
              </div>

              <div className="col-span-4 bg-[#FAF8F2] border border-[#C9D1D0] p-3 text-end">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#14263D]/60">ABJ</span>
                  <span className="font-mono text-xs font-bold text-[#10161F]">XOF</span>
                </div>
                <p className="text-xs font-medium text-[#14263D] mt-1 truncate">
                  {language === 'ar'
                    ? CORRIDOR_NODES.XOF.countryAr
                    : CORRIDOR_NODES.XOF.countryFr}
                </p>
                <p className="text-[11px] text-[#14263D]/65 font-mono mt-0.5">+225</p>
              </div>
            </div>

            {/* Live Active Waypoint Spotlight inside the Instrument */}
            <div className="bg-[#14263D] text-[#FAF8F2] p-4 border-s-4 border-[#DE655A]">
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#C9D1D0]">
                <span>
                  {activeStage.number} — {activeStage.code}
                </span>
                <span>{activeStage.label}</span>
              </div>
              <p className="text-base font-semibold text-[#FAF8F2] mt-1.5">
                &ldquo;{activeStage.quote}&rdquo;
              </p>
              <p className="text-xs text-[#C9D1D0] mt-1 leading-relaxed">
                {activeStage.detail}
              </p>
            </div>
          </div>
        </div>

        {/* 5-Stage Progressive Transfer Corridor Rail */}
        <div className="mt-10 pt-8 border-t border-[#C9D1D0]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xs font-mono font-semibold text-[#14263D] tracking-wider">
                {dict.hero.corridorTitle}
              </h2>
              <p className="text-xs text-[#14263D]/75 mt-0.5">
                {dict.hero.corridorSubtitle}
              </p>
            </div>
            <div className="text-xs font-mono text-[#14263D]/65 tabular-nums">
              0{activeStageIndex + 1} / 05
            </div>
          </div>

          {/* Interactive 5-Waypoint Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {dict.hero.stages.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              const isPassed = idx < activeStageIndex;

              const StageIcon =
                idx === 0
                  ? Compass
                  : idx === 1
                  ? Scale
                  : idx === 2
                  ? FileCheck2
                  : idx === 3
                  ? Layers
                  : ShieldCheck;

              return (
                <button
                  key={stage.code}
                  type="button"
                  onClick={() => {
                    setUserInteractedWithStage(true);
                    setActiveStageIndex(idx);
                  }}
                  className={`group text-start p-4 border transition-all cursor-pointer flex flex-col justify-between min-h-[124px] ${
                    isActive
                      ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                      : isPassed
                      ? 'bg-[#F3F0E8] text-[#10161F] border-[#7FAEA3]'
                      : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]/60'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isActive
                            ? 'text-[#DE655A]'
                            : isPassed
                            ? 'text-[#2C6B5F]'
                            : 'text-[#14263D]/60'
                        }`}
                      >
                        {stage.number} — {stage.code}
                      </span>
                      <StageIcon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#7FAEA3]'
                            : isPassed
                            ? 'text-[#2C6B5F]'
                            : 'text-[#14263D]/40'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <p
                      className={`text-xs font-medium mt-1 ${
                        isActive ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-current/15 w-full flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        isActive ? 'text-[#FAF8F2]' : 'text-[#10161F]'
                      }`}
                    >
                      {stage.quote}
                    </p>
                    {isPassed && !isActive && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-[#2C6B5F] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
