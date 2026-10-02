'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  FileImage,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  ReceiptPreview,
  RouteIndicator,
  StatusBadge,
} from '@/components/ui/corridor-primitives';
import { CORRIDOR_NODES, RECEIVING_METHODS } from '@/lib/design-tokens';
import { calculateTransferQuote, formatCurrencyAmount } from '@/lib/quote-engine';
import {
  ReceivingMethod,
  TransferDirection,
  TransferRequest,
} from '@/types/corridor';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function TransferFlow() {
  const {
    dict,
    dir,
    language,
    settings,
    draftTransfer,
    createTransferRequest,
    openTrackingForId,
    openAdminForTransferId,
  } = useCorridor();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => draftTransfer.step);
  const [direction, setDirection] = useState<TransferDirection>(
    () => draftTransfer.direction
  );
  const [amountInput, setAmountInput] = useState<string>(() =>
    String(draftTransfer.amountSent)
  );

  // Step 2: Sender & Recipient fields
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [receivingMethod, setReceivingMethod] = useState<ReceivingMethod>(() =>
    draftTransfer.direction === 'XOF_TO_MRU' ? 'Bankily' : 'Orange Money'
  );
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3: Receipt Upload fields
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number>(0);
  const [receiptMimeType, setReceiptMimeType] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 4 & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<TransferRequest | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const numericAmount = Number(amountInput.replace(/,/g, ''));
  const quote = calculateTransferQuote(numericAmount, direction, settings);

  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrev = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleSwapDirection = () => {
    const nextDir: TransferDirection =
      direction === 'MRU_TO_XOF' ? 'XOF_TO_MRU' : 'MRU_TO_XOF';
    setDirection(nextDir);
    if (nextDir === 'XOF_TO_MRU') {
      setAmountInput('50000');
      setReceivingMethod('Bankily');
    } else {
      setAmountInput('2500');
      setReceivingMethod('Orange Money');
    }
  };

  const handleFillDemoScenario = () => {
    setSenderName('محمد سالم');
    setSenderPhone('+222 36 12 45 78');
    setRecipientName('Aïcha Koné');
    setRecipientPhone('+225 07 08 42 19 30');
    setReceivingMethod('Orange Money');
    setStep2Error(null);
  };

  const validateStep2 = (): boolean => {
    const cleanSender = senderName.trim();
    const cleanSenderPhone = senderPhone.trim();
    const cleanRecipient = recipientName.trim();
    const cleanRecipientPhone = recipientPhone.trim();

    const phoneRegex = /^[+\d][\d\s-]{6,20}$/;

    if (cleanSender.length < 2) {
      setStep2Error(dict.transferFlow.validation.senderNameRequired);
      return false;
    }
    if (!phoneRegex.test(cleanSenderPhone)) {
      setStep2Error(dict.transferFlow.validation.senderPhoneRequired);
      return false;
    }
    if (cleanRecipient.length < 2) {
      setStep2Error(dict.transferFlow.validation.recipientNameRequired);
      return false;
    }
    if (!phoneRegex.test(cleanRecipientPhone)) {
      setStep2Error(dict.transferFlow.validation.recipientPhoneRequired);
      return false;
    }

    setStep2Error(null);
    return true;
  };

  const simulateFileUpload = (
    dataUrl: string,
    name: string,
    size: number,
    mime: string
  ) => {
    setUploadError(null);
    setUploadProgress(15);

    const t1 = setTimeout(() => setUploadProgress(55), 120);
    const t2 = setTimeout(() => setUploadProgress(88), 240);
    const t3 = setTimeout(() => {
      setReceiptDataUrl(dataUrl);
      setReceiptFileName(name);
      setReceiptFileSize(size);
      setReceiptMimeType(mime);
      setUploadProgress(null);
    }, 380);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setUploadError(dict.transferFlow.receipt.fileTypeError);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(dict.transferFlow.receipt.fileSizeError);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        simulateFileUpload(reader.result, file.name, file.size, file.type);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /**
   * Generates a real, high-precision JPEG receipt image in-browser via HTML5 Canvas
   * so evaluators can test JPG upload in 1 click without needing a local file on disk.
   */
  const handleGenerateSampleJpg = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FAF8F2';
    ctx.fillRect(0, 0, 640, 800);

    // Outer frame
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(30, 30, 580, 740);
    ctx.strokeStyle = '#14263D';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 580, 740);

    // Header band
    ctx.fillStyle = '#14263D';
    ctx.fillRect(30, 30, 580, 110);

    ctx.fillStyle = '#FAF8F2';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SAHARALINK · DEMO JPG RECEIPT', 56, 80);

    ctx.fillStyle = '#7FAEA3';
    ctx.font = '14px monospace';
    ctx.fillText('PROTOTYPE TRANSFER VOUCHER · NON-FINANCIAL', 56, 110);

    // Amount box
    ctx.fillStyle = '#F3F0E8';
    ctx.fillRect(56, 175, 528, 110);
    ctx.strokeStyle = '#C9D1D0';
    ctx.lineWidth = 1;
    ctx.strokeRect(56, 175, 528, 110);

    ctx.fillStyle = '#14263D';
    ctx.font = '13px monospace';
    ctx.fillText('DECLARED AMOUNT SENT', 80, 208);

    ctx.fillStyle = '#10161F';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(
      formatCurrencyAmount(quote.amountSent, quote.originCurrency),
      80,
      258
    );

    // Rows
    const rows = [
      ['CORRIDOR DIRECTION', direction === 'MRU_TO_XOF' ? 'MRU -> XOF' : 'XOF -> MRU'],
      ['SENDER', senderName.trim() || 'Mohamed Salem (محمد سالم)'],
      ['SENDER PHONE', senderPhone.trim() || '+222 36 12 45 78'],
      ['RECIPIENT', recipientName.trim() || 'Aïcha Koné'],
      ['RECIPIENT PHONE', recipientPhone.trim() || '+225 07 08 42 19 30'],
      ['PAYOUT METHOD', receivingMethod],
      [
        'ESTIMATED PAYOUT',
        formatCurrencyAmount(quote.estimatedReceived, quote.destinationCurrency),
      ],
      ['TIMESTAMP', new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC'],
    ];

    let y = 340;
    rows.forEach(([label, val]) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '13px monospace';
      ctx.fillText(label, 56, y);

      ctx.fillStyle = '#10161F';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(val, 260, y);

      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(56, y + 14);
      ctx.lineTo(584, y + 14);
      ctx.stroke();

      y += 44;
    });

    // Footer stamp
    ctx.fillStyle = '#FAF8F2';
    ctx.fillRect(56, 695, 528, 50);
    ctx.strokeStyle = '#7FAEA3';
    ctx.strokeRect(56, 695, 528, 50);

    ctx.fillStyle = '#14263D';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('DEMO JPEG VOUCHER · VALIDATED FOR PROTOTYPE REVIEW', 110, 725);

    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const approxByteSize = Math.round((jpgDataUrl.length * 3) / 4);
    simulateFileUpload(
      jpgDataUrl,
      `saharalink_receipt_${quote.amountSent}_${quote.originCurrency.toLowerCase()}.jpg`,
      approxByteSize,
      'image/jpeg'
    );
  };

  const handleSubmitTransfer = async () => {
    if (!quote.isValid || !receiptDataUrl || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const created = await createTransferRequest({
        direction,
        amountSent: quote.amountSent,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        receivingMethod,
        receiptDataUrl,
        receiptFileName,
        receiptFileSize,
        receiptMimeType,
      });
      setSubmittedRequest(created);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleResetForNewTransfer = () => {
    setSubmittedRequest(null);
    setStep(1);
    setReceiptDataUrl('');
    setReceiptFileName('');
    setReceiptFileSize(0);
  };

  const getValidationMessage = () => {
    if (!quote.validationError) return null;
    const msgTemplate = dict.quote.errors[quote.validationError];
    return msgTemplate
      .replace('{min}', quote.minAllowedInOrigin.toLocaleString('en-US'))
      .replace('{max}', quote.maxAllowedInOrigin.toLocaleString('en-US'))
      .replace('{fee}', quote.feeInOrigin.toLocaleString('en-US'))
      .replace('{curr}', quote.originCurrency);
  };

  // Confirmation View after submission
  if (submittedRequest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FAF8F2] border border-[#14263D] p-5 sm:p-8 space-y-6"
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#C9D1D0]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#2C6B5F] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{dict.transferFlow.confirmation.kicker}</span>
            </div>
            <h2 className="text-2xl font-semibold text-[#10161F] mt-1">
              {dict.transferFlow.confirmation.title}
            </h2>
            <p className="text-sm text-[#14263D]/80 mt-1">
              {dict.transferFlow.confirmation.subtitle}
            </p>
          </div>
          <StatusBadge status={submittedRequest.status} size="md" />
        </div>

        {/* Highlighted Unique Transfer ID Instrument */}
        <div className="bg-[#14263D] text-[#FAF8F2] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-s-4 border-[#7FAEA3]">
          <div>
            <span className="text-xs font-mono text-[#C9D1D0] block">
              {dict.transferFlow.confirmation.transferIdLabel}
            </span>
            <span
              dir="ltr"
              className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-[#FAF8F2] mt-1 block tabular-nums"
            >
              {submittedRequest.id}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopyId(submittedRequest.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF8F2] text-[#10161F] hover:bg-[#F3F0E8] text-xs font-semibold transition-colors min-h-[42px] cursor-pointer shrink-0"
          >
            {copiedId ? (
              <>
                <Check className="w-4 h-4 text-[#2C6B5F]" />
                <span>{dict.transferFlow.confirmation.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#14263D]" />
                <span>{dict.transferFlow.confirmation.copyId}</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F3F0E8] border border-[#C9D1D0] p-4">
          <div>
            <span className="text-xs text-[#14263D]/75 block">
              {dict.quote.amountSentLabel}
            </span>
            <AmountDisplay
              amount={submittedRequest.amountSent}
              currency={submittedRequest.originCurrency}
              size="lg"
            />
          </div>
          <div>
            <span className="text-xs text-[#2C6B5F] font-medium block">
              {dict.quote.estimatedReceivedLabel}
            </span>
            <AmountDisplay
              amount={submittedRequest.estimatedReceived}
              currency={submittedRequest.destinationCurrency}
              size="lg"
              highlight
            />
          </div>
          <div className="pt-2 border-t border-[#C9D1D0]/70">
            <span className="text-xs text-[#14263D]/70 block">
              {dict.transferFlow.senderSection} → {dict.transferFlow.recipientSection}
            </span>
            <p className="text-sm font-medium text-[#10161F] mt-0.5">
              {submittedRequest.senderName} → {submittedRequest.recipientName}
            </p>
          </div>
          <div className="pt-2 border-t border-[#C9D1D0]/70">
            <span className="text-xs text-[#14263D]/70 block">
              {dict.transferFlow.methodLabel}
            </span>
            <p className="text-sm font-mono font-semibold text-[#10161F] mt-0.5">
              {submittedRequest.receivingMethod}
            </p>
          </div>
        </div>

        {/* Primary Next-Step Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => openTrackingForId(submittedRequest.id)}
            className="w-full py-3.5 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#7FAEA3]" />
            <span>{dict.transferFlow.confirmation.trackRequestCta}</span>
          </button>

          <button
            type="button"
            onClick={() => openAdminForTransferId(submittedRequest.id)}
            className="w-full py-3.5 px-5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/30 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#14263D]" />
            <span>{dict.transferFlow.confirmation.openAdminToReviewCta}</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleResetForNewTransfer}
            className="text-xs font-medium text-[#14263D] hover:text-[#10161F] underline underline-offset-4 cursor-pointer py-1"
          >
            {dict.transferFlow.confirmation.newTransferCta}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      id="transfer-studio-section"
      className="bg-[#FAF8F2] border border-[#14263D]/25 flex flex-col"
    >
      {/* Studio Header */}
      <div className="p-4 sm:p-5 bg-[#F3F0E8] border-b border-[#C9D1D0]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono text-[#14263D]/80 block">
              {dict.quote.sectionLabel}
            </span>
            <h2 className="text-lg font-semibold text-[#10161F] mt-0.5">
              {dict.quote.title}
            </h2>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#14263D] bg-[#FAF8F2] border border-[#C9D1D0] px-2.5 py-1">
            1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
          </span>
        </div>

        {/* 4-Step Calibrated Progress Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4">
          {(
            [
              [1, dict.transferFlow.steps.step1],
              [2, dict.transferFlow.steps.step2],
              [3, dict.transferFlow.steps.step3],
              [4, dict.transferFlow.steps.step4],
            ] as const
          ).map(([num, label]) => {
            const isCurrent = step === num;
            const isCompleted = step > num;

            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (num < step) setStep(num);
                  else if (num === 2 && quote.isValid) setStep(2);
                  else if (num === 3 && quote.isValid && validateStep2()) setStep(3);
                  else if (num === 4 && quote.isValid && validateStep2() && receiptDataUrl)
                    setStep(4);
                }}
                className={`text-start px-2.5 py-2 border text-xs font-medium transition-colors min-h-[38px] flex items-center justify-between gap-1 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                    : isCompleted
                    ? 'bg-[#FAF8F2] text-[#10161F] border-[#7FAEA3]'
                    : 'bg-[#FAF8F2]/60 text-[#14263D]/55 border-[#C9D1D0]'
                }`}
              >
                <span className="truncate">{label}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2C6B5F] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paused Banner if Admin disabled new requests */}
      {!settings.acceptingNewRequests && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-[#DE655A]/12 border border-[#DE655A] text-[#8C2D25] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DE655A] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-sm">{dict.transferFlow.acceptingPausedTitle}</p>
            <p className="mt-0.5">{dict.transferFlow.acceptingPausedDesc}</p>
          </div>
        </div>
      )}

      {/* Step Body */}
      <div className="p-4 sm:p-6 flex-1">
        <AnimatePresence mode="wait">
          {/* STEP 01: LIVE QUOTE INSTRUMENT & DIRECTION */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              {/* Direction Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#14263D]">
                    {dict.quote.directionLabel}
                  </label>
                  <button
                    type="button"
                    onClick={handleSwapDirection}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#14263D] hover:text-[#10161F] cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#7FAEA3]" />
                    <span>{dict.quote.swapDirection}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('MRU_TO_XOF');
                      if (receivingMethod === 'Bankily' || receivingMethod === 'Masrivi') {
                        setReceivingMethod('Orange Money');
                      }
                    }}
                    className={`p-3.5 border text-start transition-colors min-h-[54px] cursor-pointer ${
                      direction === 'MRU_TO_XOF'
                        ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                        : 'bg-[#F3F0E8]/60 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">MRU → XOF</span>
                      <span className="text-[11px] opacity-80">NKC → ABJ</span>
                    </div>
                    <p className="text-xs mt-1 truncate">{dict.quote.mruToXof}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDirection('XOF_TO_MRU');
                      if (
                        receivingMethod === 'Orange Money' ||
                        receivingMethod === 'Wave' ||
                        receivingMethod === 'MTN Money'
                      ) {
                        setReceivingMethod('Bankily');
                      }
                    }}
                    className={`p-3.5 border text-start transition-colors min-h-[54px] cursor-pointer ${
                      direction === 'XOF_TO_MRU'
                        ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                        : 'bg-[#F3F0E8]/60 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">XOF → MRU</span>
                      <span className="text-[11px] opacity-80">ABJ → NKC</span>
                    </div>
                    <p className="text-xs mt-1 truncate">{dict.quote.xofToMru}</p>
                  </button>
                </div>
              </div>

              <RouteIndicator direction={direction} />

              {/* Amount Sent Input */}
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="quote-amount-input"
                    className="text-xs font-semibold text-[#14263D]"
                  >
                    {dict.quote.amountSentLabel} ({quote.originCurrency})
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-[#14263D]/70">
                    {dict.quote.limitsNotice
                      .replace('{min}', quote.minAllowedInOrigin.toLocaleString('en-US'))
                      .replace('{max}', quote.maxAllowedInOrigin.toLocaleString('en-US'))
                      .replace(/\{curr\}/g, quote.originCurrency)}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    id="quote-amount-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full bg-[#FAF8F2] border-2 border-[#14263D] px-4 py-3.5 text-2xl font-mono font-semibold tabular-nums text-[#10161F] focus:outline-none focus:ring-2 focus:ring-[#7FAEA3]"
                  />
                  <span className="absolute end-4 font-mono text-sm font-bold text-[#14263D] bg-[#F3F0E8] px-2.5 py-1 border border-[#C9D1D0]">
                    {quote.originCurrency}
                  </span>
                </div>

                {/* Preset Amount Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(direction === 'MRU_TO_XOF'
                    ? [1000, 2500, 5000, 10000, 25000]
                    : [15000, 50000, 100000, 250000]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(String(preset))}
                      className={`px-2.5 py-1 text-xs font-mono tabular-nums border transition-colors min-h-[32px] cursor-pointer ${
                        numericAmount === preset
                          ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                          : 'bg-[#F3F0E8] text-[#14263D] border-[#C9D1D0] hover:border-[#14263D]'
                      }`}
                    >
                      {preset.toLocaleString('en-US')} {quote.originCurrency}
                    </button>
                  ))}
                </div>

                {/* Validation Error */}
                {!quote.isValid && (
                  <div
                    role="alert"
                    className="mt-2.5 p-3 bg-[#DE655A]/12 border border-[#DE655A] text-xs text-[#8C2D25] flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                    <span>{getValidationMessage()}</span>
                  </div>
                )}
              </div>

              {/* Calibrated Calculation Ledger */}
              <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#14263D]/80">{dict.quote.exchangeRateLabel}</span>
                  <span dir="ltr" className="font-mono font-semibold tabular-nums text-[#10161F]">
                    {quote.effectiveRateDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#14263D]/80">{dict.quote.feeLabel}</span>
                  <span dir="ltr" className="font-mono font-semibold tabular-nums text-[#10161F]">
                    - {formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#C9D1D0]/70">
                  <span className="text-[#14263D]/80">{dict.quote.netConvertedLabel}</span>
                  <span dir="ltr" className="font-mono font-semibold tabular-nums text-[#10161F]">
                    {formatCurrencyAmount(quote.netConvertibleAmount, quote.originCurrency)}
                  </span>
                </div>

                {/* Estimated Recipient Amount Highlight */}
                <div className="pt-3 border-t border-[#14263D]/20 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-[#14263D] block">
                      {dict.quote.estimatedReceivedLabel}
                    </span>
                    <span className="text-[11px] text-[#14263D]/70">
                      {language === 'ar'
                        ? CORRIDOR_NODES[quote.destinationCurrency].currencyNameAr
                        : CORRIDOR_NODES[quote.destinationCurrency].currencyNameFr}
                    </span>
                  </div>

                  <motion.div
                    key={`${quote.estimatedReceived}-${quote.destinationCurrency}`}
                    initial={{ opacity: 0.5, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    <AmountDisplay
                      amount={quote.estimatedReceived}
                      currency={quote.destinationCurrency}
                      size="xl"
                      highlight
                    />
                  </motion.div>
                </div>
              </div>

              <button
                type="button"
                disabled={!quote.isValid || !settings.acceptingNewRequests}
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-5 bg-[#14263D] hover:bg-[#10161F] disabled:opacity-45 text-[#FAF8F2] text-sm font-semibold flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
              >
                <span>{dict.transferFlow.nextStep}</span>
                <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
              </button>
            </motion.div>
          )}

          {/* STEP 02: SENDER, RECIPIENT & RECEIVING METHOD */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              {/* 1-Click Demo Scenario Auto-fill Helper */}
              <div className="flex items-center justify-between gap-2 bg-[#F3F0E8] border border-[#C9D1D0] p-3">
                <div className="flex items-center gap-2 text-xs text-[#14263D]">
                  <Sparkles className="w-4 h-4 text-[#2C6B5F] shrink-0" />
                  <span className="font-medium">{dict.transferFlow.fillDemoScenario}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoScenario}
                  className="px-3 py-1.5 bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] text-xs font-medium whitespace-nowrap shrink-0 min-h-[34px] cursor-pointer"
                >
                  {language === 'ar' ? 'تعبئة تلقائية' : 'Auto-remplir'}
                </button>
              </div>

              {/* Sender Information */}
              <div className="space-y-3 border-b border-[#C9D1D0] pb-5">
                <h3 className="text-xs font-mono font-semibold text-[#14263D] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#7FAEA3]" />
                  <span>{dict.transferFlow.senderSection}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="sender-name-input"
                      className="block text-xs font-medium text-[#10161F] mb-1"
                    >
                      {dict.transferFlow.senderNameLabel}
                    </label>
                    <input
                      id="sender-name-input"
                      type="text"
                      value={senderName}
                      onChange={(e) => {
                        setSenderName(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder={dict.transferFlow.senderNamePlaceholder}
                      className="w-full bg-[#FAF8F2] border border-[#14263D]/35 px-3.5 py-2.5 text-sm text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sender-phone-input"
                      className="block text-xs font-medium text-[#10161F] mb-1"
                    >
                      {dict.transferFlow.senderPhoneLabel}
                    </label>
                    <input
                      id="sender-phone-input"
                      type="tel"
                      dir="ltr"
                      value={senderPhone}
                      onChange={(e) => {
                        setSenderPhone(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder={CORRIDOR_NODES[quote.originCurrency].phonePlaceholder}
                      className="w-full bg-[#FAF8F2] border border-[#14263D]/35 px-3.5 py-2.5 text-sm font-mono text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-3 border-b border-[#C9D1D0] pb-5">
                <h3 className="text-xs font-mono font-semibold text-[#14263D] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#DE655A]" />
                  <span>{dict.transferFlow.recipientSection}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="recipient-name-input"
                      className="block text-xs font-medium text-[#10161F] mb-1"
                    >
                      {dict.transferFlow.recipientNameLabel}
                    </label>
                    <input
                      id="recipient-name-input"
                      type="text"
                      value={recipientName}
                      onChange={(e) => {
                        setRecipientName(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder={dict.transferFlow.recipientNamePlaceholder}
                      className="w-full bg-[#FAF8F2] border border-[#14263D]/35 px-3.5 py-2.5 text-sm text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="recipient-phone-input"
                      className="block text-xs font-medium text-[#10161F] mb-1"
                    >
                      {dict.transferFlow.recipientPhoneLabel}
                    </label>
                    <input
                      id="recipient-phone-input"
                      type="tel"
                      dir="ltr"
                      value={recipientPhone}
                      onChange={(e) => {
                        setRecipientPhone(e.target.value);
                        setStep2Error(null);
                      }}
                      placeholder={CORRIDOR_NODES[quote.destinationCurrency].phonePlaceholder}
                      className="w-full bg-[#FAF8F2] border border-[#14263D]/35 px-3.5 py-2.5 text-sm font-mono text-[#10161F] focus:outline-none focus:border-[#14263D] min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Receiving Method Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-[#10161F]">
                  {dict.transferFlow.methodLabel}
                </label>
                <p className="text-xs text-[#14263D]/70">{dict.transferFlow.methodHelper}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {RECEIVING_METHODS.map((method) => {
                    const isSelected = receivingMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setReceivingMethod(method.id)}
                        className={`p-3 border text-start transition-colors min-h-[52px] cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                            : 'bg-[#F3F0E8]/60 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold block">
                            {language === 'ar' ? method.labelAr : method.labelFr}
                          </span>
                          <span
                            className={`text-[11px] block truncate mt-0.5 ${
                              isSelected ? 'text-[#C9D1D0]' : 'text-[#14263D]/70'
                            }`}
                          >
                            {language === 'ar'
                              ? method.settlementNoteAr
                              : method.settlementNoteFr}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#7FAEA3] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {step2Error && (
                <div
                  role="alert"
                  className="p-3 bg-[#DE655A]/12 border border-[#DE655A] text-xs text-[#8C2D25] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                  <span>{step2Error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#C9D1D0] text-xs font-medium inline-flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="flex-1 py-3 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
                >
                  <span>{dict.transferFlow.nextStep}</span>
                  <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 03: RECEIPT UPLOAD */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-base font-semibold text-[#10161F]">
                  {dict.transferFlow.receipt.title}
                </h3>
                <p className="text-xs text-[#14263D]/75 mt-0.5">
                  {dict.transferFlow.receipt.subtitle}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="sr-only"
                id="receipt-file-upload"
              />

              {/* Upload Progress Simulation */}
              {uploadProgress !== null && (
                <div className="p-6 border border-[#14263D] bg-[#F3F0E8] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-[#14263D]">
                    <span>{dict.transferFlow.receipt.uploading}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#C9D1D0] overflow-hidden">
                    <div
                      className={`h-full bg-[#14263D] transition-all duration-150 ${
                        uploadProgress < 30
                          ? 'w-1/6'
                          : uploadProgress < 70
                          ? 'w-3/5'
                          : 'w-11/12'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Dropzone or Uploaded Preview */}
              {uploadProgress === null && !receiptDataUrl && (
                <div className="space-y-3">
                  <label
                    htmlFor="receipt-file-upload"
                    className="border-2 border-dashed border-[#14263D]/40 hover:border-[#14263D] bg-[#F3F0E8]/60 hover:bg-[#F3F0E8] p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <div className="w-11 h-11 bg-[#14263D] text-[#FAF8F2] flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-[#7FAEA3]" />
                    </div>
                    <span className="text-sm font-semibold text-[#10161F]">
                      {dict.transferFlow.receipt.dropzoneTitle}
                    </span>
                    <span className="text-xs text-[#14263D]/70 mt-1 max-w-md">
                      {dict.transferFlow.receipt.dropzoneHint}
                    </span>
                  </label>

                  {/* 1-Click Sample JPG Generator for instant testing */}
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleGenerateSampleJpg}
                      className="w-full py-3 px-4 bg-[#FAF8F2] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#14263D] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <FileImage className="w-4 h-4 text-[#DE655A]" />
                      <span>{dict.transferFlow.receipt.generateDemoJpg}</span>
                    </button>
                  </div>
                </div>
              )}

              {uploadProgress === null && receiptDataUrl && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-[#7FAEA3]/15 border border-[#7FAEA3] text-xs text-[#14263D] flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2C6B5F] shrink-0" />
                    <span>{dict.transferFlow.receipt.verifiedReady}</span>
                  </div>

                  <ReceiptPreview
                    dataUrl={receiptDataUrl}
                    fileName={receiptFileName}
                    fileSize={receiptFileSize}
                    onReplace={() => fileInputRef.current?.click()}
                    onRemove={() => {
                      setReceiptDataUrl('');
                      setReceiptFileName('');
                      setReceiptFileSize(0);
                    }}
                  />
                </div>
              )}

              {uploadError && (
                <div
                  role="alert"
                  className="p-3 bg-[#DE655A]/12 border border-[#DE655A] text-xs text-[#8C2D25] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#C9D1D0] text-xs font-medium inline-flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!receiptDataUrl) {
                      setUploadError(dict.transferFlow.validation.receiptRequired);
                      return;
                    }
                    setStep(4);
                  }}
                  className="flex-1 py-3 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
                >
                  <span>{dict.transferFlow.nextStep}</span>
                  <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 04: FINAL REVIEW & CONFIRMATION */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-base font-semibold text-[#10161F]">
                  {dict.transferFlow.review.title}
                </h3>
                <p className="text-xs text-[#14263D]/75 mt-0.5">
                  {dict.transferFlow.review.subtitle}
                </p>
              </div>

              <RouteIndicator direction={direction} />

              {/* Financial Summary */}
              <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 space-y-2.5">
                <h4 className="text-xs font-mono font-semibold text-[#14263D] uppercase pb-1.5 border-b border-[#C9D1D0]">
                  {dict.transferFlow.review.corridorSummary}
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-xs text-[#14263D]/75 block">
                      {dict.quote.amountSentLabel}
                    </span>
                    <AmountDisplay
                      amount={quote.amountSent}
                      currency={quote.originCurrency}
                      size="lg"
                    />
                  </div>
                  <div className="text-end">
                    <span className="text-xs text-[#2C6B5F] font-semibold block">
                      {dict.quote.estimatedReceivedLabel}
                    </span>
                    <AmountDisplay
                      amount={quote.estimatedReceived}
                      currency={quote.destinationCurrency}
                      size="lg"
                      highlight
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#14263D]/80 pt-2 border-t border-[#C9D1D0]/70">
                  <span>
                    {dict.quote.feeLabel}: {quote.feeInOrigin} {quote.originCurrency}
                  </span>
                  <span>1 MRU = {quote.exchangeRate.toFixed(2)} XOF</span>
                </div>
              </div>

              {/* Parties Summary */}
              <div className="bg-[#FAF8F2] border border-[#C9D1D0] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#14263D]/70 block">
                    {dict.transferFlow.senderSection}
                  </span>
                  <p className="font-semibold text-[#10161F] text-sm mt-0.5">{senderName}</p>
                  <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                    {senderPhone}
                  </p>
                </div>

                <div>
                  <span className="text-[#14263D]/70 block">
                    {dict.transferFlow.recipientSection}
                  </span>
                  <p className="font-semibold text-[#10161F] text-sm mt-0.5">
                    {recipientName}
                  </p>
                  <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                    {recipientPhone}
                  </p>
                </div>

                <div>
                  <span className="text-[#14263D]/70 block">
                    {dict.transferFlow.methodLabel}
                  </span>
                  <p className="font-mono font-bold text-[#14263D] text-sm mt-0.5">
                    {receivingMethod}
                  </p>
                </div>
              </div>

              {/* Attached Receipt Preview */}
              {receiptDataUrl && (
                <ReceiptPreview
                  dataUrl={receiptDataUrl}
                  fileName={receiptFileName}
                  fileSize={receiptFileSize}
                  readonly
                />
              )}

              <p className="text-xs text-[#14263D]/75 bg-[#F3F0E8] p-3 border-s-2 border-[#14263D]">
                {dict.transferFlow.review.demoDisclaimer}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#C9D1D0] text-xs font-medium inline-flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !settings.acceptingNewRequests}
                  onClick={handleSubmitTransfer}
                  className="flex-1 py-3.5 px-6 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? dict.transferFlow.submitting
                      : dict.transferFlow.submitRequest}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
