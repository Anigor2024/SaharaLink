'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  CornerDownLeft,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { AmountDisplay, TransferRoute } from '@/components/ui/corridor-primitives';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { aiService } from '@/services/ai-service';
import { ChatMessage } from '@/types/corridor';

function buildChatMessage(
  role: 'user' | 'assistant',
  content: string,
  extra?: Partial<ChatMessage>
): ChatMessage {
  const now = new Date();
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return {
    id: `msg-${role}-${now.getTime()}-${randomSuffix}`,
    role,
    content,
    timestamp: now.toISOString(),
    ...extra,
  };
}

/**
 * Geometric SaharaLink Intelligence Marker (No cartoon bot visuals)
 */
function ConciergeNodeMarker({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="w-7 h-7 bg-[#10161F] border border-[#7FAEA3]/50 inline-flex items-center justify-center shrink-0"
    >
      <span
        className={`w-2 h-2 border border-[#FAF8F2] ${
          active ? 'bg-[#DE655A] animate-pulse' : 'bg-[#7FAEA3]'
        }`}
      />
    </span>
  );
}

export function TransferAssistant() {
  const {
    dict,
    dir,
    language,
    settings,
    transfers,
    chatMessages,
    appendChatMessages,
    clearChat,
    applyQuoteToTransferFlow,
    openTrackingForId,
  } = useCorridor();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const ArrowDirectional = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // Scroll chat container smoothly on new messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (rawText?: string) => {
    const textToSend = (rawText ?? input).trim();
    if (!textToSend || isTyping || !settings.aiSimulationEnabled) return;

    if (!rawText) {
      setInput('');
    }

    const userMsg = buildChatMessage('user', textToSend);

    await appendChatMessages([userMsg]);
    setIsTyping(true);

    // Calibrated concierge response latency
    await new Promise((resolve) => setTimeout(resolve, 320));

    try {
      const response = await aiService.processMessage(
        textToSend,
        language,
        settings,
        transfers
      );

      const assistantMsg = buildChatMessage('assistant', response.replyText, {
        intent: response.intent,
        quote: response.quote,
        trackedTransferId: response.trackedTransferId,
        suggestedDirection: response.suggestedDirection,
        suggestedAmount: response.suggestedAmount,
      });

      await appendChatMessages([assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#FAF8F2] border border-[#14263D] flex flex-col h-full">
      {/* Concierge Header */}
      <div className="p-4 sm:p-5 bg-[#10161F] text-[#FAF8F2] border-b border-[#14263D]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7FAEA3]">
              <span className="w-1.5 h-1.5 bg-[#7FAEA3]" aria-hidden="true" />
              <span>{dict.assistant.sectionLabel}</span>
            </div>
            <h2 className="text-lg font-semibold text-[#FAF8F2]">
              {dict.assistant.title}
            </h2>
            <p className="text-xs text-[#C9D1D0]/85 leading-relaxed">
              {dict.assistant.subtitle}
            </p>
          </div>

          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              title={dict.assistant.clearChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-[#C9D1D0] hover:text-[#FAF8F2] border border-[#C9D1D0]/25 hover:border-[#FAF8F2] transition-colors shrink-0 min-h-[34px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{dict.assistant.clearChat}</span>
            </button>
          )}
        </div>
      </div>

      {/* Disabled State if Admin turned off AI Simulation */}
      {!settings.aiSimulationEnabled ? (
        <div className="p-8 text-center space-y-3 flex-1 flex flex-col items-center justify-center bg-[#F3F0E8]/60">
          <ConciergeNodeMarker />
          <p className="text-sm font-medium text-[#10161F] max-w-md leading-relaxed">
            {dict.assistant.disabledNotice}
          </p>
          <span className="font-mono text-[11px] text-[#14263D]/70">
            {settings.aiModeLabel}
          </span>
        </div>
      ) : (
        <>
          {/* Quick Corridor Prompts */}
          <div className="px-4 py-3 bg-[#F3F0E8] border-b border-[#C9D1D0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-[#14263D] uppercase">
                {dict.assistant.quickActionsLabel}
              </span>
              <span className="text-[10px] font-mono text-[#14263D]/65">
                {dict.assistant.modeBadge}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dict.assistant.quickActions.map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isTyping}
                  className="text-xs px-2.5 py-1.5 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D]/25 transition-colors text-start cursor-pointer min-h-[34px]"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Concierge Stream */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[520px] min-h-[320px] bg-[#FAF8F2]"
          >
            {/* Initial Concierge Welcome */}
            <div className="flex items-start gap-3">
              <ConciergeNodeMarker />
              <div className="flex-1 border-s-2 border-[#14263D] bg-[#F3F0E8]/80 px-4 py-3 text-sm text-[#10161F] leading-relaxed">
                <p>{dict.assistant.welcomeMessage}</p>
              </div>
            </div>

            {/* Conversation Messages */}
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={DESIGN_TOKENS.motion.fast}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : ''
                  }`}
                >
                  {isUser ? (
                    <span
                      aria-hidden="true"
                      className="w-7 h-7 bg-[#14263D] text-[#FAF8F2] font-mono text-[10px] font-bold inline-flex items-center justify-center shrink-0"
                    >
                      YOU
                    </span>
                  ) : (
                    <ConciergeNodeMarker />
                  )}

                  <div
                    className={`flex-1 max-w-[90%] text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#14263D] text-[#FAF8F2] px-4 py-3'
                        : msg.intent === 'out_of_scope'
                        ? 'bg-[#DE655A]/10 border-s-2 border-[#DE655A] px-4 py-3 text-[#10161F]'
                        : 'bg-[#F3F0E8] border border-[#C9D1D0] p-4 text-[#10161F]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Embedded Mini Route Instrument when a valid Quote is calculated */}
                    {!isUser && msg.quote && msg.quote.isValid && (
                      <div className="mt-4 bg-[#10161F] text-[#FAF8F2] border border-[#14263D] p-4 space-y-3.5">
                        <TransferRoute
                          direction={msg.quote.direction}
                          inverted
                          centerLabel={`1 MRU = ${msg.quote.exchangeRate.toFixed(2)} XOF`}
                        />

                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#C9D1D0]/15">
                          <div>
                            <span className="block text-[10px] font-mono text-[#C9D1D0] uppercase">
                              {dict.quote.youSendTag}
                            </span>
                            <AmountDisplay
                              amount={msg.quote.amountSent}
                              currency={msg.quote.originCurrency}
                              size="lg"
                              inverted
                            />
                          </div>
                          <div className="text-end">
                            <span className="block text-[10px] font-mono text-[#7FAEA3] uppercase font-semibold">
                              {dict.quote.recipientGetsTag}
                            </span>
                            <AmountDisplay
                              amount={msg.quote.estimatedReceived}
                              currency={msg.quote.destinationCurrency}
                              size="lg"
                              inverted
                              highlight
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-[#C9D1D0]/80 pt-2 border-t border-[#C9D1D0]/15">
                          <span>
                            {dict.quote.feeLabel}: {msg.quote.feeInOrigin}{' '}
                            {msg.quote.originCurrency}
                          </span>
                          <span>
                            {dict.quote.netConvertedLabel}:{' '}
                            {msg.quote.netConvertibleAmount} {msg.quote.originCurrency}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            applyQuoteToTransferFlow(
                              msg.quote!.direction,
                              msg.quote!.amountSent,
                              2
                            )
                          }
                          className="w-full py-3 px-4 bg-[#DE655A] hover:bg-[#c85247] text-[#FAF8F2] text-xs font-semibold flex items-center justify-between gap-2 transition-colors min-h-[44px] cursor-pointer"
                        >
                          <span className="font-bold text-sm">
                            {dict.assistant.applyQuoteCta}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
                            <span>{dict.assistant.applyQuoteSublabel}</span>
                            <ArrowDirectional
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Embedded Tracker CTA if assistant matched a Transfer ID */}
                    {!isUser && msg.trackedTransferId && (
                      <div className="mt-3 pt-3 border-t border-[#C9D1D0]">
                        <button
                          type="button"
                          onClick={() => openTrackingForId(msg.trackedTransferId!)}
                          className="w-full py-2.5 px-3.5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[42px] cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#7FAEA3]" />
                          <span>{dict.assistant.openTrackerCta}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Calibrated Typing State */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 ps-1"
                >
                  <ConciergeNodeMarker active />
                  <span className="text-xs font-mono text-[#14263D] bg-[#F3F0E8] border border-[#C9D1D0] px-3 py-1.5">
                    {dict.assistant.typingLabel}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Concierge Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-[#F3F0E8] border-t border-[#14263D]/25 flex items-center gap-2"
          >
            <label htmlFor="assistant-chat-input" className="sr-only">
              {dict.assistant.inputPlaceholder}
            </label>
            <input
              id="assistant-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.assistant.inputPlaceholder}
              className="flex-1 bg-[#FAF8F2] border border-[#14263D]/35 px-3.5 py-2.5 text-sm text-[#10161F] placeholder:text-[#14263D]/50 focus:outline-none focus:border-[#14263D] min-h-[46px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-5 py-2.5 bg-[#14263D] hover:bg-[#10161F] disabled:opacity-45 text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors min-h-[46px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{dict.assistant.sendButton}</span>
              <CornerDownLeft className="w-3.5 h-3.5 text-[#7FAEA3]" aria-hidden="true" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
