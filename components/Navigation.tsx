'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Compass,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCorridor } from '@/context/corridor-context';
import { BrandMark, LanguageSwitcher } from '@/components/ui/corridor-primitives';

export function Navigation() {
  const {
    dict,
    activeView,
    setActiveView,
    transfers,
    storageError,
    dismissStorageError,
    resetAllDemoData,
  } = useCorridor();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (typeof window === 'undefined') return;
      setIsScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pendingCount = transfers.filter((t) => t.status === 'pending').length;
  const isHeroOverlay = activeView === 'corridor';

  return (
    <>
      {/* Clean Consumer Financial Navigation Bar */}
      <header
        className={`${
          isHeroOverlay ? 'fixed top-0 inset-x-0' : 'sticky top-0'
        } z-40 w-full transition-colors duration-200 ${
          isHeroOverlay && !isScrolled
            ? 'bg-[#10161F]/60 backdrop-blur-md border-b border-[#FAF8F2]/10'
            : 'bg-[#10161F]/95 backdrop-blur-md border-b border-[#14263D]'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Mark */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveView('corridor')}
              className="text-start focus-visible:outline-2 focus-visible:outline-[#7FAEA3] cursor-pointer shrink-0"
            >
              <BrandMark inverted />
            </button>
          </div>

          {/* Zone 2: Clean Typographic Navigation Links (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium shrink-0"
          >
            <button
              type="button"
              onClick={() => setActiveView('corridor')}
              className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7FAEA3] ${
                activeView === 'corridor'
                  ? 'text-[#FAF8F2] font-semibold'
                  : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
              }`}
            >
              <span>{dict.nav.transfer}</span>
              {activeView === 'corridor' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#DE655A]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('track')}
              className={`relative py-5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7FAEA3] ${
                activeView === 'track'
                  ? 'text-[#FAF8F2] font-semibold'
                  : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
              }`}
            >
              <span>{dict.nav.track}</span>
              {activeView === 'track' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#DE655A]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`relative py-5 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7FAEA3] ${
                activeView === 'admin'
                  ? 'text-[#FAF8F2] font-semibold'
                  : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
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
                  className="absolute bottom-0 inset-x-0 h-[2px] bg-[#DE655A]"
                />
              )}
            </button>
          </nav>

          {/* Zone 3: Clean Language Switcher (No competing technical widgets) */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher inverted />
          </div>
        </div>

        {/* Storage Error / Receipt Persistence Alert Bar (Shown only when an error occurs) */}
        {storageError && (
          <div
            role="alert"
            className="w-full bg-[#DE655A] text-[#FAF8F2] px-4 sm:px-8 py-2 text-xs font-medium border-t border-[#10161F]/20"
          >
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{storageError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllDemoData}
                  className="px-2.5 py-1 bg-[#10161F] text-[#FAF8F2] font-mono text-[11px] cursor-pointer"
                >
                  {dict.admin.settings.resetDemoBtn}
                </button>
                <button
                  type="button"
                  onClick={dismissStorageError}
                  aria-label="Dismiss"
                  className="p-1 hover:bg-[#10161F]/20 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Thumb Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#10161F]/95 backdrop-blur-md border-t border-[#14263D]"
      >
        <div className="grid grid-cols-3 h-14">
          <button
            type="button"
            onClick={() => setActiveView('corridor')}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] transition-colors ${
              activeView === 'corridor'
                ? 'text-[#FAF8F2] bg-[#14263D]/60 font-semibold border-t-2 border-[#DE655A]'
                : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
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
                ? 'text-[#FAF8F2] bg-[#14263D]/60 font-semibold border-t-2 border-[#DE655A]'
                : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
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
                ? 'text-[#FAF8F2] bg-[#14263D]/60 font-semibold border-t-2 border-[#DE655A]'
                : 'text-[#C9D1D0]/70 hover:text-[#FAF8F2]'
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
