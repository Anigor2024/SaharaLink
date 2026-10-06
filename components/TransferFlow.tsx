'use client';

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import {
  AmountDisplay,
  ReceiptPreview,
  StatusBadge,
  TransferRoute,
} from '@/components/ui/corridor-primitives';
import {
  CORRIDOR_NODES,
  DESIGN_TOKENS,
  getContextualReceivingMethods,
} from '@/lib/design-tokens';
import { calculateTransferQuote, formatCurrencyAmount } from '@/lib/quote-engine';
import {
  ReceivingMethod,
  TransferDirection,
  TransferRequest,
} from '@/types/corridor';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

type ReceiptUploadState = 'EMPTY' | 'DRAGGING' | 'UPLOADING' | 'UPLOADED' | 'ERROR';

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
  const [stepTransitionDir, setStepTransitionDir] = useState<1 | -1>(1);

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
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Step 3: 5-State Receipt Upload
  const [uploadState, setUploadState] = useState<ReceiptUploadState>('EMPTY');
  const [uploadPhase, setUploadPhase] = useState<1 | 2 | 3>(1);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number>(0);
  const [receiptMimeType, setReceiptMimeType] = useState<string>('');
  const [receiptUploadedAt, setReceiptUploadedAt] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 4 & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<TransferRequest | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const numericAmount = Number(amountInput.replace(/,/g, ''));
  const quote = calculateTransferQuote(numericAmount, direction, settings);
  const { primary: recommendedMethods, secondary: otherMethods } =
    getContextualReceivingMethods(direction);

  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrev = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const navigateToStep = (nextStep: 1 | 2 | 3 | 4) => {
    setStepTransitionDir(nextStep >= step ? 1 : -1);
    setStep(nextStep);
  };

  const handleDirectionSelect = (nextDir: TransferDirection) => {
    setDirection(nextDir);
    if (nextDir === 'XOF_TO_MRU') {
      if (numericAmount < 5000) setAmountInput('50000');
      setReceivingMethod('Bankily');
    } else {
      if (numericAmount > 50000) setAmountInput('2500');
      setReceivingMethod('Orange Money');
    }
  };

  const handleSwapDirection = () => {
    handleDirectionSelect(
      direction === 'MRU_TO_XOF' ? 'XOF_TO_MRU' : 'MRU_TO_XOF'
    );
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

  const runCalibratedUploadPipeline = (
    dataUrl: string,
    name: string,
    size: number,
    mime: string
  ) => {
    setUploadError(null);
    setUploadState('UPLOADING');
    setUploadPhase(1);

    setTimeout(() => setUploadPhase(2), 130);
    setTimeout(() => setUploadPhase(3), 260);
    setTimeout(() => {
      setReceiptDataUrl(dataUrl);
      setReceiptFileName(name);
      setReceiptFileSize(size);
      setReceiptMimeType(mime);
      setReceiptUploadedAt(new Date().toISOString());
      setUploadState('UPLOADED');
    }, 400);
  };

  const processSelectedFile = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setUploadState('ERROR');
      setUploadError(dict.transferFlow.receipt.fileTypeError);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadState('ERROR');
      setUploadError(dict.transferFlow.receipt.fileSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        runCalibratedUploadPipeline(reader.result, file.name, file.size, file.type);
      }
    };
    reader.onerror = () => {
      setUploadState('ERROR');
      setUploadError(dict.transferFlow.receipt.fileTypeError);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) {
      setUploadState(receiptDataUrl ? 'UPLOADED' : 'EMPTY');
      return;
    }
    processSelectedFile(file);
  };

  /**
   * Generates a real JPEG receipt voucher in-browser via HTML5 Canvas
   */
  const handleGenerateSampleJpg = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FAF8F2';
    ctx.fillRect(0, 0, 640, 800);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(30, 30, 580, 740);
    ctx.strokeStyle = '#14263D';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 580, 740);

    ctx.fillStyle = '#14263D';
    ctx.fillRect(30, 30, 580, 110);

    ctx.fillStyle = '#FAF8F2';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SAHARALINK · DEMO JPG RECEIPT', 56, 80);

    ctx.fillStyle = '#7FAEA3';
    ctx.font = '14px monospace';
    ctx.fillText('PROTOTYPE TRANSFER VOUCHER · NON-FINANCIAL', 56, 110);

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

    ctx.fillStyle = '#FAF8F2';
    ctx.fillRect(56, 695, 528, 50);
    ctx.strokeStyle = '#7FAEA3';
    ctx.strokeRect(56, 695, 528, 50);

    ctx.fillStyle = '#14263D';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('DEMO JPEG VOUCHER · VALIDATED FOR PROTOTYPE REVIEW', 110, 725);

    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const approxByteSize = Math.round((jpgDataUrl.length * 3) / 4);
    runCalibratedUploadPipeline(
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
        receiptUploadedAt,
      });
      setSubmittedRequest(created);
    } catch {
      // Error is surfaced through CorridorContext storageError banner
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
    navigateToStep(1);
    setReceiptDataUrl('');
    setReceiptFileName('');
    setReceiptFileSize(0);
    setUploadState('EMPTY');
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

  // ============================================================================
  // SECTION N: MEMORABLE CONFIRMATION / TRANSFER ID MOMENT
  // ============================================================================
  if (submittedRequest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={DESIGN_TOKENS.motion.enter}
        className="bg-[#FAF8F2] border border-[#14263D] flex flex-col justify-between h-full"
      >
        {/* Top Architectural Voucher Header */}
        <div className="bg-[#10161F] text-[#FAF8F2] p-6 sm:p-8 border-b border-[#14263D] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7FAEA3] tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>{dict.transferFlow.confirmation.kicker}</span>
            </div>
            <StatusBadge status={submittedRequest.status} size="md" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#FAF8F2]">
              {dict.transferFlow.confirmation.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#C9D1D0] mt-1">
              {dict.transferFlow.confirmation.subtitle}
            </p>
          </div>

          {/* Focal Transfer ID Instrument */}
          <div className="bg-[#14263D] border-s-4 border-[#7FAEA3] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-[#C9D1D0] uppercase tracking-wider block">
                {dict.transferFlow.confirmation.transferIdLabel}
              </span>
              <span
                dir="ltr"
                className="text-3xl sm:text-4xl font-mono font-bold tracking-wider text-[#FAF8F2] mt-1 block tabular-nums"
              >
                {submittedRequest.id}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopyId(submittedRequest.id)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAF8F2] text-[#10161F] hover:bg-[#7FAEA3] text-xs font-semibold transition-colors min-h-[46px] cursor-pointer shrink-0"
            >
              {copiedId ? (
                <>
                  <Check className="w-4 h-4 text-[#1F5C50]" />
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
        </div>

        {/* Corridor Trajectory Summary */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {submittedRequest.receiptPersistenceStatus &&
            submittedRequest.receiptPersistenceStatus !== 'persistent' && (
              <div
                role="alert"
                className="p-4 bg-[#DE655A]/15 border-s-4 border-[#DE655A] text-xs font-medium text-[#7A221B] flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0 mt-0.5" />
                <span>{dict.errors.receiptPersistenceWarning}</span>
              </div>
            )}

          <TransferRoute
            direction={submittedRequest.direction}
            centerLabel={`1 MRU = ${submittedRequest.exchangeRate.toFixed(2)} XOF`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-y border-[#C9D1D0]">
            <div>
              <span className="text-xs font-mono text-[#14263D]/70 uppercase block">
                {dict.quote.youSendTag}
              </span>
              <div className="mt-1">
                <AmountDisplay
                  amount={submittedRequest.amountSent}
                  currency={submittedRequest.originCurrency}
                  size="xl"
                />
              </div>
              <p className="text-xs text-[#14263D] mt-1.5 font-medium">
                {submittedRequest.senderName} ·{' '}
                <span dir="ltr" className="font-mono">
                  {submittedRequest.senderPhone}
                </span>
              </p>
            </div>

            <div className="sm:text-end sm:border-s border-[#C9D1D0] sm:ps-6">
              <span className="text-xs font-mono text-[#1F5C50] font-semibold uppercase block">
                {dict.quote.recipientGetsTag}
              </span>
              <div className="mt-1">
                <AmountDisplay
                  amount={submittedRequest.estimatedReceived}
                  currency={submittedRequest.destinationCurrency}
                  size="xl"
                  highlight
                />
              </div>
              <p className="text-xs text-[#14263D] mt-1.5 font-medium">
                {submittedRequest.recipientName} ·{' '}
                <span className="font-mono font-bold">
                  {submittedRequest.receivingMethod}
                </span>
              </p>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => openTrackingForId(submittedRequest.id)}
              className="w-full py-4 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-colors min-h-[50px] cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#7FAEA3]" />
              <span>{dict.transferFlow.confirmation.trackRequestCta}</span>
            </button>

            <button
              type="button"
              onClick={() => openAdminForTransferId(submittedRequest.id)}
              className="w-full py-4 px-5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/35 text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-colors min-h-[50px] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#DE655A]" />
              <span>{dict.transferFlow.confirmation.openAdminToReviewCta}</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleResetForNewTransfer}
              className="text-xs font-semibold text-[#14263D] hover:text-[#10161F] underline underline-offset-4 cursor-pointer py-1"
            >
              {dict.transferFlow.confirmation.newTransferCta}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const corridorStages = [
    {
      num: 1 as const,
      code: dict.transferFlow.corridorStages.step1Code,
      label: dict.transferFlow.corridorStages.step1Label,
    },
    {
      num: 2 as const,
      code: dict.transferFlow.corridorStages.step2Code,
      label: dict.transferFlow.corridorStages.step2Label,
    },
    {
      num: 3 as const,
      code: dict.transferFlow.corridorStages.step3Code,
      label: dict.transferFlow.corridorStages.step3Label,
    },
    {
      num: 4 as const,
      code: dict.transferFlow.corridorStages.step4Code,
      label: dict.transferFlow.corridorStages.step4Label,
    },
  ];

  const routeProgressPercent = (step / 4) * 100;

  return (
    <div
      id="transfer-studio-section"
      className="bg-[#FAF8F2] border border-[#14263D] flex flex-col h-full"
    >
      {/* Instrument Header & 4-Stage Calibrated Corridor Progress Rail */}
      <div className="p-4 sm:p-5 bg-[#F3F0E8] border-b border-[#14263D]/25 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#14263D]">
              <span className="w-1.5 h-1.5 bg-[#DE655A]" aria-hidden="true" />
              <span>{dict.quote.sectionLabel}</span>
            </div>
            <h2 className="text-lg font-semibold text-[#10161F] mt-0.5">
              {dict.quote.title}
            </h2>
          </div>

          <span
            dir="ltr"
            className="font-mono text-xs font-semibold tabular-nums text-[#14263D] bg-[#FAF8F2] border border-[#14263D]/25 px-3 py-1.5"
          >
            1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
          </span>
        </div>

        {/* Calibrated Corridor Progress Bar */}
        <div className="space-y-2">
          <div className="h-1 bg-[#C9D1D0] overflow-hidden">
            <motion.div
              className="h-full bg-[#14263D]"
              animate={{ width: `${routeProgressPercent}%` }}
              transition={DESIGN_TOKENS.motion.standard}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {corridorStages.map((stg) => {
              const isCurrent = step === stg.num;
              const isCompleted = step > stg.num;

              return (
                <button
                  key={stg.num}
                  type="button"
                  onClick={() => {
                    if (stg.num < step) navigateToStep(stg.num);
                    else if (stg.num === 2 && quote.isValid) navigateToStep(2);
                    else if (stg.num === 3 && quote.isValid && validateStep2())
                      navigateToStep(3);
                    else if (
                      stg.num === 4 &&
                      quote.isValid &&
                      validateStep2() &&
                      receiptDataUrl
                    )
                      navigateToStep(4);
                  }}
                  className={`text-start py-2 px-1 transition-colors border-b-2 flex flex-col justify-between cursor-pointer ${
                    isCurrent
                      ? 'border-[#14263D] text-[#10161F]'
                      : isCompleted
                      ? 'border-[#7FAEA3] text-[#1F5C50]'
                      : 'border-transparent text-[#14263D]/45 hover:text-[#14263D]/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono text-[11px] font-bold tracking-wider ${
                        isCurrent
                          ? 'text-[#DE655A]'
                          : isCompleted
                          ? 'text-[#1F5C50]'
                          : 'text-[#14263D]/50'
                      }`}
                    >
                      {stg.code}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5C50] shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate mt-0.5 block">
                    {stg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Paused Banner if Admin disabled new requests */}
      {!settings.acceptingNewRequests && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-[#DE655A]/15 border border-[#DE655A] text-[#7A221B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DE655A] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-sm">{dict.transferFlow.acceptingPausedTitle}</p>
            <p className="mt-0.5">{dict.transferFlow.acceptingPausedDesc}</p>
          </div>
        </div>
      )}

      {/* Guided Corridor Stage Body */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <AnimatePresence mode="wait" custom={stepTransitionDir}>
          {/* ==================================================================
              STEP 01 — ORIGIN: VERTICAL QUOTE INSTRUMENT & DIRECTION
              ================================================================== */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? -18 : 18) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? 18 : -18) }}
              transition={DESIGN_TOKENS.motion.standard}
              className="space-y-5"
            >
              {/* Corridor Direction Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#14263D] uppercase">
                    {dict.quote.directionLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleSwapDirection}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14263D] hover:text-[#DE655A] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#7FAEA3]" />
                    <span>{dict.quote.swapDirection}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDirectionSelect('MRU_TO_XOF')}
                    className={`p-3.5 border text-start transition-colors min-h-[56px] cursor-pointer ${
                      direction === 'MRU_TO_XOF'
                        ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                        : 'bg-[#F3F0E8]/60 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">MRU → XOF</span>
                      <span className="font-mono text-[11px] opacity-80">NKC → ABJ</span>
                    </div>
                    <p className="text-xs mt-1 truncate">{dict.quote.mruToXof}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectionSelect('XOF_TO_MRU')}
                    className={`p-3.5 border text-start transition-colors min-h-[56px] cursor-pointer ${
                      direction === 'XOF_TO_MRU'
                        ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                        : 'bg-[#F3F0E8]/60 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">XOF → MRU</span>
                      <span className="font-mono text-[11px] opacity-80">ABJ → NKC</span>
                    </div>
                    <p className="text-xs mt-1 truncate">{dict.quote.xofToMru}</p>
                  </button>
                </div>
              </div>

              {/* ==============================================================
                  SECTION J: VERTICAL QUOTE INSTRUMENT HIERARCHY
                  YOU SEND -> EXCHANGE RATE -> FEE -> RECIPIENT GETS
                  ============================================================== */}
              <div className="border border-[#14263D] bg-[#FAF8F2]">
                {/* 1. YOU SEND */}
                <div className="p-4 sm:p-5 bg-[#FAF8F2]">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <label
                      htmlFor="quote-amount-input"
                      className="text-xs font-mono font-bold text-[#14263D] tracking-wider"
                    >
                      {dict.quote.youSendTag}
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
                      className="w-full bg-[#F3F0E8] border-2 border-[#14263D] px-4 py-3.5 text-3xl font-mono font-bold tabular-nums text-[#10161F] focus:outline-none focus:border-[#DE655A]"
                    />
                    <div className="absolute end-3 flex items-center gap-2 bg-[#14263D] text-[#FAF8F2] px-3 py-1.5">
                      <span className="font-mono text-sm font-bold">
                        {quote.originCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Quick Amount Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
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

                  {/* Validation Alert */}
                  {!quote.isValid && (
                    <div
                      role="alert"
                      className="mt-3 p-3 bg-[#DE655A]/15 border border-[#DE655A] text-xs font-medium text-[#7A221B] flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                      <span>{getValidationMessage()}</span>
                    </div>
                  )}
                </div>

                {/* 2. CALIBRATED VERTICAL CONVERSION SPINE (RATE & FEE) */}
                <div className="px-4 sm:px-5 py-3 bg-[#F3F0E8] border-y border-[#C9D1D0] relative">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-[#14263D]/70">{dict.quote.exchangeRateLabel}:</span>
                      <span dir="ltr" className="font-bold text-[#10161F] tabular-nums">
                        1 MRU = {settings.exchangeRateMruToXof.toFixed(2)} XOF
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-center gap-2 sm:border-x border-[#C9D1D0] sm:px-2">
                      <span className="text-[#14263D]/70">{dict.quote.feeLabel}:</span>
                      <span dir="ltr" className="font-bold text-[#DE655A] tabular-nums">
                        {formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-[#14263D]/70">{dict.quote.netConvertedLabel}:</span>
                      <span dir="ltr" className="font-bold text-[#10161F] tabular-nums">
                        {formatCurrencyAmount(
                          quote.netConvertibleAmount,
                          quote.originCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. RECIPIENT GETS (VISUAL FOCAL POINT) */}
                <div className="p-5 sm:p-6 bg-[#10161F] text-[#FAF8F2] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#7FAEA3] tracking-wider">
                      <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{dict.quote.recipientGetsTag}</span>
                    </div>
                    <p className="text-xs text-[#C9D1D0]">
                      {language === 'ar'
                        ? `${CORRIDOR_NODES[quote.destinationCurrency].countryAr} · ${CORRIDOR_NODES[quote.destinationCurrency].currencyNameAr}`
                        : `${CORRIDOR_NODES[quote.destinationCurrency].countryFr} · ${CORRIDOR_NODES[quote.destinationCurrency].currencyNameFr}`}
                    </p>
                  </div>

                  <motion.div
                    key={`${quote.estimatedReceived}-${quote.destinationCurrency}`}
                    initial={{ opacity: 0.4, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={DESIGN_TOKENS.motion.fast}
                    className="text-end"
                  >
                    <AmountDisplay
                      amount={quote.estimatedReceived}
                      currency={quote.destinationCurrency}
                      size="2xl"
                      inverted
                      highlight
                    />
                  </motion.div>
                </div>
              </div>

              <button
                type="button"
                disabled={!quote.isValid || !settings.acceptingNewRequests}
                onClick={() => navigateToStep(2)}
                className="w-full py-4 px-6 bg-[#14263D] hover:bg-[#10161F] disabled:opacity-45 text-[#FAF8F2] text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors min-h-[52px] cursor-pointer"
              >
                <span>{dict.transferFlow.nextStep}</span>
                <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
              </button>
            </motion.div>
          )}

          {/* ==================================================================
              STEP 02 — PARTIES: SENDER, RECIPIENT & CONTEXTUAL PAYOUT METHODS
              ================================================================== */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? -18 : 18) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? 18 : -18) }}
              transition={DESIGN_TOKENS.motion.standard}
              className="space-y-5"
            >
              {/* 1-Click Demo Scenario Auto-fill Helper */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F3F0E8] border border-[#14263D]/25 p-3">
                <div className="flex items-center gap-2 text-xs text-[#14263D]">
                  <Sparkles className="w-4 h-4 text-[#1F5C50] shrink-0" />
                  <span className="font-medium">{dict.transferFlow.fillDemoScenario}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemoScenario}
                  className="px-3.5 py-1.5 bg-[#14263D] text-[#FAF8F2] hover:bg-[#10161F] text-xs font-semibold whitespace-nowrap shrink-0 min-h-[34px] cursor-pointer"
                >
                  {language === 'ar' ? 'تعبئة تلقائية' : 'Auto-remplir'}
                </button>
              </div>

              {/* Sender & Recipient Architectural Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origin Sender Box */}
                <div className="bg-[#F3F0E8]/70 border border-[#C9D1D0] p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#C9D1D0] pb-2">
                    <span className="font-mono text-xs font-bold text-[#14263D]">
                      {dict.transferFlow.senderSection}
                    </span>
                    <span className="font-mono text-[11px] text-[#14263D]/70">
                      {CORRIDOR_NODES[quote.originCurrency].stationCode} ·{' '}
                      {CORRIDOR_NODES[quote.originCurrency].phonePrefix}
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="sender-name-input"
                      className="block text-xs font-semibold text-[#10161F] mb-1"
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
                      className="block text-xs font-semibold text-[#10161F] mb-1"
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

                {/* Destination Recipient Box */}
                <div className="bg-[#F3F0E8]/70 border border-[#C9D1D0] p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#C9D1D0] pb-2">
                    <span className="font-mono text-xs font-bold text-[#14263D]">
                      {dict.transferFlow.recipientSection}
                    </span>
                    <span className="font-mono text-[11px] text-[#1F5C50] font-semibold">
                      {CORRIDOR_NODES[quote.destinationCurrency].stationCode} ·{' '}
                      {CORRIDOR_NODES[quote.destinationCurrency].phonePrefix}
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="recipient-name-input"
                      className="block text-xs font-semibold text-[#10161F] mb-1"
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
                      className="block text-xs font-semibold text-[#10161F] mb-1"
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

              {/* Contextual Receiving Method Selection (Section L) */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="block text-xs font-mono font-bold text-[#10161F] uppercase">
                      {dict.transferFlow.methodLabel}
                    </span>
                    <span className="text-xs text-[#14263D]/75">
                      {dict.transferFlow.methodRecommendedTag} (
                      {quote.destinationCurrency})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllMethods((prev) => !prev)}
                    className="text-xs font-mono text-[#14263D] underline underline-offset-4 cursor-pointer"
                  >
                    {showAllMethods
                      ? language === 'ar'
                        ? 'عرض وسائل الوجهة فقط'
                        : 'Masquer les autres réseaux'
                      : dict.transferFlow.methodOtherTag}
                  </button>
                </div>

                {/* Primary Destination-Matched Methods */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {recommendedMethods.map((method) => {
                    const isSelected = receivingMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setReceivingMethod(method.id)}
                        className={`p-3.5 border text-start transition-all min-h-[64px] cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                            : 'bg-[#F3F0E8]/80 text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-mono text-xs font-bold">
                            {language === 'ar' ? method.labelAr : method.labelFr}
                          </span>
                          <span
                            className={`font-mono text-[10px] ${
                              isSelected ? 'text-[#7FAEA3]' : 'text-[#14263D]/60'
                            }`}
                          >
                            {method.networkTag}
                          </span>
                        </div>
                        <span
                          className={`text-[11px] block truncate mt-1.5 ${
                            isSelected ? 'text-[#C9D1D0]' : 'text-[#14263D]/75'
                          }`}
                        >
                          {language === 'ar'
                            ? method.settlementNoteAr
                            : method.settlementNoteFr}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Methods if expanded */}
                {showAllMethods && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {otherMethods.map((method) => {
                      const isSelected = receivingMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setReceivingMethod(method.id)}
                          className={`p-3 border text-start transition-colors min-h-[52px] cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#14263D] text-[#FAF8F2] border-[#14263D]'
                              : 'bg-[#FAF8F2] text-[#10161F] border-[#C9D1D0] hover:border-[#14263D]'
                          }`}
                        >
                          <div>
                            <span className="font-mono text-xs font-bold block">
                              {language === 'ar' ? method.labelAr : method.labelFr}
                            </span>
                            <span
                              className={`text-[11px] block ${
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
                )}
              </div>

              {step2Error && (
                <div
                  role="alert"
                  className="p-3 bg-[#DE655A]/15 border border-[#DE655A] text-xs font-medium text-[#7A221B] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                  <span>{step2Error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStep(1)}
                  className="px-4 py-3.5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/30 text-xs font-semibold inline-flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) navigateToStep(3);
                  }}
                  className="flex-1 py-3.5 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
                >
                  <span>{dict.transferFlow.nextStep}</span>
                  <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================================
              STEP 03 — VERIFY: 5-STATE RECEIPT UPLOAD EXPERIENCE
              ================================================================== */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? -18 : 18) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? 18 : -18) }}
              transition={DESIGN_TOKENS.motion.standard}
              className="space-y-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#10161F]">
                    {dict.transferFlow.receipt.title}
                  </h3>
                  <p className="text-xs text-[#14263D]/75 mt-0.5">
                    {dict.transferFlow.receipt.subtitle}
                  </p>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#14263D] bg-[#F3F0E8] border border-[#C9D1D0] px-2.5 py-1">
                  STATE: {uploadState}
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="sr-only"
                id="receipt-file-upload"
              />

              {/* STATE: UPLOADING (Calibrated 3-Phase Verification Rail) */}
              {uploadState === 'UPLOADING' && (
                <div className="p-6 border border-[#14263D] bg-[#10161F] text-[#FAF8F2] space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#7FAEA3]">
                    <span>
                      {uploadPhase === 1
                        ? dict.transferFlow.receipt.uploadingPhase1
                        : uploadPhase === 2
                        ? dict.transferFlow.receipt.uploadingPhase2
                        : dict.transferFlow.receipt.uploadingPhase3}
                    </span>
                    <span>0{uploadPhase} / 03</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((p) => (
                      <div
                        key={p}
                        className={`h-2 transition-colors ${
                          uploadPhase >= p ? 'bg-[#7FAEA3]' : 'bg-[#14263D]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STATE: EMPTY or DRAGGING or ERROR (when no file is loaded yet) */}
              {uploadState !== 'UPLOADING' && !receiptDataUrl && (
                <div className="space-y-3">
                  <label
                    htmlFor="receipt-file-upload"
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (uploadState !== 'DRAGGING') setUploadState('DRAGGING');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setUploadState('EMPTY');
                    }}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-7 sm:p-9 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      uploadState === 'DRAGGING'
                        ? 'border-[#DE655A] bg-[#DE655A]/10'
                        : 'border-[#14263D]/40 hover:border-[#14263D] bg-[#F3F0E8]/60 hover:bg-[#F3F0E8]'
                    }`}
                  >
                    <div className="w-12 h-12 bg-[#14263D] text-[#FAF8F2] flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-[#7FAEA3]" />
                    </div>
                    <span className="text-sm font-semibold text-[#10161F]">
                      {uploadState === 'DRAGGING'
                        ? dict.transferFlow.receipt.dropzoneDragging
                        : dict.transferFlow.receipt.dropzoneTitle}
                    </span>
                    <span className="text-xs text-[#14263D]/70 mt-1.5 max-w-md leading-relaxed">
                      {dict.transferFlow.receipt.dropzoneHint}
                    </span>
                  </label>

                  {/* 1-Click Calibrated Sample JPG Generator */}
                  <button
                    type="button"
                    onClick={handleGenerateSampleJpg}
                    className="w-full py-3.5 px-4 bg-[#FAF8F2] hover:bg-[#14263D] text-[#14263D] hover:text-[#FAF8F2] border border-[#14263D] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[46px] cursor-pointer"
                  >
                    <FileImage className="w-4 h-4 text-[#DE655A]" />
                    <span>{dict.transferFlow.receipt.generateDemoJpg}</span>
                  </button>
                </div>
              )}

              {/* STATE: UPLOADED */}
              {uploadState !== 'UPLOADING' && receiptDataUrl && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#7FAEA3]/20 border border-[#7FAEA3] text-xs text-[#10161F] flex items-center justify-between gap-2 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1F5C50] shrink-0" />
                      <span>{dict.transferFlow.receipt.verifiedReady}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#1F5C50]">
                      INDEXED-OK
                    </span>
                  </div>

                  <ReceiptPreview
                    dataUrl={receiptDataUrl}
                    fileName={receiptFileName}
                    fileSize={receiptFileSize}
                    mimeType={receiptMimeType}
                    onReplace={() => fileInputRef.current?.click()}
                    onRemove={() => {
                      setReceiptDataUrl('');
                      setReceiptFileName('');
                      setReceiptFileSize(0);
                      setReceiptMimeType('');
                      setUploadState('EMPTY');
                    }}
                  />
                </div>
              )}

              {/* STATE: ERROR */}
              {uploadError && (
                <div
                  role="alert"
                  className="p-3.5 bg-[#DE655A]/15 border border-[#DE655A] text-xs font-medium text-[#7A221B] flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-[#DE655A] shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStep(2)}
                  className="px-4 py-3.5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/30 text-xs font-semibold inline-flex items-center gap-1.5 min-h-[48px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!receiptDataUrl) {
                      setUploadState('ERROR');
                      setUploadError(dict.transferFlow.validation.receiptRequired);
                      return;
                    }
                    navigateToStep(4);
                  }}
                  className="flex-1 py-3.5 px-5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[48px] cursor-pointer"
                >
                  <span>{dict.transferFlow.nextStep}</span>
                  <ArrowNext className="w-4 h-4 text-[#7FAEA3]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================================================================
              STEP 04 — REQUEST: FINAL REVIEW & SUBMISSION
              ================================================================== */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? -18 : 18) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: stepTransitionDir * (dir === 'rtl' ? 18 : -18) }}
              transition={DESIGN_TOKENS.motion.standard}
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

              <TransferRoute
                direction={direction}
                centerLabel={`1 MRU = ${quote.exchangeRate.toFixed(2)} XOF`}
              />

              {/* Financial Trajectory Summary */}
              <div className="bg-[#10161F] text-[#FAF8F2] p-5 space-y-3 border border-[#14263D]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-mono text-[#C9D1D0] uppercase block">
                      {dict.quote.youSendTag}
                    </span>
                    <AmountDisplay
                      amount={quote.amountSent}
                      currency={quote.originCurrency}
                      size="xl"
                      inverted
                    />
                  </div>
                  <div className="text-end">
                    <span className="text-[11px] font-mono text-[#7FAEA3] font-semibold uppercase block">
                      {dict.quote.recipientGetsTag}
                    </span>
                    <AmountDisplay
                      amount={quote.estimatedReceived}
                      currency={quote.destinationCurrency}
                      size="xl"
                      inverted
                      highlight
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#C9D1D0]/80 pt-3 border-t border-[#C9D1D0]/15">
                  <span>
                    {dict.quote.feeLabel}: {quote.feeInOrigin} {quote.originCurrency}
                  </span>
                  <span>1 MRU = {quote.exchangeRate.toFixed(2)} XOF</span>
                </div>
              </div>

              {/* Parties & Method Ledger */}
              <div className="bg-[#F3F0E8] border border-[#C9D1D0] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-mono text-[11px] text-[#14263D]/70 block uppercase">
                    {dict.transferFlow.senderSection}
                  </span>
                  <p className="font-semibold text-[#10161F] text-sm mt-0.5">{senderName}</p>
                  <p dir="ltr" className="font-mono text-[#14263D] mt-0.5">
                    {senderPhone}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[11px] text-[#14263D]/70 block uppercase">
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
                  <span className="font-mono text-[11px] text-[#14263D]/70 block uppercase">
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
                  mimeType={receiptMimeType}
                  readonly
                />
              )}

              <p className="text-xs text-[#14263D]/80 bg-[#F3F0E8] p-3 border-s-2 border-[#14263D]">
                {dict.transferFlow.review.demoDisclaimer}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigateToStep(3)}
                  disabled={isSubmitting}
                  className="px-4 py-3.5 bg-[#F3F0E8] hover:bg-[#C9D1D0]/60 text-[#10161F] border border-[#14263D]/30 text-xs font-semibold inline-flex items-center gap-1.5 min-h-[50px] cursor-pointer"
                >
                  <ArrowPrev className="w-4 h-4" />
                  <span>{dict.transferFlow.prevStep}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !settings.acceptingNewRequests}
                  onClick={handleSubmitTransfer}
                  className="flex-1 py-3.5 px-6 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[50px] cursor-pointer"
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
