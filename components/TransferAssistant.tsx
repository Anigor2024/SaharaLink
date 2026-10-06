'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  RotateCcw,
  Send,
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
 * Geometric SaharaLink Concierge Marker
 */
function ConciergeNodeMarker({ active = false }: { active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="w-7 h-7 bg-[#10161F] text-[#FAF8F2] inline-flex items-center justify-center shrink-0"
    >
      <span
        className={`w-2 h-2 ${
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

    // Latency simulation
    await new Promise((resolve) => setTimeout(resolve, 340));

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
    <div className="bg-[#FAF8F2] border border-[#14263D]/20 flex flex-col h-full min-h-[580px]">
      {/* Concierge Header */}
      <div className="p-5 bg-[#10161F] text-[#FAF8F2] flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7FAEA3]">
            <span className="w-1.5 h-1.5 bg-[#7FAEA3]" aria-hidden="true" />
            <span className="font-semibold">{dict.assistant.sectionLabel}</span>
          </div>
          <h2 className="text-xl font-semibold text-[#FAF8F2]">
            {dict.assistant.title}
          </h2>
          <p className="text-xs text-[#C9D1D0]/85 leading-relaxed max-w-sm">
            {dict.assistant.subtitle}
          </p>
        </div>

        {chatMessages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            title={dict.assistant.clearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#C9D1D0] hover:text-[#FAF8F2] border border-[#C9D1D0]/30 hover:border-[#FAF8F2] transition-colors shrink-0 min-h-[34px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{dict.assistant.clearChat}</span>
          </button>
        )}
      </div>

      {/* Disabled State if Admin turned off AI Simulation */}
      {!settings.aiSimulationEnabled ? (
        <div className="p-10 text-center space-y-4 flex-1 flex flex-col items-center justify-center bg-[#F3F0E8]/50">
          <ConciergeNodeMarker />
          <p className="text-sm font-medium text-[#10161F] max-w-md leading-relaxed">
            {dict.assistant.disabledNotice}
          </p>
        </div>
      ) : (
        <>
          {/* Quick Corridor Command Prompts (Pill-free, sleek) */}
          <div className="px-5 py-3 bg-[#F3F0E8]/70 border-b border-[#C9D1D0]/70">
            <span className="text-[11px] font-mono font-semibold text-[#14263D]/80 uppercase block mb-2">
              {dict.assistant.quickActionsLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {dict.assistant.quickActions.slice(0, 4).map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isTyping}
                  className="text-xs px-3 py-1.5 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#14263D]/20 transition-colors text-start cursor-pointer min-h-[32px]"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Concierge Stream — Generous Spacing, Clean Typography */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[500px] min-h-[360px] bg-[#FAF8F2]"
          >
            {/* Initial Welcome Message */}
            <div className="flex items-start gap-3.5">
              <ConciergeNodeMarker />
              <div className="flex-1 bg-[#F3F0E8] p-4 text-sm sm:text-base text-[#10161F] leading-relaxed">
                <p>{dict.assistant.welcomeMessage}</p>
              </div>
            </div>

            {/* Conversation Messages */}
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={DESIGN_TOKENS.motion.fast}
                  className={`flex items-start gap-3.5 ${
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
                    className={`flex-1 max-w-[88%] text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-[#14263D] text-[#FAF8F2] p-4'
                        : msg.intent === 'out_of_scope'
                        ? 'bg-[#DE655A]/10 border-s-2 border-[#DE655A] p-4 text-[#10161F]'
                        : 'bg-[#F3F0E8] p-4 text-[#10161F]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Integrated Quote Bridge when a calculation is extracted */}
                    {!isUser && msg.quote && msg.quote.isValid && (
                      <div className="mt-4 bg-[#10161F] text-[#FAF8F2] p-4 space-y-3">
                        <TransferRoute
                          direction={msg.quote.direction}
                          inverted
                          centerLabel={`1 MRU = ${msg.quote.exchangeRate.toFixed(2)} XOF`}
                        />

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#C9D1D0]/20">
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
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                            <span>{dict.assistant.applyQuoteSublabel}</span>
                            <ArrowDirectional className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Tracker Button if assistant identified a Transfer ID */}
                    {!isUser && msg.trackedTransferId && (
                      <div className="mt-3 pt-2 border-t border-[#C9D1D0]/30">
                        <button
                          type="button"
                          onClick={() => openTrackingForId(msg.trackedTransferId!)}
                          className="w-full py-2.5 px-3.5 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors min-h-[40px] cursor-pointer"
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

            {/* Calibrated Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3.5"
                >
                  <ConciergeNodeMarker active />
                  <span className="text-xs font-mono text-[#14263D] bg-[#F3F0E8] px-3 py-1.5">
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
            className="p-4 bg-[#F3F0E8] border-t border-[#14263D]/20 flex items-center gap-2.5"
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
              disabled={isTyping}
              className="flex-1 bg-[#FAF8F2] border border-[#14263D]/30 focus:border-[#14263D] px-4 py-3 text-sm text-[#10161F] placeholder:text-[#14263D]/50 focus:outline-none min-h-[46px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-5 py-3 bg-[#14263D] hover:bg-[#10161F] disabled:opacity-40 text-[#FAF8F2] text-sm font-semibold transition-colors min-h-[46px] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{dict.assistant.sendButton}</span>
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
