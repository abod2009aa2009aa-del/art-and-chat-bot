export type TelegramIntentContext = {
  isGroup: boolean;
  isAddressed?: boolean;
  hasReplyTarget: boolean;
  hasPhoto: boolean;
  hasDocument: boolean;
};

export type TelegramIntent =
  | "stats"
  | "moderation"
  | "ping"
  | "image_generation"
  | "file_generation"
  | "file_edit"
  | "image_to_code"
  | "search"
  | "ai_tool"
  | "none";

export type TelegramIntentDecision = {
  intent: TelegramIntent;
  command: string | null;
  confidence: "high" | "medium" | "none";
  reason: string;
};

type Rule = {
  intent: TelegramIntent;
  command: string;
  pattern: RegExp;
  confidence: "high" | "medium";
  reason: string;
  allowed?: (context: TelegramIntentContext) => boolean;
};

const rules: Rule[] = [
  {
    intent: "stats",
    command: "stats",
    pattern: /(?:احصائيات|إحصائيات|عدد\s+(?:الملفات|السطور)|كم\s+سطر|إحصاء).*(?:كود|مشروع|ملف|سطور)?|(?:ورّني|اعرض|أريد)\s+(?:إحصائيات|إحصاء)/iu,
    confidence: "high",
    reason: "طلب إحصائيات المصدر",
  },
  {
    intent: "moderation",
    command: "kick",
    pattern: /(?:اطرد|طرد|شيل|أخرج|اخرج)\s+(?:هذا\s+)?(?:العضو|المستخدم|الشخص)|(?:أريد|اريد)\s+طرد/i,
    confidence: "high",
    reason: "طلب طرد عضو",
    allowed: ({ isGroup }) => isGroup,
  },
  {
    intent: "moderation",
    command: "ban",
    pattern: /(?:احظر|حظر|منع|امنع)\s+(?:هذا\s+)?(?:العضو|المستخدم|الشخص)|(?:أريد|اريد)\s+حظر/i,
    confidence: "high",
    reason: "طلب حظر عضو",
    allowed: ({ isGroup }) => isGroup,
  },
  {
    intent: "moderation",
    command: "mute",
    pattern: /(?:اكتم|كتم)\s+(?:هذا\s+)?(?:العضو|المستخدم|الشخص)|(?:أريد|اريد)\s+كتم/i,
    confidence: "high",
    reason: "طلب كتم عضو",
    allowed: ({ isGroup }) => isGroup,
  },
  {
    intent: "moderation",
    command: "unmute",
    pattern: /(?:فك|ارفع)\s+(?:الكتم|التقييد)|(?:اسمح|أعد)\s+له\s+بالكلام/i,
    confidence: "high",
    reason: "طلب فك كتم عضو",
    allowed: ({ isGroup }) => isGroup,
  },
  {
    intent: "moderation",
    command: "unban",
    pattern: /(?:فك|ارفع)\s+(?:الحظر|المنع)|(?:اسمح|أعد)\s+للعضو\s+بالدخول/i,
    confidence: "high",
    reason: "طلب رفع حظر عضو",
    allowed: ({ isGroup }) => isGroup,
  },
  {
    intent: "ping",
    command: "ping",
    pattern: /^(?:هل\s+أنت\s+متصل|هل\s+البوت\s+شغال|اختبر\s+(?:الاتصال|الاتصال\s+بالبوت)|افحص\s+الاتصال|طمني\s+عن\s+الاتصال|are\s+you\s+online|test\s+(?:the\s+)?connection)\s*[؟?!.]*$/iu,
    confidence: "high",
    reason: "طلب اختبار اتصال البوت",
  },
  {
    intent: "image_generation",
    command: "img",
    pattern: /^(?:أنشئ|انشئ|ولّد|ولد|ارسم|صمّم|صمم|سوي|اعمل|اصنع)\s+(?:لي\s+)?(?:صورة|رسمة|لوحة)|^(?:generate|create|draw)\s+(?:an?\s+)?image\b/i,
    confidence: "high",
    reason: "طلب توليد صورة",
  },
  {
    intent: "file_edit",
    command: "edit",
    pattern: /(?:عدّل|عدل|غيّر|غير|أصلح|اصلح|حدّث|حدث)\s+(?:هذا\s+)?(?:الملف|الكود|السكربت)|(?:صحح|صحّح)\s+(?:محتوى|ملف)/iu,
    confidence: "high",
    reason: "طلب تعديل ملف أو كود",
    allowed: ({ hasDocument, hasReplyTarget }) => hasDocument || hasReplyTarget,
  },
  {
    intent: "file_generation",
    command: "file",
    pattern: /(?:أنشئ|انشئ|ولّد|ولد|اكتب|سوي|اعمل)\s+(?:لي\s+)?(?:ملف|سكربت|برنامج)|(?:create|generate|write)\s+(?:a\s+)?(?:file|script|program)\b/i,
    confidence: "high",
    reason: "طلب توليد ملف أو سكربت",
  },
  {
    intent: "image_to_code",
    command: "code",
    pattern: /(?:حوّل|حول|حوّلي|حولّي|استخرج)\s+(?:هذه\s+)?(?:الصورة|الواجهة|التصميم)\s+(?:إلى|الى|لـ)\s*(?:كود|شفرة)|(?:turn|convert)\s+(?:this\s+)?(?:image|screenshot|design)\s+into\s+code/i,
    confidence: "high",
    reason: "طلب تحويل صورة أو واجهة إلى كود",
    allowed: ({ hasPhoto, hasReplyTarget }) => hasPhoto || hasReplyTarget,
  },
  {
    intent: "search",
    command: "search",
    pattern: /(?:ابحث|بحث|دور|دوّر|هات\s+آخر|ما\s+هو\s+أحدث|أحدث\s+إصدار|من\s+الإنترنت|من\s+الويب)|\b(search|look\s+up|latest\s+version|from\s+the\s+web)\b/i,
    confidence: "medium",
    reason: "طلب بحث أو معلومة حديثة من الويب",
  },
  {
    intent: "ai_tool",
    command: "explain",
    pattern: /(?:اشرح|فسّر|فسر)\s+(?:لي\s+)?(?:هذا\s+)?(?:الكود|السكربت|البرنامج)|\bexplain\s+(?:this\s+)?code\b/i,
    confidence: "high",
    reason: "طلب شرح كود",
  },
  {
    intent: "ai_tool",
    command: "debug",
    pattern: /(?:اكتشف|شخّص|شخص|حلّل|حلل)\s+(?:سبب\s+)?(?:الخطأ|المشكلة)|(?:ليش|لماذا|ليش)\s+(?:هذا\s+)?(?:الكود|البرنامج)\s+ما\s+يشتغل|\bdebug\s+(?:this\s+)?code\b/i,
    confidence: "high",
    reason: "طلب اكتشاف خطأ أو مشكلة برمجية",
  },
  {
    intent: "ai_tool",
    command: "optimize",
    pattern: /(?:حسّن|حسن|سرّع|سرع)\s+(?:أداء\s+)?(?:هذا\s+)?(?:الكود|البرنامج)|(?:قلّل|قلل)\s+استهلاك|\boptimi[sz]e\s+(?:this\s+)?code\b/i,
    confidence: "high",
    reason: "طلب تحسين كود أو أداء",
  },
  {
    intent: "ai_tool",
    command: "doc",
    pattern: /(?:ولّد|ولد|اكتب|أنشئ|انشئ)\s+(?:توثيق|documentation)|(?:وثّق|وثق)\s+(?:هذا\s+)?(?:الكود|المشروع)|\bdocument\s+(?:this\s+)?code\b/i,
    confidence: "high",
    reason: "طلب توليد توثيق",
  },
  {
    intent: "ai_tool",
    command: "translate",
    pattern: /(?:ترجم|ترجمة)\s+(?:هذا|النص|الكلام)?|\btranslate\b/i,
    confidence: "high",
    reason: "طلب ترجمة",
  },
  {
    intent: "ai_tool",
    command: "rewrite",
    pattern: /(?:أعد|اعد)\s+(?:صياغة|كتابة)|(?:صغ|صيّغ)\s+هذا\s+النص|\brewrite\b/i,
    confidence: "high",
    reason: "طلب إعادة صياغة",
  },
  {
    intent: "ai_tool",
    command: "grammar",
    pattern: /(?:دقّق|دقق|صحّح|صحح)\s+(?:إملائي|نحوي|هذا\s+النص)|\b(grammar|proofread)\b/i,
    confidence: "high",
    reason: "طلب تدقيق لغوي",
  },
  {
    intent: "ai_tool",
    command: "tests",
    pattern: /(?:اكتب|ولّد|ولد)\s+(?:اختبارات|tests)|(?:اختبر|اختبارات)\s+(?:هذا\s+)?(?:الكود|المشروع)|\bunit\s+tests?\b/i,
    confidence: "high",
    reason: "طلب اختبارات برمجية",
  },
  {
    intent: "ai_tool",
    command: "sql",
    pattern: /(?:اكتب|أنشئ|انشئ|ولّد|ولد)\s+(?:استعلام|استعلامات)\s+SQL|\bSQL\b.*(?:استعلام|query)/i,
    confidence: "high",
    reason: "طلب SQL",
  },
  {
    intent: "ai_tool",
    command: "json2sql",
    pattern: /(?:حوّل|حول)\s+(?:هذا\s+)?JSON\s+(?:إلى|الى)\s+SQL|\bJSON\s+to\s+SQL\b/i,
    confidence: "high",
    reason: "طلب تحويل JSON إلى SQL",
  },
  {
    intent: "ai_tool",
    command: "compare",
    pattern: /(?:قارن|مقارنة)\s+بين|\bcompare\b/i,
    confidence: "high",
    reason: "طلب مقارنة",
  },
  {
    intent: "ai_tool",
    command: "ideas",
    pattern: /(?:أعطني|اعطني|ولّد|ولد)\s+(?:أفكار|افكار)|(?:عصف\s+ذهني)|\bbrainstorm\b/i,
    confidence: "high",
    reason: "طلب عصف ذهني",
  },
  {
    intent: "ai_tool",
    command: "email",
    pattern: /(?:اكتب|صغ)\s+(?:لي\s+)?(?:إيميل|ايميل|بريد\s+إلكتروني|بريد\s+الكتروني)|\bemail\b/i,
    confidence: "high",
    reason: "طلب صياغة بريد إلكتروني",
  },
  {
    intent: "ai_tool",
    command: "tasks",
    pattern: /(?:نظّم|نظم|رتّب|رتب)\s+(?:لي\s+)?(?:المهام|مهامي)|(?:جدول|خطة)\s+مهام|\btask\s+plan\b/i,
    confidence: "high",
    reason: "طلب تنظيم مهام",
  },
  {
    intent: "ai_tool",
    command: "simplify",
    pattern: /(?:بسّط|بسط|اشرح\s+ببساطة)|\bsimplify\b/i,
    confidence: "high",
    reason: "طلب تبسيط شرح",
  },
  {
    intent: "ai_tool",
    command: "keywords",
    pattern: /(?:استخرج|طلع)\s+(?:الكلمات\s+المفتاحية|كلمات\s+مفتاحية)|\bkeywords\b/i,
    confidence: "high",
    reason: "طلب استخراج كلمات مفتاحية",
  },
];

export function routeTelegramIntent(
  text: string,
  context: TelegramIntentContext,
): TelegramIntentDecision {
  const normalized = text.trim();
  if (!normalized || normalized.startsWith("/")) {
    return { intent: "none", command: null, confidence: "none", reason: "رسالة فارغة أو أمر صريح" };
  }
  if (context.isGroup && !context.isAddressed) {
    return { intent: "none", command: null, confidence: "none", reason: "رسالة مجموعة غير موجهة للبوت" };
  }
  const match = rules.find((rule) => rule.pattern.test(normalized) && (!rule.allowed || rule.allowed(context)));
  if (!match) return { intent: "none", command: null, confidence: "none", reason: "لا توجد نية عالية الثقة" };
  return { intent: match.intent, command: `/${match.command} ${normalized}`.trim(), confidence: match.confidence, reason: match.reason };
}
