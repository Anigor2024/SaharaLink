'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Cpu,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  DecisionBar,
  ReceiptPreview,
  StatusBadge,
  TransferRoute,
  TransferTimeline,
} from '@/components/ui/corridor-primitives';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { ensureEnglishNumerals } from '@/lib/quote-engine';
import { TransferStatus } from '@/types/corridor';

type FilterStatus = 'all' | TransferStatus;
type AdminTab = 'requests' | 'settings';

export function AdminDashboard() {
  const {
    dict,
    language,
    dir,
    transfers,
    settings,
    adminInspectId,
    setAdminInspectId,
    updateTransferDecision,
    updateCorridorSettings,
    openTrackingForId,
    resetAllDemoData,
  } = useCorridor();

  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const selectedTransferId = adminInspectId;
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  // Settings form state
  const [rateInput, setRateInput] = useState(() => String(settings.exchangeRateMruToXof));
  const [feeInput, setFeeInput] = useState(() => String(settings.fixedFeeMru));
  const [minInput, setMinInput] = useState(() => String(settings.minTransferMru));
  const [maxInput, setMaxInput] = useState(() => String(settings.maxTransferMru));
  const [acceptingToggle, setAcceptingToggle] = useState(
    () => settings.acceptingNewRequests
  );
  const [aiSimToggle, setAiSimToggle] = useState(() => settings.aiSimulationEnabled);
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

  const ArrowDirectional = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // KPI counts
  const kpis = useMemo(() => {
    const total = transfers.length;
    const pending = transfers.filter((t) => t.status === 'pending').length;
    const accepted = transfers.filter((t) => t.status === 'accepted').length;
    const rejected = transfers.filter((t) => t.status === 'rejected').length;
    return { total, pending, accepted, rejected };
  }, [transfers]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transfers.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.senderName.toLowerCase().includes(q) ||
        item.recipientName.toLowerCase().includes(q) ||
        item.senderPhone.toLowerCase().includes(q) ||
        item.recipientPhone.toLowerCase().includes(q)
      );
    });
  }, [transfers, searchQuery, statusFilter]);

  const selectedTransfer = useMemo(() => {
    if (!selectedTransferId) return null;
    return (
      transfers.find(
        (t) => t.id.toUpperCase() === selectedTransferId.toUpperCase()
      ) || null
    );
  }, [transfers, selectedTransferId]);

  const handleOpenInspector = (id: string) => {
    setAdminInspectId(id);
    setDecisionFeedback(null);
  };

  const handleCloseInspector = () => {
    setAdminInspectId(null);
    setDecisionFeedback(null);
  };

  const handleAcceptRequest = async (id: string) => {
    await updateTransferDecision(id, 'accepted');
    setDecisionFeedback(
      language === 'ar'
        ? 'تم قبول الطلب وتحديث حالة التتبع فوراً.'
        : 'Demande acceptée. Suivi client mis à jour.'
    );
  };

  const handleRejectRequest = async (id: string, reason: string) => {
    await updateTransferDecision(
      id,
      'rejected',
      reason.trim() ||
        (language === 'ar'
          ? 'تم رفض الطلب بعد مراجعة بيانات الوصل.'
          : 'Demande rejetée après vérification du reçu.')
    );
    setDecisionFeedback(
      language === 'ar'
        ? 'تم رفض الطلب وتحديث شاشة تتبع العميل.'
        : 'Demande rejetée. Suivi client mis à jour.'
    );
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = Math.max(0.01, Number(rateInput) || 15.4);
    const parsedFee = Math.max(0, Number(feeInput) || 25);
    const parsedMin = Math.max(1, Number(minInput) || 500);
    const parsedMax = Math.max(parsedMin, Number(maxInput) || 250000);

    await updateCorridorSettings({
      exchangeRateMruToXof: parsedRate,
      fixedFeeMru: parsedFee,
      minTransferMru: parsedMin,
      maxTransferMru: parsedMax,
      acceptingNewRequests: acceptingToggle,
      aiSimulationEnabled: aiSimToggle,
    });

    setSettingsToast(dict.admin.settings.savedToast);
    setTimeout(() => setSettingsToast(null), 3200);
  };

  const handleResetDemo = async () => {
    await resetAllDemoData();
    setSettingsToast(dict.admin.settings.resetSuccessToast);
    setTimeout(() => setSettingsToast(null), 3200);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const formatted = new Intl.DateTimeFormat(language === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }).format(new Date(iso));
      return ensureEnglishNumerals(formatted);
    } catch {
      return iso;
    }
  };

  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
      {/* 1. OPERATIONS HEADER & ARCHITECTURAL KPI STRIP */}
      <div className="bg-[#10161F] text-[#FAF8F2] border border-[#14263D]">
        {/* Top Bar */}
        <div className="p-5 sm:p-6 border-b border-[#C9D1D0]/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3] tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#DE655A]" />
              <span>{dict.admin.sectionLabel}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#FAF8F2] mt-1 tracking-tight">
              {dict.admin.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#C9D1D0] mt-1">
              {dict.admin.subtitle}
            </p>
          </div>

          {/* Segmented Console Mode Tabs */}
          <div className="inline-flex bg-[#14263D] p-1 border border-[#C9D1D0]/20 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[42px] whitespace-nowrap cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#FAF8F2] text-[#10161F]'
                  : 'text-[#C9D1D0] hover:text-[#FAF8F2]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{dict.admin.tabs.requests}</span>
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                ({kpis.pending})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[42px] whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#FAF8F2] text-[#10161F]'
                  : 'text-[#C9D1D0] hover:text-[#FAF8F2]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{dict.admin.tabs.settings}</span>
            </button>
          </div>
        </div>

        {/* 2. ARCHITECTURAL KPI STRIP (Dividers & layout hierarchy, not floating cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x rtl:divide-x-reverse divide-[#C9D1D0]/15">
          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setStatusFilter('all');
            }}
            className={`p-4 sm:p-5 text-start transition-colors cursor-pointer ${
              statusFilter === 'all' && activeTab === 'requests'
                ? 'bg-[#14263D]'
                : 'hover:bg-[#14263D]/50'
            }`}
          >
            <span className="text-[11px] font-mono text-[#C9D1D0] uppercase block">
              01 · {dict.admin.kpi.total}
            </span>
            <span className="text-2xl sm:text-4xl font-mono font-bold tabular-nums text-[#FAF8F2] mt-1 block">
              {kpis.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setStatusFilter('pending');
            }}
            className={`p-4 sm:p-5 text-start transition-colors cursor-pointer ${
              statusFilter === 'pending' && activeTab === 'requests'
                ? 'bg-[#14263D]'
                : 'hover:bg-[#14263D]/50'
            }`}
          >
            <span className="text-[11px] font-mono text-[#DE655A] font-semibold uppercase block">
              02 · {dict.admin.kpi.pending}
            </span>
            <span className="text-2xl sm:text-4xl font-mono font-bold tabular-nums text-[#DE655A] mt-1 block">
              {kpis.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setStatusFilter('accepted');
            }}
            className={`p-4 sm:p-5 text-start transition-colors cursor-pointer ${
              statusFilter === 'accepted' && activeTab === 'requests'
                ? 'bg-[#14263D]'
                : 'hover:bg-[#14263D]/50'
            }`}
          >
            <span className="text-[11px] font-mono text-[#7FAEA3] font-semibold uppercase block">
              03 · {dict.admin.kpi.accepted}
            </span>
            <span className="text-2xl sm:text-4xl font-mono font-bold tabular-nums text-[#7FAEA3] mt-1 block">
              {kpis.accepted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              setStatusFilter('rejected');
            }}
            className={`p-4 sm:p-5 text-start transition-colors cursor-pointer ${
              statusFilter === 'rejected' && activeTab === 'requests'
                ? 'bg-[#14263D]'
                : 'hover:bg-[#14263D]/50'
            }`}
          >
            <span className="text-[11px] font-mono text-[#C9D1D0] uppercase block">
              04 · {dict.admin.kpi.rejected}
            </span>
            <span className="text-2xl sm:text-4xl font-mono font-bold tabular-nums text-[#FAF8F2]/80 mt-1 block">
              {kpis.rejected}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTEGRATED REQUEST QUEUE */}
      {activeTab === 'requests' && (
        <div className="bg-[#FAF8F2] border border-[#14263D]">
          {/* Integrated Queue Search & Filter Bar */}
          <div className="p-4 bg-[#F3F0E8] border-b border-[#14263D]/25 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#14263D]/55 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="admin-search-input" className="sr-only">
                {dict.admin.searchPlaceholder}
              </label>
              <input
                id="admin-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.admin.searchPlaceholder}
                className="w-full bg-[#FAF8F2] border border-[#14263D]/30 ps-10 pe-4 py-2.5 text-sm text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#FAF8F2] p-1 border border-[#14263D]/25 overflow-x-auto">
              {(
                [
                  ['all', dict.admin.filters.all, kpis.total],
                  ['pending', dict.admin.filters.pending, kpis.pending],
                  ['accepted', dict.admin.filters.accepted, kpis.accepted],
                  ['rejected', dict.admin.filters.rejected, kpis.rejected],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === key
                      ? 'bg-[#14263D] text-[#FAF8F2]'
                      : 'text-[#14263D] hover:text-[#10161F]'
                  }`}
                >
                  <span>{label}</span>
                  <span className="font-mono text-[10px] tabular-nums opacity-75">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Empty Queue State */}
          {filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#14263D]/75">
              {dict.admin.table.emptyState}
            </div>
          ) : (
            <>
              {/* SECTION R: DESKTOP 9-COLUMN HIGH-DENSITY OPERATIONS QUEUE */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F2] border-b border-[#14263D]/20 text-[11px] font-mono text-[#14263D]/80 uppercase">
                      <th className="py-3 px-4 text-start font-bold">
                        {dict.admin.table.id}
                      </th>
                      <th className="py-3 px-3 text-start font-bold">
                        {dict.admin.table.route}
                      </th>
                      <th className="py-3 px-3 text-start font-bold">
                        {dict.admin.table.sender}
                      </th>
                      <th className="py-3 px-3 text-start font-bold">
                        {dict.admin.table.recipient}
                      </th>
                      <th className="py-3 px-3 text-end font-bold">
                        {dict.admin.table.amountSent}
                      </th>
                      <th className="py-3 px-3 text-end font-bold">
                        {dict.admin.table.amountReceived}
                      </th>
                      <th className="py-3 px-3 text-start font-bold">
                        {dict.admin.table.method}
                      </th>
                      <th className="py-3 px-3 text-start font-bold">
                        {dict.admin.table.created}
                      </th>
                      <th className="py-3 px-4 text-end font-bold">
                        {dict.admin.table.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9D1D0]/70 text-xs">
                    {filteredTransfers.map((item) => {
                      const isPending = item.status === 'pending';
                      const isSelected = selectedTransferId === item.id;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenInspector(item.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#14263D]/10'
                              : isPending
                              ? 'bg-[#F3F0E8]/45 hover:bg-[#F3F0E8]'
                              : 'hover:bg-[#F3F0E8]/70'
                          }`}
                        >
                          <td
                            className={`py-3.5 px-4 font-mono font-bold text-[#10161F] whitespace-nowrap ${
                              isPending ? 'border-s-4 border-[#DE655A]' : ''
                            }`}
                          >
                            <span dir="ltr">{item.id}</span>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <TransferRoute direction={item.direction} compact />
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-[#10161F] truncate max-w-[160px]">
                              {item.senderName}
                            </div>
                            <div
                              dir="ltr"
                              className="text-[11px] font-mono text-[#14263D]/65"
                            >
                              {item.senderPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-[#10161F] truncate max-w-[160px]">
                              {item.recipientName}
                            </div>
                            <div
                              dir="ltr"
                              className="text-[11px] font-mono text-[#14263D]/65"
                            >
                              {item.recipientPhone}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-end whitespace-nowrap">
                            <AmountDisplay
                              amount={item.amountSent}
                              currency={item.originCurrency}
                              size="sm"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-end whitespace-nowrap">
                            <AmountDisplay
                              amount={item.estimatedReceived}
                              currency={item.destinationCurrency}
                              size="sm"
                              highlight
                            />
                          </td>
                          <td className="py-3.5 px-3 font-mono font-semibold text-[#14263D] whitespace-nowrap">
                            {item.receivingMethod}
                          </td>
                          <td className="py-3.5 px-3 font-mono tabular-nums text-[#14263D]/75 whitespace-nowrap">
                            {formatTimestamp(item.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-end whitespace-nowrap">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SECTION Q: MOBILE & TABLET QUEUE (375px / 390px / 430px Optimized) */}
              <div className="lg:hidden divide-y divide-[#C9D1D0]">
                {filteredTransfers.map((item) => {
                  const isPending = item.status === 'pending';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenInspector(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          handleOpenInspector(item.id);
                      }}
                      className={`p-4 space-y-2.5 transition-colors cursor-pointer ${
                        isPending
                          ? 'bg-[#F3F0E8]/50 border-s-4 border-[#DE655A]'
                          : 'bg-[#FAF8F2] hover:bg-[#F3F0E8]/60'
                      }`}
                    >
                      {/* Row Top: Transfer ID + Direction + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            dir="ltr"
                            className="font-mono text-sm font-bold text-[#10161F] tabular-nums"
                          >
                            {item.id}
                          </span>
                          <TransferRoute direction={item.direction} compact />
                        </div>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      {/* Row Middle: Amount Journey */}
                      <div className="flex items-baseline justify-between gap-2 pt-1">
                        <div className="flex items-baseline gap-2">
                          <AmountDisplay
                            amount={item.amountSent}
                            currency={item.originCurrency}
                            size="md"
                          />
                          <ArrowDirectional className="w-3.5 h-3.5 text-[#14263D]/50" />
                          <AmountDisplay
                            amount={item.estimatedReceived}
                            currency={item.destinationCurrency}
                            size="md"
                            highlight
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-[#14263D]">
                          {item.receivingMethod}
                        </span>
                      </div>

                      {/* Row Bottom: Parties & Timestamp */}
                      <div className="flex items-center justify-between gap-2 text-xs text-[#14263D]/75 pt-1 border-t border-[#C9D1D0]/50">
                        <span className="truncate font-medium text-[#10161F]">
                          {item.senderName} → {item.recipientName}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums shrink-0">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: SECTION T — ADMIN SETTINGS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-8 bg-[#FAF8F2] border border-[#14263D] p-5 sm:p-8 space-y-6"
          >
            <div className="pb-4 border-b border-[#C9D1D0]">
              <h2 className="text-xl font-semibold text-[#10161F]">
                {dict.admin.settings.title}
              </h2>
              <p className="text-xs text-[#14263D]/80 mt-1 leading-relaxed">
                {dict.admin.settings.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 bg-[#F3F0E8] border border-[#14263D]/25 p-4">
                <label
                  htmlFor="setting-rate"
                  className="block text-xs font-mono font-bold text-[#10161F] uppercase mb-1"
                >
                  {dict.admin.settings.rateLabel}
                </label>
                <p className="text-xs text-[#14263D]/75 mb-2.5">
                  {dict.admin.settings.rateHelper}
                </p>
                <div className="flex items-center gap-3">
                  <span dir="ltr" className="font-mono text-sm font-bold text-[#14263D]">
                    1 MRU =
                  </span>
                  <input
                    id="setting-rate"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="flex-1 bg-[#FAF8F2] border-2 border-[#14263D] px-3.5 py-2.5 text-xl font-mono font-bold tabular-nums text-[#10161F] focus:outline-none focus:border-[#DE655A] min-h-[46px]"
                  />
                  <span dir="ltr" className="font-mono text-sm font-bold text-[#14263D]">
                    XOF
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="setting-fee"
                  className="block text-xs font-semibold text-[#10161F] mb-1.5"
                >
                  {dict.admin.settings.feeLabel}
                </label>
                <input
                  id="setting-fee"
                  type="number"
                  step="1"
                  min="0"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  className="w-full bg-[#F3F0E8] border border-[#14263D]/40 px-3.5 py-2.5 text-base font-mono font-semibold tabular-nums text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="setting-min"
                  className="block text-xs font-semibold text-[#10161F] mb-1.5"
                >
                  {dict.admin.settings.minLabel}
                </label>
                <input
                  id="setting-min"
                  type="number"
                  step="10"
                  min="1"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  className="w-full bg-[#F3F0E8] border border-[#14263D]/40 px-3.5 py-2.5 text-base font-mono font-semibold tabular-nums text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="setting-max"
                  className="block text-xs font-semibold text-[#10161F] mb-1.5"
                >
                  {dict.admin.settings.maxLabel}
                </label>
                <input
                  id="setting-max"
                  type="number"
                  step="100"
                  min="100"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  className="w-full bg-[#F3F0E8] border border-[#14263D]/40 px-3.5 py-2.5 text-base font-mono font-semibold tabular-nums text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                />
              </div>
            </div>

            {/* Operational Toggles */}
            <div className="space-y-3 pt-4 border-t border-[#C9D1D0]">
              <div className="flex items-center justify-between gap-4 p-4 bg-[#F3F0E8] border border-[#C9D1D0]">
                <div>
                  <span className="text-sm font-semibold text-[#10161F] block">
                    {dict.admin.settings.acceptingLabel}
                  </span>
                  <span className="text-xs text-[#14263D]/75 mt-0.5 block">
                    {acceptingToggle
                      ? dict.admin.settings.acceptingOn
                      : dict.admin.settings.acceptingOff}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={acceptingToggle}
                  onClick={() => setAcceptingToggle((prev) => !prev)}
                  className={`px-4 py-2 font-mono text-xs font-bold border transition-colors min-h-[40px] min-w-[78px] cursor-pointer ${
                    acceptingToggle
                      ? 'bg-[#7FAEA3] text-[#10161F] border-[#14263D]'
                      : 'bg-[#DE655A] text-[#FAF8F2] border-[#10161F]'
                  }`}
                >
                  {acceptingToggle ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 bg-[#F3F0E8] border border-[#C9D1D0]">
                <div>
                  <span className="text-sm font-semibold text-[#10161F] block">
                    {dict.admin.settings.aiSimLabel}
                  </span>
                  <span
                    dir="ltr"
                    className="text-xs font-mono text-[#14263D]/80 mt-0.5 block"
                  >
                    {settings.aiModeLabel}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={aiSimToggle}
                  onClick={() => setAiSimToggle((prev) => !prev)}
                  className={`px-4 py-2 font-mono text-xs font-bold border transition-colors min-h-[40px] min-w-[78px] cursor-pointer ${
                    aiSimToggle
                      ? 'bg-[#7FAEA3] text-[#10161F] border-[#14263D]'
                      : 'bg-[#C9D1D0] text-[#10161F] border-[#14263D]'
                  }`}
                >
                  {aiSimToggle ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {settingsToast && (
              <div
                role="status"
                className="p-3.5 bg-[#7FAEA3]/20 border border-[#7FAEA3] text-xs font-semibold text-[#10161F] flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#1F5C50] shrink-0" />
                <span>{settingsToast}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[48px] cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#7FAEA3]" />
                <span>{dict.admin.settings.saveBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-3.5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors min-h-[48px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#DE655A]" />
                <span>{dict.admin.settings.resetDemoBtn}</span>
              </button>
            </div>
          </form>

          {/* Technical Architecture Status Panel */}
          <div className="lg:col-span-4 bg-[#10161F] text-[#FAF8F2] border border-[#14263D] p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7FAEA3]">
              <Cpu className="w-4 h-4" />
              <span>ARCHITECTURE TELEMETRY</span>
            </div>

            <div className="space-y-3 border-y border-[#C9D1D0]/15 py-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#C9D1D0]">AI ADAPTER</span>
                <span className="font-bold text-[#7FAEA3]">
                  {dict.admin.settings.aiTechStatus1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#C9D1D0]">BILLING / API</span>
                <span className="font-bold text-[#FAF8F2]">
                  {dict.admin.settings.aiTechStatus2}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#C9D1D0]">RECEIPT STORAGE</span>
                <span className="font-bold text-[#7FAEA3]">INDEXEDDB + FALLBACK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#C9D1D0]">TAB SYNC</span>
                <span className="font-bold text-[#FAF8F2]">BROADCASTCHANNEL</span>
              </div>
            </div>

            <p className="text-xs text-[#C9D1D0]/80 leading-relaxed">
              {dict.demoBanner.notice}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION S & Q: PREMIUM OPERATIONAL INSPECTOR (SLIDE-OVER / MOBILE SHEET)
          ====================================================================== */}
      <AnimatePresence>
        {selectedTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={DESIGN_TOKENS.motion.fast}
            className="fixed inset-0 z-50 bg-[#10161F]/75 backdrop-blur-xs flex justify-end"
            onClick={handleCloseInspector}
          >
            <motion.div
              initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              transition={DESIGN_TOKENS.motion.spring}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#FAF8F2] h-full flex flex-col border-s border-[#14263D] shadow-2xl"
            >
              {/* 1. STICKY INSPECTOR HEADER: TRANSFER ID & STATUS */}
              <div className="bg-[#10161F] text-[#FAF8F2] px-5 py-4 flex items-center justify-between gap-4 border-b border-[#14263D] shrink-0">
                <div>
                  <span className="text-[10px] font-mono text-[#7FAEA3] tracking-wider block uppercase">
                    {dict.admin.drawer.title}
                  </span>
                  <span
                    dir="ltr"
                    className="text-xl sm:text-2xl font-mono font-bold tracking-wider block tabular-nums mt-0.5"
                  >
                    {selectedTransfer.id}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedTransfer.status} size="md" />
                  <button
                    type="button"
                    onClick={handleCloseInspector}
                    className="p-2 bg-[#14263D] text-[#FAF8F2] hover:bg-[#DE655A] transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center cursor-pointer"
                    aria-label={dict.admin.drawer.close}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Operational Surface */}
              <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Decision Feedback Banner */}
                {decisionFeedback && (
                  <div className="p-3.5 bg-[#7FAEA3]/25 border border-[#7FAEA3] text-xs font-semibold text-[#10161F] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1F5C50] shrink-0" />
                      <span>{decisionFeedback}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const idToTrack = selectedTransfer.id;
                        handleCloseInspector();
                        openTrackingForId(idToTrack);
                      }}
                      className="px-3 py-1.5 bg-[#14263D] text-[#FAF8F2] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#7FAEA3]" />
                      <span>{dict.admin.drawer.viewInTrackerBtn}</span>
                    </button>
                  </div>
                )}

                {/* 2. AMOUNT JOURNEY (2500 MRU -> 38,115 XOF) */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                    {dict.admin.drawer.amountJourneyBox}
                  </span>

                  <div className="bg-[#10161F] text-[#FAF8F2] p-5 border border-[#14263D] space-y-4">
                    <TransferRoute
                      direction={selectedTransfer.direction}
                      inverted
                      centerLabel={`1 MRU = ${selectedTransfer.exchangeRate.toFixed(2)} XOF`}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#C9D1D0]/15 items-end">
                      <div>
                        <span className="text-[10px] font-mono text-[#C9D1D0] uppercase block">
                          {dict.quote.youSendTag}
                        </span>
                        <div className="mt-1">
                          <AmountDisplay
                            amount={selectedTransfer.amountSent}
                            currency={selectedTransfer.originCurrency}
                            size="xl"
                            inverted
                          />
                        </div>
                      </div>

                      <div className="sm:text-end">
                        <span className="text-[10px] font-mono text-[#7FAEA3] font-bold uppercase block">
                          {dict.quote.recipientGetsTag}
                        </span>
                        <div className="mt-1">
                          <AmountDisplay
                            amount={selectedTransfer.estimatedReceived}
                            currency={selectedTransfer.destinationCurrency}
                            size="2xl"
                            inverted
                            highlight
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#C9D1D0]/15 text-xs font-mono text-[#C9D1D0]/80">
                      <span>
                        {dict.quote.feeLabel}: {selectedTransfer.fee}{' '}
                        {selectedTransfer.originCurrency}
                      </span>
                      <span>{formatTimestamp(selectedTransfer.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* 3 & 4. PEOPLE & PAYMENT METHOD */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                    {dict.admin.drawer.peopleBox}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#14263D]/25 bg-[#F3F0E8] divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-[#C9D1D0]">
                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-mono text-[#14263D]/70 uppercase block">
                        {dict.admin.drawer.senderBox}
                      </span>
                      <p className="text-sm font-semibold text-[#10161F]">
                        {selectedTransfer.senderName}
                      </p>
                      <p dir="ltr" className="text-xs font-mono text-[#14263D]">
                        {selectedTransfer.senderPhone}
                      </p>
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-mono text-[#14263D]/70 uppercase block">
                        {dict.admin.drawer.recipientBox}
                      </span>
                      <p className="text-sm font-semibold text-[#10161F]">
                        {selectedTransfer.recipientName}
                      </p>
                      <p dir="ltr" className="text-xs font-mono text-[#14263D]">
                        {selectedTransfer.recipientPhone}
                      </p>
                    </div>

                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-mono text-[#14263D]/70 uppercase block">
                        {dict.admin.drawer.methodBox}
                      </span>
                      <p className="text-sm font-mono font-bold text-[#1F5C50]">
                        {selectedTransfer.receivingMethod}
                      </p>
                      <p className="text-[11px] font-mono text-[#14263D]/70">
                        {selectedTransfer.destinationCurrency} PAYOUT
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. RECEIPT ATTACHMENT */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                    {dict.admin.drawer.receiptBox}
                  </span>
                  <ReceiptPreview
                    dataUrl={selectedTransfer.receiptDataUrl}
                    fileName={selectedTransfer.receiptFileName}
                    fileSize={selectedTransfer.receiptFileSize}
                    mimeType={selectedTransfer.receiptMimeType}
                    persistenceStatus={selectedTransfer.receiptPersistenceStatus}
                    isSeededDemo={selectedTransfer.isSeededDemo}
                    sha256={selectedTransfer.receiptSha256}
                    readonly
                  />
                </div>

                {/* 6. TIMELINE */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold text-[#14263D] uppercase tracking-wider block">
                    {dict.tracking.timelineHeader}
                  </span>
                  <div className="bg-[#F3F0E8]/60 border border-[#C9D1D0] p-4">
                    <TransferTimeline
                      status={selectedTransfer.status}
                      timeline={selectedTransfer.timeline}
                      rejectionReason={selectedTransfer.rejectionReason}
                    />
                  </div>
                </div>

                {/* Open in Customer Tracker Link */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const idToTrack = selectedTransfer.id;
                      handleCloseInspector();
                      openTrackingForId(idToTrack);
                    }}
                    className="w-full py-3 px-4 bg-[#FAF8F2] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#14263D] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#DE655A]" />
                    <span>{dict.admin.drawer.viewInTrackerBtn}</span>
                  </button>
                </div>
              </div>

              {/* 7. STICKY ERGONOMIC DECISION BAR NEAR THUMB AREA */}
              <div className="shrink-0 sticky bottom-0 z-20">
                <DecisionBar
                  status={selectedTransfer.status}
                  onAccept={() => handleAcceptRequest(selectedTransfer.id)}
                  onReject={(reason) => handleRejectRequest(selectedTransfer.id, reason)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
