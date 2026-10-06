import { getDictionary } from '@/lib/i18n';
import { calculateTransferQuote, formatCurrencyAmount } from '@/lib/quote-engine';
import {
  AIService,
  AIServiceResponse,
  CorridorSettings,
  Language,
  TransferDirection,
  TransferRequest,
} from '@/types/corridor';

/**
 * Normalizes Arabic-Indic digits (٠-٩) and cleans punctuation for deterministic extraction.
 */
function normalizeDigits(text: string): string {
  const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
  return text.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
}

/**
 * Extracts a Transfer ID if the user mentions SL-XXXXXX-XXXX
 */
function extractTransferId(text: string): string | null {
  const match = text.toUpperCase().match(/SL-\d{6}-[A-Z0-9]{4}/);
  return match ? match[0] : null;
}

/**
 * Extracts numeric amount from natural language
 */
function extractNumericAmount(text: string): number | null {
  const normalized = normalizeDigits(text).replace(/SL-\d{6}-[A-Z0-9]{4}/gi, '');
  // Match numbers with optional thousand separators or decimals
  const matches = normalized.match(/\b\d{1,3}(?:[,\s]\d{3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g);
  if (!matches || matches.length === 0) return null;

  for (const raw of matches) {
    const cleaned = Number(raw.replace(/[,\s]/g, ''));
    if (Number.isFinite(cleaned) && cleaned > 0) {
      return cleaned;
    }
  }
  return null;
}

/**
 * Detects transfer direction from Arabic or French natural phrasing
 */
function detectDirection(text: string): TransferDirection | null {
  const lower = text.toLowerCase();

  // Explicit XOF -> MRU phrases
  const isFromIvoryCoast =
    /من\s*(ساحل العاج|كوت ديفوار|أبيدجان|ابيدجان)/.test(lower) ||
    /إلى\s*(موريتانيا|نواكشوط)/.test(lower) ||
    /الى\s*(موريتانيا|نواكشوط)/.test(lower) ||
    /(de|depuis)\s*(la\s*)?(côte d’ivoire|cote d'ivoire|cote divoire|abidjan)/.test(lower) ||
    /(vers|pour)\s*(la\s*)?(mauritanie|nouakchott)/.test(lower) ||
    /\b(xof|cfa|فرنك|سيفا)\s*(->|→|إلى|الى|vers|to)\s*(mru|أوقية|اوقية|اوقيه)/.test(lower);

  if (isFromIvoryCoast) {
    return 'XOF_TO_MRU';
  }

  // Explicit MRU -> XOF phrases
  const isFromMauritania =
    /من\s*(موريتانيا|نواكشوط)/.test(lower) ||
    /إلى\s*(ساحل العاج|كوت ديفوار|أبيدجان|ابيدجان)/.test(lower) ||
    /الى\s*(ساحل العاج|كوت ديفوار|أبيدجان|ابيدجان)/.test(lower) ||
    /(de|depuis)\s*(la\s*)?(mauritanie|nouakchott)/.test(lower) ||
    /(vers|pour)\s*(la\s*)?(côte d’ivoire|cote d'ivoire|cote divoire|abidjan)/.test(lower);

  if (isFromMauritania) {
    return 'MRU_TO_XOF';
  }

  // Currency mention heuristics when amount is present
  if (/\b(xof|cfa|فرنك|سيفا)\b/i.test(lower) && !/\b(mru|أوقية|اوقية|اوقيه|أوقيه)\b/i.test(lower)) {
    return 'XOF_TO_MRU';
  }

  if (/\b(mru|أوقية|اوقية|اوقيه|أوقيه|ouguiya)\b/i.test(lower)) {
    return 'MRU_TO_XOF';
  }

  return null;
}

/**
 * MockAIService
 * Local deterministic simulation of the SaharaLink financial assistant.
 * Never calls paid external APIs; uses deterministic application quote logic.
 */
export class MockAIService implements AIService {
  public readonly modeLabel = 'Local Simulation — No OpenAI API';

  async processMessage(
    userMessage: string,
    language: Language,
    settings: CorridorSettings,
    existingTransfers: TransferRequest[]
  ): Promise<AIServiceResponse> {
    const dict = getDictionary(language);
    const trimmed = userMessage.trim();
    const lower = normalizeDigits(trimmed).toLowerCase();

    // 1. Check for Transfer ID tracking query
    const transferId = extractTransferId(trimmed);
    if (transferId) {
      const found = existingTransfers.find(
        (t) => t.id.toUpperCase() === transferId.toUpperCase()
      );
      if (found) {
        const statusLabel = dict.tracking.statuses[found.status];
        const replyText =
          language === 'ar'
            ? `وجدت الطلب رقم ${found.id} في المسار.\n• الحالة الحالية: ${statusLabel}\n• المبلغ المرسل: ${formatCurrencyAmount(found.amountSent, found.originCurrency)}\n• المبلغ المقدر للاستلام: ${formatCurrencyAmount(found.estimatedReceived, found.destinationCurrency)}\n• المستفيد: ${found.recipientName} (${found.receivingMethod})${found.rejectionReason ? `\n• ملاحظة الإدارة: ${found.rejectionReason}` : ''}`
            : `Demande ${found.id} localisée dans le corridor.\n• Statut actuel : ${statusLabel}\n• Montant envoyé : ${formatCurrencyAmount(found.amountSent, found.originCurrency)}\n• Montant estimé reçu : ${formatCurrencyAmount(found.estimatedReceived, found.destinationCurrency)}\n• Bénéficiaire : ${found.recipientName} (${found.receivingMethod})${found.rejectionReason ? `\n• Motif : ${found.rejectionReason}` : ''}`;

        return {
          replyText,
          intent: 'track_transfer',
          trackedTransferId: found.id,
        };
      } else {
        const replyText =
          language === 'ar'
            ? `لم أتمكن من العثور على طلب يحمل المعرّف ${transferId}. يرجى التأكد من الرمز أو تجربة أحد المعرّفات المسجلة مثل SL-261002-A7K2.`
            : `Aucune demande trouvée sous l’identifiant ${transferId}. Vérifiez le code ou testez un identifiant actif comme SL-261002-A7K2.`;
        return {
          replyText,
          intent: 'track_transfer',
        };
      }
    }

    // 2. Check for explicit out-of-scope / unrelated trivia (sports, weather, politics, recipes, code, etc.)
    const outOfScopePatterns =
      /(كرة قدم|لاعب|ميسي|رونالدو|طقس|طبخ|وصفة|سياسة|فيلم|أغنية|شعر|برمجة|football|joueur|météo|meteo|recette|film|musique|politique|blague|joke)/i;

    const domainKeywords =
      /(تحويل|حول|أحول|احول|أرسل|ارسل|كم|سعر|صرف|رسوم|عمولة|عموله|أوقية|اوقية|اوقيه|فرنك|سيفا|موريتانيا|نواكشوط|ساحل العاج|كوت ديفوار|أبيدجان|ابيدجان|طلب|تتبع|وصل|إيصال|بنكيلي|مصرفي|أورانج|اورانج|ويف|mru|xof|cfa|transfer|transférer|transferer|envoyer|combien|taux|frais|commission|mauritanie|nouakchott|côte d’ivoire|cote d'ivoire|abidjan|suivi|suivre|reçu|recu|wave|orange|mtn|bankily|masrivi)/i;

    const amount = extractNumericAmount(trimmed);
    const detectedDirection = detectDirection(trimmed);

    if (outOfScopePatterns.test(lower) || (!domainKeywords.test(lower) && amount === null && !/^(مرحبا|أهلا|اهلا|السلام عليكم|سلام|bonjour|salut|hello|bonsoir)$/i.test(lower))) {
      return {
        replyText: dict.assistant.outOfScopeReply,
        intent: 'out_of_scope',
      };
    }

    // 3. Greeting
    if (/^(مرحبا|أهلا|اهلا|السلام عليكم|سلام|bonjour|salut|hello|bonsoir)$/i.test(lower)) {
      return {
        replyText: dict.assistant.welcomeMessage,
        intent: 'greeting',
      };
    }

    // 4. Amount + Quote Calculation
    if (amount !== null) {
      const direction: TransferDirection = detectedDirection || 'MRU_TO_XOF';
      const quote = calculateTransferQuote(amount, direction, settings);

      if (!quote.isValid) {
        let errorExplanation = '';
        if (quote.validationError === 'below_min') {
          errorExplanation =
            language === 'ar'
              ? `المبلغ المدخل (${formatCurrencyAmount(amount, quote.originCurrency)}) أقل من الحد الأدنى المحدد حالياً في المسار وهو ${formatCurrencyAmount(quote.minAllowedInOrigin, quote.originCurrency)}.`
              : `Le montant saisi (${formatCurrencyAmount(amount, quote.originCurrency)}) est inférieur au minimum autorisé de ${formatCurrencyAmount(quote.minAllowedInOrigin, quote.originCurrency)}.`;
        } else if (quote.validationError === 'above_max') {
          errorExplanation =
            language === 'ar'
              ? `المبلغ المدخل يتجاوز الحد الأقصى المسموح به للطلب الواحد (${formatCurrencyAmount(quote.maxAllowedInOrigin, quote.originCurrency)}).`
              : `Le montant dépasse le plafond autorisé par transaction (${formatCurrencyAmount(quote.maxAllowedInOrigin, quote.originCurrency)}).`;
        } else {
          errorExplanation =
            language === 'ar'
              ? `يجب أن يكون المبلغ أكبر من قيمة الرسوم الثابتة (${formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}).`
              : `Le montant doit être supérieur aux frais fixes (${formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}).`;
        }

        return {
          replyText: errorExplanation,
          intent: 'quote_calculation',
          quote,
          suggestedDirection: direction,
          suggestedAmount: quote.minAllowedInOrigin,
        };
      }

      const replyText =
        language === 'ar'
          ? `حساب التحويل لمبلغ ${formatCurrencyAmount(quote.amountSent, quote.originCurrency)} (${direction === 'MRU_TO_XOF' ? 'من موريتانيا إلى ساحل العاج' : 'من ساحل العاج إلى موريتانيا'}):\n• سعر الصرف: 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• الرسوم الثابتة: ${formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}\n• المبلغ الصافي المحوّل: ${formatCurrencyAmount(quote.netConvertibleAmount, quote.originCurrency)}\n• المبلغ المقدر للاستلام: ${formatCurrencyAmount(quote.estimatedReceived, quote.destinationCurrency)}\n\nيمكنك الضغط على الزر أدناه لإنشاء الطلب مباشرة بهذا المبلغ.`
          : `Calcul pour ${formatCurrencyAmount(quote.amountSent, quote.originCurrency)} (${direction === 'MRU_TO_XOF' ? 'Mauritanie → Côte d’Ivoire' : 'Côte d’Ivoire → Mauritanie'}) :\n• Taux appliqué : 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• Frais fixes : ${formatCurrencyAmount(quote.feeInOrigin, quote.originCurrency)}\n• Montant net converti : ${formatCurrencyAmount(quote.netConvertibleAmount, quote.originCurrency)}\n• Montant estimé à recevoir : ${formatCurrencyAmount(quote.estimatedReceived, quote.destinationCurrency)}\n\nCliquez ci-dessous pour pré-remplir votre demande avec ce calcul.`;

      return {
        replyText,
        intent: 'quote_calculation',
        quote,
        suggestedDirection: direction,
        suggestedAmount: quote.amountSent,
      };
    }

    // 5. Fee inquiry
    if (/(رسوم|عمولة|عموله|تكلفة|تكلفه|frais|commission|tarif|coût|cout)/i.test(lower)) {
      const xofFee = Math.round(settings.fixedFeeMru * settings.exchangeRateMruToXof);
      const replyText =
        language === 'ar'
          ? `الرسوم في SaharaLink ثابتة وواضحة قبل الإرسال:\n• عند التحويل من موريتانيا (MRU → XOF): رسوم ثابتة قدرها ${settings.fixedFeeMru} MRU فقط.\n• عند التحويل من ساحل العاج (XOF → MRU): ما يعادلها (${xofFee} XOF).\n• الحد الأدنى للتحويل: ${settings.minTransferMru} MRU والحد الأقصى: ${settings.maxTransferMru.toLocaleString('en-US')} MRU.`
          : `Les frais SaharaLink sont fixes et transparents avant tout envoi :\n• Sens Mauritanie (MRU → XOF) : forfait fixe de ${settings.fixedFeeMru} MRU.\n• Sens Côte d’Ivoire (XOF → MRU) : équivalent de ${xofFee} XOF.\n• Plage autorisée : de ${settings.minTransferMru} MRU à ${settings.maxTransferMru.toLocaleString('en-US')} MRU.`;

      return {
        replyText,
        intent: 'fee_inquiry',
      };
    }

    // 6. Exchange rate inquiry
    if (/(سعر|صرف|تبديل|كم يساوي|taux|change|combien vaut)/i.test(lower)) {
      const inverse1000 = ((1000 / settings.exchangeRateMruToXof)).toFixed(2);
      const replyText =
        language === 'ar'
          ? `سعر الصرف المحدد حالياً في المسار:\n• 1 أوقية موريتانية (MRU) = ${settings.exchangeRateMruToXof.toFixed(2)} فرنك غرب أفريقي (XOF)\n• 1,000 فرنك (XOF) = ${inverse1000} أوقية (MRU)\n\nاكتب أي مبلغ (مثلاً: "حول 2500 أوقية") وسأحسب لك الصافي فوراً.`
          : `Taux de change actuellement actif dans le corridor :\n• 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• 1 000 XOF = ${inverse1000} MRU\n\nIndiquez un montant (ex : "Convertir 2500 MRU") pour obtenir le décompte exact.`;

      return {
        replyText,
        intent: 'rate_inquiry',
      };
    }

    // 7. Direction inquiry (e.g., "أريد تحويل من ساحل العاج إلى موريتانيا")
    if (detectedDirection) {
      const sampleAmount = detectedDirection === 'XOF_TO_MRU' ? 50000 : 2500;
      const sampleQuote = calculateTransferQuote(sampleAmount, detectedDirection, settings);

      const replyText =
        detectedDirection === 'XOF_TO_MRU'
          ? language === 'ar'
            ? `تم ضبط المسار من ساحل العاج (XOF) إلى موريتانيا (MRU).\n• سعر الصرف: 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• وسائل الاستلام المتاحة في موريتانيا: Bankily، Masrivi.\n\nمثال توضيحي لمبلغ 50,000 XOF يظهر أدناه. اكتب المبلغ الذي ترغب في تحويله أو اضغط لبدء الطلب:`
            : `Sens configuré : Côte d’Ivoire (XOF) → Mauritanie (MRU).\n• Taux : 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• Réception en Mauritanie via Bankily ou Masrivi.\n\nVoici une simulation pour 50 000 XOF ci-dessous :`
          : language === 'ar'
          ? `تم ضبط المسار من موريتانيا (MRU) إلى ساحل العاج (XOF).\n• سعر الصرف: 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• وسائل الاستلام المتاحة في ساحل العاج: Orange Money، Wave، MTN Money.\n\nإليك حساباً جاهزاً لمبلغ 2,500 MRU:`
          : `Sens configuré : Mauritanie (MRU) → Côte d’Ivoire (XOF).\n• Taux : 1 MRU = ${settings.exchangeRateMruToXof.toFixed(2)} XOF\n• Réception via Orange Money, Wave ou MTN Money.\n\nSimulation pour 2 500 MRU :`;

      return {
        replyText,
        intent: 'direction_inquiry',
        quote: sampleQuote,
        suggestedDirection: detectedDirection,
        suggestedAmount: sampleAmount,
      };
    }

    // 8. Tracking guidance
    if (/(تتبع|متابعة|حالة|أين طلبي|اين طلبي|suivi|suivre|statut|où en est)/i.test(lower)) {
      const replyText =
        language === 'ar'
          ? `لتتبع طلبك، يمكنك كتابة معرّف التحويل هنا مباشرة (مثل SL-261002-A7K2) أو الانتقال إلى قسم "تتبع الطلب" في الأعلى لمعاينة مسار الطلب والجدول الزمني الكامل.`
          : `Pour suivre une demande, saisissez directement votre Transfer ID ici (ex : SL-261002-A7K2) ou ouvrez l’onglet "Suivi" pour visualiser la chronologie complète.`;

      return {
        replyText,
        intent: 'track_transfer',
      };
    }

    // 9. General transfer guidance
    const defaultQuote = calculateTransferQuote(2500, 'MRU_TO_XOF', settings);
    const replyText =
      language === 'ar'
        ? `يمكنني حساب أي مبلغ بين الأوقية الموريتانية (MRU) والفرنك الغرب أفريقي (XOF) وتجهيز طلبك في 4 خطوات واضحة. إليك مثالاً لمبلغ 2,500 MRU:`
        : `Je peux calculer tout montant entre l’Ouguiya (MRU) et le Franc CFA (XOF) et préparer votre demande en 4 étapes. Voici un exemple pour 2 500 MRU :`;

    return {
      replyText,
      intent: 'create_guide',
      quote: defaultQuote,
      suggestedDirection: 'MRU_TO_XOF',
      suggestedAmount: 2500,
    };
  }
}

/**
 * FutureOpenAIService
 * Production adapter placeholder so the UI never changes when switching to server-side OpenAI API.
 */
export class FutureOpenAIService implements AIService {
  public readonly modeLabel = 'OpenAI API Adapter (Server-Side Proxy)';

  async processMessage(
    userMessage: string,
    language: Language,
    settings: CorridorSettings,
    existingTransfers: TransferRequest[]
  ): Promise<AIServiceResponse> {
    throw new Error(
      `FutureOpenAIService requires server-side OPENAI_API_KEY configuration (lang=${language}, rate=${settings.exchangeRateMruToXof}, transfers=${existingTransfers.length}, len=${userMessage.length}).`
    );
  }
}

export const aiService: AIService = new MockAIService();
