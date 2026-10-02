'use client';

import React from 'react';
import {
  ArrowLeftRight,
  Compass,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { useCorridor } from '@/context/corridor-context';
import { BrandMark, LanguageSwitcher } from '@/components/ui/corridor-primitives';

export function Navigation() {
  const {
    dict,
    activeView,
    setActiveView,
    transfers,
    settings,
  } = useCorridor();

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;

  return (
    <>
      {/* Top Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F2]/95 backdrop-blur-md border-b border-[#C9D1D0]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Title (Single element) */}
          <button
            type="button"
            onClick={() => setActiveView('corridor')}
            className="text-start focus-visible:outline-2 focus-visible:outline-[#14263D]"
          >
            <BrandMark />
          </button>

          {/* Zone 2: Clean Typographic Navigation Links (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveView('corridor')}
              className={`relative py-4 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'corridor'
                  ? 'text-[#10161F] font-semibold'
                  : 'text-[#14263D]/70 hover:text-[#10161F]'
              }`}
            >
              <span>{dict.nav.transfer}</span>
              {activeView === 'corridor' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#14263D]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('track')}
              className={`relative py-4 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'track'
                  ? 'text-[#10161F] font-semibold'
                  : 'text-[#14263D]/70 hover:text-[#10161F]'
              }`}
            >
              <span>{dict.nav.track}</span>
              {activeView === 'track' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#14263D]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`relative py-4 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 ${
                activeView === 'admin'
                  ? 'text-[#10161F] font-semibold'
                  : 'text-[#14263D]/70 hover:text-[#10161F]'
              }`}
            >
              <span>{dict.nav.admin}</span>
              {pendingCount > 0 && (
                <span className="font-mono text-xs tabular-nums text-[#DE655A] font-semibold">
                  ({pendingCount})
                </span>
              )}
              {activeView === 'admin' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#14263D]"
                />
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Language Switch + Discreet AI Simulation Indicator) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              title={settings.aiModeLabel}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#14263D] border border-[#C9D1D0] bg-[#F3F0E8]/70 hover:bg-[#F3F0E8] transition-colors whitespace-nowrap min-h-[32px]"
            >
              <Cpu
                className={`w-3.5 h-3.5 ${
                  settings.aiSimulationEnabled ? 'text-[#2C6B5F]' : 'text-[#DE655A]'
                }`}
                aria-hidden="true"
              />
              <span>{dict.demoBanner.aiSimTag}</span>
            </button>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Thumb Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F2]/95 backdrop-blur-md border-t border-[#C9D1D0]"
      >
        <div className="grid grid-cols-3 h-14">
          <button
            type="button"
            onClick={() => setActiveView('corridor')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors ${
              activeView === 'corridor'
                ? 'text-[#10161F] bg-[#F3F0E8]/80 font-semibold border-t-2 border-[#14263D]'
                : 'text-[#14263D]/70 hover:text-[#10161F]'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] whitespace-nowrap">{dict.nav.transfer}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('track')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors ${
              activeView === 'track'
                ? 'text-[#10161F] bg-[#F3F0E8]/80 font-semibold border-t-2 border-[#14263D]'
                : 'text-[#14263D]/70 hover:text-[#10161F]'
            }`}
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span className="text-[11px] whitespace-nowrap">{dict.nav.trackShort}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors ${
              activeView === 'admin'
                ? 'text-[#10161F] bg-[#F3F0E8]/80 font-semibold border-t-2 border-[#14263D]'
                : 'text-[#14263D]/70 hover:text-[#10161F]'
            }`}
          >
            <div className="relative inline-flex items-center">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              {pendingCount > 0 && (
                <span className="ms-1 font-mono text-[10px] tabular-nums text-[#DE655A] font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[11px] whitespace-nowrap">{dict.nav.admin}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
