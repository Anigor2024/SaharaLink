'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { AdminDashboard } from '@/components/AdminDashboard';
import { CorridorHero } from '@/components/CorridorHero';
import { Navigation } from '@/components/Navigation';
import { TrackingView } from '@/components/TrackingView';
import { TransferAssistant } from '@/components/TransferAssistant';
import { TransferFlow } from '@/components/TransferFlow';
import { BrandMark, DemoBanner } from '@/components/ui/corridor-primitives';

export function SaharaLinkApp() {
  const {
    activeView,
    setActiveView,
    dict,
    dir,
    draftTransfer,
    trackedId,
    settings,
  } = useCorridor();

  return (
    <div
      dir={dir}
      className="min-h-screen flex flex-col bg-[#FAF8F2] text-[#10161F] pb-16 md:pb-0 selection:bg-[#14263D] selection:text-[#FAF8F2]"
    >
      {/* Discreet Global Prototype Disclosure */}
      <DemoBanner />

      {/* Sticky Global Navigation */}
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
              {/* Cinematic Transfer Corridor Hero */}
              <CorridorHero />

              {/* Core Interactive Corridor Workspace: Chat Assistant + Live Quote & 4-Step Studio */}
              <section
                id="corridor-workspace"
                className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Customer Transfer Assistant (5 Cols on Desktop) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <TransferAssistant />
                  </div>

                  {/* Live Quote Instrument & 4-Step Transfer Flow (7 Cols on Desktop) */}
                  <div className="lg:col-span-7 flex flex-col">
                    <TransferFlow key={draftTransfer.version} />
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
      <footer className="bg-[#F3F0E8] border-t border-[#C9D1D0] mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <BrandMark compact />
            <p className="text-xs text-[#14263D]/75">{dict.demoBanner.notice}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#14263D]">
            <button
              type="button"
              onClick={() => setActiveView('corridor')}
              className="hover:text-[#10161F] transition-colors cursor-pointer"
            >
              {dict.nav.transfer}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('track')}
              className="hover:text-[#10161F] transition-colors cursor-pointer"
            >
              {dict.nav.track}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="hover:text-[#10161F] transition-colors cursor-pointer"
            >
              {dict.nav.admin}
            </button>
            <span className="text-[#14263D]/50 font-mono">MRU ↔ XOF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
