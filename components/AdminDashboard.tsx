'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Compass,
  Eye,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  ReceiptPreview,
  RouteIndicator,
  StatusBadge,
  TransferTimeline,
} from '@/components/ui/corridor-primitives';
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

  // Reject confirmation state inside Drawer
  const [isConfirmingReject, setIsConfirmingReject] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
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

  const handleOpenDrawer = (id: string) => {
    setAdminInspectId(id);
    setIsConfirmingReject(false);
    setRejectionNote('');
    setDecisionFeedback(null);
  };

  const handleCloseDrawer = () => {
    setAdminInspectId(null);
    setIsConfirmingReject(false);
    setRejectionNote('');
  };

  const handleAcceptRequest = async (id: string) => {
    await updateTransferDecision(id, 'accepted');
    setIsConfirmingReject(false);
    setDecisionFeedback(
      language === 'ar'
        ? 'تم قبول الطلب وتحديث حالة التتبع فوراً.'
        : 'Demande acceptée. Suivi client mis à jour.'
    );
  };

  const handleConfirmRejectRequest = async (id: string) => {
    await updateTransferDecision(
      id,
      'rejected',
      rejectionNote.trim() ||
        (language === 'ar'
          ? 'تم رفض الطلب بعد مراجعة بيانات الوصل.'
          : 'Demande rejetée après vérification du reçu.')
    );
    setIsConfirmingReject(false);
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
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-MR' : 'fr-FR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
      {/* Top Operations Header & Mode Switch */}
      <div className="bg-[#14263D] text-[#FAF8F2] p-5 sm:p-6 border border-[#10161F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3]">
            <ShieldCheck className="w-4 h-4" />
            <span>{dict.admin.sectionLabel}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#FAF8F2] mt-1">
            {dict.admin.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#C9D1D0] mt-1">
            {dict.admin.subtitle}
          </p>
        </div>

        {/* Segmented Admin View Tabs */}
        <div className="inline-flex bg-[#10161F] p-1 border border-[#C9D1D0]/25 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[40px] whitespace-nowrap cursor-pointer ${
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
            className={`px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 transition-colors min-h-[40px] whitespace-nowrap cursor-pointer ${
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

      {/* TAB 1: OPERATIONS QUEUE & KPI DASHBOARD */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* A. KPI Strip (Clickable to filter) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`p-4 text-start border transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                  : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
              }`}
            >
              <span
                className={`text-xs font-medium block ${
                  statusFilter === 'all' ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                }`}
              >
                {dict.admin.kpi.total}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums mt-1 block">
                {kpis.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`p-4 text-start border transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                  : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
              }`}
            >
              <span
                className={`text-xs font-medium block ${
                  statusFilter === 'pending' ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                }`}
              >
                {dict.admin.kpi.pending}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums mt-1 block text-[#DE655A]">
                {kpis.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('accepted')}
              className={`p-4 text-start border transition-colors cursor-pointer ${
                statusFilter === 'accepted'
                  ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                  : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
              }`}
            >
              <span
                className={`text-xs font-medium block ${
                  statusFilter === 'accepted' ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                }`}
              >
                {dict.admin.kpi.accepted}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums mt-1 block text-[#2C6B5F]">
                {kpis.accepted}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`p-4 text-start border transition-colors cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                  : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
              }`}
            >
              <span
                className={`text-xs font-medium block ${
                  statusFilter === 'rejected' ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                }`}
              >
                {dict.admin.kpi.rejected}
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums mt-1 block">
                {kpis.rejected}
              </span>
            </button>
          </div>

          {/* C & D. Search & Status Filter Bar */}
          <div className="bg-[#FAF8F2] border border-[#C9D1D0] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#14263D]/50 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="admin-search-input" className="sr-only">
                {dict.admin.searchPlaceholder}
              </label>
              <input
                id="admin-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.admin.searchPlaceholder}
                className="w-full bg-[#F3F0E8] border border-[#C9D1D0] ps-10 pe-4 py-2.5 text-sm text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
              />
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex items-center gap-1 bg-[#F3F0E8] p-1 border border-[#C9D1D0] overflow-x-auto">
              {(
                [
                  ['all', dict.admin.filters.all],
                  ['pending', dict.admin.filters.pending],
                  ['accepted', dict.admin.filters.accepted],
                  ['rejected', dict.admin.filters.rejected],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] cursor-pointer ${
                    statusFilter === key
                      ? 'bg-[#14263D] text-[#FAF8F2]'
                      : 'text-[#14263D] hover:text-[#10161F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* B. Request List (Desktop Table + Mobile Cards) */}
          {filteredTransfers.length === 0 ? (
            <div className="bg-[#FAF8F2] border border-[#C9D1D0] p-10 text-center text-sm text-[#14263D]/75">
              {dict.admin.table.emptyState}
            </div>
          ) : (
            <>
              {/* Desktop High-Density Data Table */}
              <div className="hidden lg:block bg-[#FAF8F2] border border-[#C9D1D0] overflow-hidden">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-[#F3F0E8] border-b border-[#C9D1D0] text-xs font-mono text-[#14263D]">
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.id}
                      </th>
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.parties}
                      </th>
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.amounts}
                      </th>
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.method}
                      </th>
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.date}
                      </th>
                      <th className="py-3.5 px-4 text-start font-semibold">
                        {dict.admin.table.status}
                      </th>
                      <th className="py-3.5 px-4 text-end font-semibold">
                        {dict.admin.table.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C9D1D0]/70 text-sm">
                    {filteredTransfers.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDrawer(item.id)}
                        className="hover:bg-[#F3F0E8]/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#10161F] whitespace-nowrap">
                          <span dir="ltr">{item.id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#10161F]">
                            {item.senderName} → {item.recipientName}
                          </div>
                          <div className="text-xs font-mono text-[#14263D]/65 mt-0.5">
                            <span dir="ltr">{item.senderPhone}</span> ·{' '}
                            <span dir="ltr">{item.recipientPhone}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <AmountDisplay
                              amount={item.amountSent}
                              currency={item.originCurrency}
                              size="sm"
                            />
                            <span className="text-[#14263D]/40">→</span>
                            <AmountDisplay
                              amount={item.estimatedReceived}
                              currency={item.destinationCurrency}
                              size="sm"
                              highlight
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#14263D]">
                          {item.receivingMethod}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#14263D]/75 whitespace-nowrap">
                          {formatTimestamp(item.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(item.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#7FAEA3]" />
                            <span>{dict.admin.table.inspectBtn}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile & Tablet Touch-First Operations List */}
              <div className="lg:hidden space-y-3">
                {filteredTransfers.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDrawer(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleOpenDrawer(item.id);
                    }}
                    className="bg-[#FAF8F2] border border-[#C9D1D0] hover:border-[#14263D] p-4 space-y-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#C9D1D0]/60">
                      <span
                        dir="ltr"
                        className="font-mono text-sm font-bold text-[#10161F] tabular-nums"
                      >
                        {item.id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#14263D]/70 block">
                          {dict.quote.amountSentLabel}
                        </span>
                        <AmountDisplay
                          amount={item.amountSent}
                          currency={item.originCurrency}
                          size="md"
                        />
                      </div>
                      <div className="text-end">
                        <span className="text-[11px] text-[#2C6B5F] font-medium block">
                          {dict.quote.estimatedReceivedLabel}
                        </span>
                        <AmountDisplay
                          amount={item.estimatedReceived}
                          currency={item.destinationCurrency}
                          size="md"
                          highlight
                        />
                      </div>
                    </div>

                    <div className="text-xs text-[#10161F] pt-1 flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {item.senderName} → {item.recipientName}
                      </span>
                      <span className="font-mono font-semibold text-[#14263D] shrink-0">
                        {item.receivingMethod}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#C9D1D0]/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#14263D]/65 tabular-nums">
                        {formatTimestamp(item.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14263D]">
                        <Eye className="w-3.5 h-3.5 text-[#7FAEA3]" />
                        <span>{dict.admin.table.inspectBtn}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN SETTINGS PANEL */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-[#FAF8F2] border border-[#14263D]/25 p-5 sm:p-8 max-w-3xl space-y-6"
        >
          <div className="pb-4 border-b border-[#C9D1D0]">
            <h2 className="text-xl font-semibold text-[#10161F]">
              {dict.admin.settings.title}
            </h2>
            <p className="text-xs text-[#14263D]/75 mt-1">
              {dict.admin.settings.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="setting-rate"
                className="block text-xs font-semibold text-[#10161F] mb-1.5"
              >
                {dict.admin.settings.rateLabel}
              </label>
              <input
                id="setting-rate"
                type="number"
                step="0.01"
                min="0.01"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full bg-[#F3F0E8] border border-[#14263D]/40 px-3.5 py-2.5 text-base font-mono font-semibold tabular-nums text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
              />
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

            <div>
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
          <div className="space-y-4 pt-4 border-t border-[#C9D1D0]">
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
                className={`px-4 py-2 font-mono text-xs font-bold border transition-colors min-h-[40px] min-w-[76px] cursor-pointer ${
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
                className={`px-4 py-2 font-mono text-xs font-bold border transition-colors min-h-[40px] min-w-[76px] cursor-pointer ${
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
              className="p-3 bg-[#7FAEA3]/20 border border-[#7FAEA3] text-xs font-medium text-[#10161F] flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#2C6B5F] shrink-0" />
              <span>{settingsToast}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[48px] cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#7FAEA3]" />
              <span>{dict.admin.settings.saveBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              className="px-4 py-3 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#C9D1D0] text-xs font-medium inline-flex items-center gap-1.5 transition-colors min-h-[48px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#DE655A]" />
              <span>{dict.admin.settings.resetDemoBtn}</span>
            </button>
          </div>
        </form>
      )}

      {/* E & F. REQUEST DETAIL DRAWER / SHEET */}
      <AnimatePresence>
        {selectedTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#10161F]/70 backdrop-blur-xs flex justify-end"
            onClick={handleCloseDrawer}
          >
            <motion.div
              initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#FAF8F2] h-full overflow-y-auto flex flex-col border-s border-[#14263D]"
            >
              {/* Sticky Drawer Header */}
              <div className="sticky top-0 z-20 bg-[#14263D] text-[#FAF8F2] px-5 py-4 flex items-center justify-between gap-4 border-b border-[#10161F]">
                <div>
                  <span className="text-[11px] font-mono text-[#7FAEA3] block">
                    {dict.admin.drawer.title}
                  </span>
                  <span
                    dir="ltr"
                    className="text-lg font-mono font-bold tracking-wider block tabular-nums"
                  >
                    {selectedTransfer.id}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedTransfer.status} size="md" />
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="p-2 bg-[#10161F] text-[#FAF8F2] hover:bg-[#DE655A] transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center cursor-pointer"
                    aria-label={dict.admin.drawer.close}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-5 sm:p-6 space-y-6 flex-1">
                {/* Decision Feedback Banner */}
                {decisionFeedback && (
                  <div className="p-3.5 bg-[#7FAEA3]/20 border border-[#7FAEA3] text-xs font-semibold text-[#10161F] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2C6B5F] shrink-0" />
                      <span>{decisionFeedback}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const idToTrack = selectedTransfer.id;
                        handleCloseDrawer();
                        openTrackingForId(idToTrack);
                      }}
                      className="px-3 py-1.5 bg-[#14263D] text-[#FAF8F2] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#7FAEA3]" />
                      <span>{dict.admin.drawer.viewInTrackerBtn}</span>
                    </button>
                  </div>
                )}

                {/* F. LARGE CLEAR ACCEPT / REJECT OPERATIONS DECISION BOX */}
                <div className="bg-[#F3F0E8] border-2 border-[#14263D] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#10161F]">
                        {dict.admin.drawer.decisionBox}
                      </h3>
                      <p className="text-xs text-[#14263D]/75 mt-0.5">
                        {selectedTransfer.status === 'pending'
                          ? dict.admin.drawer.decisionHint
                          : dict.admin.drawer.alreadyDecidedNote}
                      </p>
                    </div>
                  </div>

                  {!isConfirmingReject ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(selectedTransfer.id)}
                        className="py-3.5 px-5 bg-[#7FAEA3] hover:bg-[#6b9e92] text-[#10161F] font-semibold text-sm inline-flex items-center justify-center gap-2 border border-[#14263D] transition-colors min-h-[48px] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{dict.admin.drawer.acceptBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsConfirmingReject(true)}
                        className="py-3.5 px-5 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] font-semibold text-sm inline-flex items-center justify-center gap-2 border border-[#10161F] transition-colors min-h-[48px] cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{dict.admin.drawer.rejectBtn}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#FAF8F2] border border-[#DE655A] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#8C2D25]">
                        <AlertTriangle className="w-4 h-4 text-[#DE655A]" />
                        <span>{dict.admin.drawer.confirmRejectTitle}</span>
                      </div>

                      <div>
                        <label
                          htmlFor="admin-reject-note"
                          className="block text-xs font-medium text-[#10161F] mb-1"
                        >
                          {dict.admin.drawer.rejectionNoteLabel}
                        </label>
                        <input
                          id="admin-reject-note"
                          type="text"
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                          placeholder={dict.admin.drawer.rejectionNotePlaceholder}
                          className="w-full bg-[#F3F0E8] border border-[#C9D1D0] px-3 py-2 text-xs text-[#10161F] focus:outline-none focus:border-[#DE655A] min-h-[40px]"
                        />

                        {/* Preset Rejection Notes */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {dict.admin.drawer.rejectionPresets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setRejectionNote(preset)}
                              className="text-[11px] px-2 py-1 bg-[#F3F0E8] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#C9D1D0] transition-colors cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmRejectRequest(selectedTransfer.id)}
                          className="flex-1 py-2.5 px-4 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-xs font-semibold min-h-[42px] cursor-pointer"
                        >
                          {dict.admin.drawer.confirmRejectSubmit}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingReject(false)}
                          className="px-4 py-2.5 bg-[#F3F0E8] text-[#10161F] border border-[#C9D1D0] text-xs font-medium min-h-[42px] cursor-pointer"
                        >
                          {dict.admin.drawer.cancelReject}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <RouteIndicator direction={selectedTransfer.direction} />

                {/* Sender & Recipient Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 space-y-1">
                    <span className="text-[11px] font-mono text-[#14263D]/70 uppercase">
                      {dict.admin.drawer.senderBox}
                    </span>
                    <p className="text-base font-semibold text-[#10161F]">
                      {selectedTransfer.senderName}
                    </p>
                    <p dir="ltr" className="text-xs font-mono text-[#14263D]">
                      {selectedTransfer.senderPhone}
                    </p>
                  </div>

                  <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 space-y-1">
                    <span className="text-[11px] font-mono text-[#14263D]/70 uppercase">
                      {dict.admin.drawer.recipientBox}
                    </span>
                    <p className="text-base font-semibold text-[#10161F]">
                      {selectedTransfer.recipientName}
                    </p>
                    <p dir="ltr" className="text-xs font-mono text-[#14263D]">
                      {selectedTransfer.recipientPhone}
                    </p>
                    <p className="text-xs font-mono font-bold text-[#2C6B5F] pt-1">
                      {selectedTransfer.receivingMethod}
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 space-y-3">
                  <h4 className="text-xs font-mono font-semibold text-[#14263D] uppercase pb-2 border-b border-[#C9D1D0]">
                    {dict.admin.drawer.financialBox}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-[#14263D]/70 block">
                        {dict.quote.amountSentLabel}
                      </span>
                      <AmountDisplay
                        amount={selectedTransfer.amountSent}
                        currency={selectedTransfer.originCurrency}
                        size="lg"
                      />
                    </div>
                    <div className="text-end">
                      <span className="text-xs text-[#2C6B5F] font-semibold block">
                        {dict.quote.estimatedReceivedLabel}
                      </span>
                      <AmountDisplay
                        amount={selectedTransfer.estimatedReceived}
                        currency={selectedTransfer.destinationCurrency}
                        size="lg"
                        highlight
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C9D1D0] text-xs font-mono text-[#14263D]/80">
                    <span>
                      {dict.quote.feeLabel}: {selectedTransfer.fee}{' '}
                      {selectedTransfer.originCurrency}
                    </span>
                    <span>1 MRU = {selectedTransfer.exchangeRate.toFixed(2)} XOF</span>
                    <span>{formatTimestamp(selectedTransfer.createdAt)}</span>
                  </div>
                </div>

                {/* Receipt Image Inspection */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-semibold text-[#14263D] uppercase">
                    {dict.admin.drawer.receiptBox}
                  </h4>
                  <ReceiptPreview
                    dataUrl={selectedTransfer.receiptDataUrl}
                    fileName={selectedTransfer.receiptFileName}
                    fileSize={selectedTransfer.receiptFileSize}
                    readonly
                  />
                </div>

                {/* Full Status Timeline */}
                <div className="bg-[#F3F0E8]/60 border border-[#C9D1D0] p-4 space-y-4">
                  <h4 className="text-xs font-mono font-semibold text-[#14263D] uppercase pb-2 border-b border-[#C9D1D0]">
                    {dict.tracking.timelineHeader}
                  </h4>
                  <TransferTimeline
                    status={selectedTransfer.status}
                    timeline={selectedTransfer.timeline}
                    rejectionReason={selectedTransfer.rejectionReason}
                  />
                </div>

                {/* Open in Customer Tracker Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const idToTrack = selectedTransfer.id;
                      handleCloseDrawer();
                      openTrackingForId(idToTrack);
                    }}
                    className="w-full py-3 px-4 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#7FAEA3]" />
                    <span>{dict.admin.drawer.viewInTrackerBtn}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
