'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Compass,
  CornerDownLeft,
  RotateCcw,
  Sparkles,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCorridor } from '@/context/corridor-context';
import { AmountDisplay, RouteIndicator } from '@/components/ui/corridor-primitives';
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

    // Simulated local thinking latency (350ms) for tactile realism
    await new Promise((resolve) => setTimeout(resolve, 350));

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
    <div className="bg-[#FAF8F2] border border-[#14263D]/25 flex flex-col h-full">
      {/* Assistant Header */}
      <div className="p-4 sm:p-5 bg-[#14263D] text-[#FAF8F2] border-b border-[#10161F]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#7FAEA3]">
              <span>{dict.assistant.sectionLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{dict.assistant.modeBadge}</span>
            </div>
            <h2 className="text-lg font-semibold text-[#FAF8F2] mt-1">
              {dict.assistant.title}
            </h2>
            <p className="text-xs text-[#C9D1D0] mt-0.5 leading-relaxed">
              {dict.assistant.subtitle}
            </p>
          </div>

          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              title={dict.assistant.clearChat}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#C9D1D0] hover:text-[#FAF8F2] border border-[#C9D1D0]/30 hover:border-[#FAF8F2] transition-colors shrink-0 min-h-[34px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{dict.assistant.clearChat}</span>
            </button>
          )}
        </div>
      </div>

      {/* Disabled State if Admin turned off AI Simulation */}
      {!settings.aiSimulationEnabled ? (
        <div className="p-6 text-center space-y-3 flex-1 flex flex-col items-center justify-center bg-[#F3F0E8]/60">
          <Bot className="w-8 h-8 text-[#14263D]/50" />
          <p className="text-sm font-medium text-[#10161F] max-w-md">
            {dict.assistant.disabledNotice}
          </p>
        </div>
      ) : (
        <>
          {/* Quick Actions Bar */}
          <div className="px-4 py-3 bg-[#F3F0E8] border-b border-[#C9D1D0]">
            <p className="text-[11px] font-medium text-[#14263D]/80 mb-2">
              {dict.assistant.quickActionsLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dict.assistant.quickActions.map((promptText) => (
                <button
                  key={promptText}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isTyping}
                  className="text-xs px-2.5 py-1.5 bg-[#FAF8F2] hover:bg-[#14263D] text-[#10161F] hover:text-[#FAF8F2] border border-[#C9D1D0] transition-colors text-start cursor-pointer min-h-[34px]"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[460px] min-h-[300px] bg-[#FAF8F2]"
          >
            {/* Default Welcome Message */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#14263D] text-[#FAF8F2] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7FAEA3]" aria-hidden="true" />
              </div>
              <div className="flex-1 bg-[#F3F0E8] border border-[#C9D1D0] p-3.5 text-sm text-[#10161F] leading-relaxed">
                <p>{dict.assistant.welcomeMessage}</p>
              </div>
            </div>

            {/* Dynamic Messages */}
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-[#DE655A] text-[#FAF8F2]'
                        : 'bg-[#14263D] text-[#FAF8F2]'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#7FAEA3]" aria-hidden="true" />
                    )}
                  </div>

                  <div
                    className={`flex-1 max-w-[88%] p-3.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#14263D] text-[#FAF8F2]'
                        : msg.intent === 'out_of_scope'
                        ? 'bg-[#DE655A]/10 border border-[#DE655A]/40 text-[#10161F]'
                        : 'bg-[#F3F0E8] border border-[#C9D1D0] text-[#10161F]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Embedded Live Quote Card if assistant calculated a valid quote */}
                    {!isUser && msg.quote && msg.quote.isValid && (
                      <div className="mt-3 pt-3 border-t border-[#C9D1D0] bg-[#FAF8F2] p-3 space-y-3">
                        <RouteIndicator direction={msg.quote.direction} compact />

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="block text-[11px] text-[#14263D]/70">
                              {dict.quote.amountSentLabel}
                            </span>
                            <AmountDisplay
                              amount={msg.quote.amountSent}
                              currency={msg.quote.originCurrency}
                              size="md"
                            />
                          </div>
                          <div className="text-end">
                            <span className="block text-[11px] text-[#2C6B5F] font-medium">
                              {dict.quote.estimatedReceivedLabel}
                            </span>
                            <AmountDisplay
                              amount={msg.quote.estimatedReceived}
                              currency={msg.quote.destinationCurrency}
                              size="md"
                              highlight
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-[#14263D]/75 pt-2 border-t border-[#C9D1D0]/60">
                          <span>
                            {dict.quote.feeLabel}: {msg.quote.feeInOrigin}{' '}
                            {msg.quote.originCurrency}
                          </span>
                          <span>1 MRU = {msg.quote.exchangeRate.toFixed(2)} XOF</span>
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
                          className="w-full py-2.5 px-4 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[42px] cursor-pointer"
                        >
                          <span>
                            {language === 'ar'
                              ? 'إنشاء طلب'
                              : dict.assistant.applyQuoteCta}
                          </span>
                          <ArrowDirectional
                            className="w-3.5 h-3.5 text-[#7FAEA3]"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    )}

                    {/* Embedded Tracker CTA if assistant matched a Transfer ID */}
                    {!isUser && msg.trackedTransferId && (
                      <div className="mt-3 pt-2.5 border-t border-[#C9D1D0]">
                        <button
                          type="button"
                          onClick={() => openTrackingForId(msg.trackedTransferId!)}
                          className="w-full py-2 px-3 bg-[#14263D] hover:bg-[#10161F] text-[#FAF8F2] text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors min-h-[40px] cursor-pointer"
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

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 text-xs font-mono text-[#14263D]/75 ps-2"
                >
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#14263D] animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#7FAEA3] animate-bounce [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 bg-[#DE655A] animate-bounce [animation-delay:240ms]" />
                  </span>
                  <span>{dict.assistant.typingLabel}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 sm:p-4 bg-[#F3F0E8] border-t border-[#C9D1D0] flex items-center gap-2"
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
              className="flex-1 bg-[#FAF8F2] border border-[#14263D]/30 px-3.5 py-2.5 text-sm text-[#10161F] placeholder:text-[#14263D]/45 focus:outline-none focus:border-[#14263D] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 bg-[#14263D] hover:bg-[#10161F] disabled:opacity-45 text-[#FAF8F2] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors min-h-[44px] whitespace-nowrap shrink-0 cursor-pointer"
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
