'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  const [activeStageIndex, setActiveStageIndex] = useState(1); // Default focal waypoint: 02 QUOTE
  const [userPausedAuto, setUserPausedAuto] = useState(false);

  // Deterministic live calculation for the single hero example: 2,500 MRU -> XOF
  const heroQuote = calculateTransferQuote(2500, 'MRU_TO_XOF', settings);

  // Subtle auto-progression across the 5 corridor stages (paused under prefers-reduced-motion or user selection)
  useEffect(() => {
    if (prefersReducedMotion || userPausedAuto) return;
    const timer = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % 5);
    }, 3400);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, userPausedAuto]);

  // Subtle scroll-linked stage response across the top viewport
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined' || userPausedAuto) return;
      const scrollY = window.scrollY;
      if (scrollY > 20 && scrollY < 500) {
        const idx = Math.min(4, Math.max(0, Math.floor((scrollY / 420) * 5)));
        setActiveStageIndex(idx);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [userPausedAuto]);

  const handleStartTransfer = () => {
    if (typeof document !== 'undefined') {
      const target = document.getElementById('live-quote-bridge');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
  };

  const handleOpenTracking = () => {
    setActiveView('track');
  };

  const stages = dict.hero.stages;
  const activeStage = stages[activeStageIndex] || stages[1];
  const progressPercent = (activeStageIndex / 4) * 100;
  const CtaArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section
      aria-label="SaharaLink Transfer Corridor Hero"
      className="relative min-h-[100svh] w-full bg-[#10161F] text-[#FAF8F2] flex flex-col justify-between overflow-hidden pt-20 pb-6 sm:pt-24 sm:pb-10 border-b border-[#14263D]"
    >
      {/* Architectural Material Depth & Fine Calibration Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(20,38,61,0.75)_0%,rgba(16,22,31,0.98)_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(201,209,208,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,209,208,0.08)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      {/* Horizontal Coordinate Hairline Across the Viewport */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 inset-x-0 h-[1px] bg-[#C9D1D0]/8 hidden lg:block"
      />

      {/* Main Full-Screen Asymmetric Composition */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-8 my-auto py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* PRIMARY EDITORIAL AREA (5 Columns on Desktop) */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={DESIGN_TOKENS.motion.enter}
            className="lg:col-span-5 space-y-6 sm:space-y-8"
          >
            {/* Quiet Corridor Designation */}
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#14263D] border border-[#C9D1D0]/20 font-mono text-[11px] font-semibold tracking-wider text-[#FAF8F2]">
                <span className="w-1.5 h-1.5 bg-[#DE655A]" aria-hidden="true" />
                <span dir="ltr">MRU ↔ XOF</span>
              </span>
              <span className="text-xs font-medium text-[#C9D1D0]/85 tracking-wide">
                {dict.hero.kicker}
              </span>
            </div>

            {/* Architectural Headline */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-[2.35rem] sm:text-5xl lg:text-[3.65rem] xl:text-[4rem] font-semibold tracking-tight text-[#FAF8F2] leading-[1.14]">
                <span className="block">{dict.hero.headlineLine1}</span>
                <span className="block text-[#7FAEA3] mt-1">
                  {dict.hero.headlineLine2}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#C9D1D0]/85 leading-relaxed max-w-[46ch] font-normal">
                {dict.hero.subtitle}
              </p>
            </div>

            {/* Bespoke Corridor CTA Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={handleStartTransfer}
                className="group relative px-6 py-4 bg-[#DE655A] hover:bg-[#d3564b] text-[#FAF8F2] text-sm sm:text-base font-semibold inline-flex items-center justify-between sm:justify-center gap-4 transition-all min-h-[54px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF8F2]"
              >
                <span className="whitespace-nowrap">{dict.hero.primaryCta}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center gap-1.5"
                >
                  <span className="w-6 group-hover:w-10 h-[1.5px] bg-[#FAF8F2] transition-all duration-200" />
                  <CtaArrow className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenTracking}
                className="px-6 py-4 bg-transparent hover:bg-[#14263D] text-[#F3F0E8] border border-[#C9D1D0]/30 hover:border-[#7FAEA3] text-sm sm:text-base font-medium inline-flex items-center justify-center gap-2.5 transition-colors min-h-[54px] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7FAEA3]"
              >
                <Compass className="w-4 h-4 text-[#7FAEA3]" aria-hidden="true" />
                <span>{dict.hero.secondaryCta}</span>
              </button>
            </div>
          </motion.div>

          {/* SIGNATURE PRODUCT VISUAL: THE LIVE TRANSFER CORRIDOR (7 Columns on Desktop) */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...DESIGN_TOKENS.motion.enter, delay: 0.08 }}
            className="lg:col-span-7 relative"
          >
            {/* Open Unboxed Financial Instrument Plane */}
            <div className="relative pt-2 sm:pt-4 lg:ps-6">
              {/* Top Technical Coordinate Hairline */}
              <div
                dir="ltr"
                className="flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-[#C9D1D0]/55 pb-4 border-b border-[#C9D1D0]/15"
              >
                <span>CORRIDOR INSTRUMENT · NKC ──► ABJ</span>
                <span className="text-[#7FAEA3]">
                  STAGE {activeStage.number}/05 · {activeStage.code}
                </span>
              </div>

              {/* ONE LIVE QUOTE MOMENT: 2,500 MRU ---> 38,115 XOF */}
              <div
                dir="ltr"
                className="py-6 sm:py-9 grid grid-cols-1 sm:grid-cols-11 gap-6 items-center border-b border-[#C9D1D0]/15"
              >
                {/* Origin Endpoint & Sent Amount */}
                <div className="sm:col-span-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full border border-[#FAF8F2]/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 bg-[#FAF8F2]" />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-widest text-[#FAF8F2]">
                      {CORRIDOR_NODES.MRU.stationCode}
                    </span>
                    <span className="text-xs text-[#C9D1D0]/70 font-mono">
                      · {CORRIDOR_NODES.MRU.countryFr} · MRU
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5 pt-1">
                    <span className="font-mono text-3xl sm:text-4xl xl:text-[2.75rem] font-bold tabular-nums tracking-tight text-[#FAF8F2]">
                      {formatTabularNumber(heroQuote.amountSent, 0)}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-semibold text-[#C9D1D0]">
                      MRU
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-[#C9D1D0]/65">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.MRU.countryAr} (${CORRIDOR_NODES.MRU.cityAr})`
                      : `${CORRIDOR_NODES.MRU.countryFr} (${CORRIDOR_NODES.MRU.cityFr})`}
                  </p>
                </div>

                {/* Center Transformation Vector */}
                <div className="sm:col-span-1 flex sm:flex-col items-center justify-center gap-2 py-1">
                  <div className="h-[1px] sm:h-10 w-full sm:w-[1px] bg-[#C9D1D0]/20 relative overflow-hidden">
                    {!prefersReducedMotion && (
                      <motion.span
                        className="absolute inset-0 bg-[#DE655A]"
                        animate={{
                          opacity: [0.2, 1, 0.2],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#DE655A] shrink-0 hidden sm:block" />
                  <ArrowDown className="w-4 h-4 text-[#DE655A] shrink-0 sm:hidden" />
                </div>

                {/* Destination Endpoint & Net Received Amount */}
                <div className="sm:col-span-5 sm:text-right space-y-2">
                  <div className="flex items-center sm:justify-end gap-2.5">
                    <span className="relative flex h-3 w-3 items-center justify-center sm:order-3">
                      <span className="absolute inline-flex h-full w-full border border-[#7FAEA3]/70" />
                      <span className="relative inline-flex h-1.5 w-1.5 bg-[#7FAEA3]" />
                    </span>
                    <span className="font-mono text-xs font-bold tracking-widest text-[#7FAEA3] sm:order-2">
                      {CORRIDOR_NODES.XOF.stationCode}
                    </span>
                    <span className="text-xs text-[#C9D1D0]/70 font-mono sm:order-1">
                      {CORRIDOR_NODES.XOF.countryFr} · XOF ·
                    </span>
                  </div>

                  <div className="flex items-baseline sm:justify-end gap-2.5 pt-1">
                    <motion.span
                      key={heroQuote.estimatedReceived}
                      initial={prefersReducedMotion ? false : { opacity: 0.5, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={DESIGN_TOKENS.motion.fast}
                      className="font-mono text-3xl sm:text-4xl xl:text-[2.75rem] font-bold tabular-nums tracking-tight text-[#7FAEA3]"
                    >
                      {formatTabularNumber(heroQuote.estimatedReceived, 0)}
                    </motion.span>
                    <span className="font-mono text-sm sm:text-base font-semibold text-[#7FAEA3]">
                      XOF
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-[#C9D1D0]/65">
                    {language === 'ar'
                      ? `${CORRIDOR_NODES.XOF.countryAr} (${CORRIDOR_NODES.XOF.cityAr})`
                      : `${CORRIDOR_NODES.XOF.countryFr} (${CORRIDOR_NODES.XOF.cityFr})`}
                  </p>
                </div>
              </div>

              {/* Subtle Rate & Fee Calibration Strip */}
              <div
                dir="ltr"
                className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#C9D1D0]/80 border-b border-[#C9D1D0]/15"
              >
                <div className="flex items-center gap-4">
                  <span>
                    1 MRU ={' '}
                    <strong className="text-[#FAF8F2]">
                      {settings.exchangeRateMruToXof.toFixed(2)} XOF
                    </strong>
                  </span>
                  <span className="text-[#C9D1D0]/30">|</span>
                  <span>
                    Fee:{' '}
                    <strong className="text-[#FAF8F2]">
                      {settings.fixedFeeMru} MRU
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#7FAEA3] tracking-wider uppercase">
                  NET CONVERTED: {formatTabularNumber(heroQuote.netConvertibleAmount, 0)} MRU
                </span>
              </div>

              {/* THE 5 CORRIDOR STAGES: MRU ●────●────●────●────● XOF */}
              <div className="pt-7 pb-3" dir="ltr">
                {/* Calibrated SVG + DOM Route Track */}
                <div className="relative">
                  {/* Fine SVG Ruler Ticks */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 800 24"
                    className="w-full h-5 overflow-visible mb-1 opacity-40"
                    preserveAspectRatio="none"
                  >
                    {Array.from({ length: 41 }).map((_, idx) => {
                      const x = idx * 20;
                      const isMajor = idx % 10 === 0;
                      return (
                        <line
                          key={idx}
                          x1={x}
                          y1={isMajor ? 2 : 8}
                          x2={x}
                          y2={16}
                          stroke={isMajor ? '#FAF8F2' : '#C9D1D0'}
                          strokeWidth={isMajor ? '1.5' : '1'}
                        />
                      );
                    })}
                  </svg>

                  {/* Main Horizontal Corridor Rail */}
                  <div className="relative h-[2px] w-full bg-[#C9D1D0]/25">
                    {/* Active Illuminated Route Segment */}
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-[#7FAEA3]"
                      animate={{ width: `${progressPercent}%` }}
                      transition={DESIGN_TOKENS.motion.standard}
                    />

                    {/* Travelling Signal Pulse Along the Corridor */}
                    {!prefersReducedMotion && (
                      <motion.div
                        aria-hidden="true"
                        className="absolute -top-[3px] h-2 w-12 bg-gradient-to-r from-transparent via-[#DE655A] to-[#7FAEA3]"
                        animate={{ left: ['0%', '92%'] }}
                        transition={{
                          duration: 3.6,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                  </div>

                  {/* 5 Calibrated Waypoint Nodes */}
                  <div className="grid grid-cols-5 gap-1 -mt-2.5 relative z-10">
                    {stages.map((stage, idx) => {
                      const isActive = idx === activeStageIndex;
                      const isPassed = idx < activeStageIndex;

                      return (
                        <button
                          key={stage.code}
                          type="button"
                          onClick={() => {
                            setActiveStageIndex(idx);
                            setUserPausedAuto(true);
                          }}
                          className={`group flex flex-col ${
                            idx === 0
                              ? 'items-start text-left'
                              : idx === 4
                              ? 'items-end text-right'
                              : 'items-center text-center'
                          } cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7FAEA3] pt-0.5`}
                        >
                          {/* Geometric Node Marker */}
                          <span
                            className={`w-4 h-4 flex items-center justify-center border transition-all duration-200 ${
                              isActive
                                ? 'bg-[#DE655A] border-[#FAF8F2] scale-110 ring-4 ring-[#DE655A]/25'
                                : isPassed
                                ? 'bg-[#7FAEA3] border-[#7FAEA3]'
                                : 'bg-[#10161F] border-[#C9D1D0]/45 group-hover:border-[#FAF8F2]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 ${
                                isActive
                                  ? 'bg-[#FAF8F2]'
                                  : isPassed
                                  ? 'bg-[#10161F]'
                                  : 'bg-transparent'
                              }`}
                            />
                          </span>

                          {/* Stage Number & Code */}
                          <span
                            className={`mt-2.5 font-mono text-[10px] sm:text-[11px] tracking-wider transition-colors ${
                              isActive
                                ? 'text-[#FAF8F2] font-bold'
                                : isPassed
                                ? 'text-[#7FAEA3] font-semibold'
                                : 'text-[#C9D1D0]/55 group-hover:text-[#C9D1D0]'
                            }`}
                          >
                            <span className="hidden sm:inline">{stage.number} </span>
                            {stage.code}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Stage Quiet Editorial Caption */}
              <div className="mt-4 pt-4 border-t border-[#C9D1D0]/15 flex flex-wrap items-baseline justify-between gap-3 min-h-[52px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage.code}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={DESIGN_TOKENS.motion.fast}
                    className="flex flex-wrap items-baseline gap-2.5"
                  >
                    <span className="font-mono text-xs font-bold text-[#DE655A]">
                      {activeStage.number} — {activeStage.code}
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-[#FAF8F2]">
                      «{activeStage.quote}»
                    </span>
                    <span className="text-xs text-[#C9D1D0]/75">
                      {activeStage.detail}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Seamless First-Scroll Transition Spine Connecting Hero to Live Quote Section */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-2">
        <div className="flex items-center justify-between border-t border-[#C9D1D0]/15 pt-4">
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#C9D1D0]/65">
            <span className="w-1.5 h-1.5 bg-[#7FAEA3]" aria-hidden="true" />
            <span dir="ltr">NKC (MRU) ──────► ABJ (XOF)</span>
          </div>

          <button
            type="button"
            onClick={handleStartTransfer}
            className="group inline-flex items-center gap-2.5 text-xs font-mono text-[#C9D1D0]/80 hover:text-[#FAF8F2] transition-colors cursor-pointer"
          >
            <span>{dict.hero.continueTransferCta}</span>
            <span className="w-5 h-5 border border-[#C9D1D0]/30 group-hover:border-[#DE655A] flex items-center justify-center">
              <ArrowDown className="w-3 h-3 text-[#DE655A]" />
            </span>
          </button>
        </div>
      </div>

      {/* Continuous Vertical Corridor Line Extending Downward into Section 2 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] h-6 bg-gradient-to-b from-[#7FAEA3] to-[#DE655A]"
      />
    </section>
  );
}
