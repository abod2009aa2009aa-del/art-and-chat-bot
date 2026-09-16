export const CAPABILITIES = [
  "general_engineering",
  "python",
  "python_mobile",
  "android",
  "termux",
  "linux",
  "web",
  "api",
  "database",
  "devops",
  "git",
  "debugging",
  "research",
  "code_review",
  "testing",
  "file_generation",
  "cybersecurity",
  "security_lab",
  "exam",
  "reporting",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export type CapabilityInput = {
  text: string;
  hasImage?: boolean;
  fileNames?: string[];
  projectTechnology?: string | null;
  examMode?: boolean;
};

export type CapabilityPlan = {
  requiredCapabilities: Capability[];
  steps: Array<{ capability: Capability; reason: string }>;
  researchRequired: boolean;
  validationRequired: boolean;
  testingRequired: boolean;
};

const rules: Array<{ capability: Capability; pattern: RegExp; reason: string }> = [
  {
    capability: "python",
    pattern: /python|بايثون|pytest|fastapi|django|flask|pip|pyproject|requirements/i,
    reason: "طلب Python أو إحدى أدواته",
  },
  {
    capability: "python_mobile",
    pattern:
      /kivy|kivymd|beeware|toga|chaquopy|python.{0,20}(android|موبايل|هاتف)|بايثون.{0,20}(اندرويد|موبايل)/i,
    reason: "طلب Python على الهاتف",
  },
  {
    capability: "android",
    pattern: /android|اندرويد|gradle|apk|aab|manifest|موبايل|هاتف/i,
    reason: "طلب Android أو مكونات بنائه",
  },
  {
    capability: "termux",
    pattern: /termux|pkg install|termux-api|proot/i,
    reason: "طلب متعلق ببيئة Termux",
  },
  {
    capability: "linux",
    pattern: /linux|ubuntu|debian|bash|shell|systemctl|journalctl|permissions|صلاحيات النظام/i,
    reason: "طلب متعلق بنظام Linux أو Shell",
  },
  {
    capability: "web",
    pattern: /html|css|javascript|typescript|react|vite|frontend|موقع|واجهة/i,
    reason: "طلب Web أو واجهة",
  },
  {
    capability: "api",
    pattern: /api|rest|graphql|webhook|http|https|oauth|jwt|endpoint|واجهة برمجية/i,
    reason: "طلب API أو HTTP",
  },
  {
    capability: "database",
    pattern: /sql|postgres|supabase|sqlite|redis|database|قاعدة بيانات|migration|schema/i,
    reason: "طلب قاعدة بيانات",
  },
  {
    capability: "devops",
    pattern: /docker|ci\/cd|github actions|deploy|deployment|nginx|cloudflare|devops|نشر/i,
    reason: "طلب تشغيل أو نشر",
  },
  {
    capability: "git",
    pattern: /git|github|pull request|commit|branch|repository|مستودع/i,
    reason: "طلب Git أو GitHub",
  },
  {
    capability: "debugging",
    pattern: /debug|error|exception|traceback|bug|fix|صلح|خطأ|مشكلة|ما يشتغل|لا يعمل/i,
    reason: "وجود خطأ أو طلب إصلاح",
  },
  {
    capability: "research",
    pattern: /ابحث|بحث|أحدث|اخر|latest|documentation|توثيق|release|version|إصدار/i,
    reason: "المعلومة قد تحتاج بحثًا حديثًا",
  },
  {
    capability: "code_review",
    pattern: /review|audit|راجع|حلل الكود|فحص الكود|security review|مراجعة/i,
    reason: "طلب مراجعة أو تدقيق",
  },
  {
    capability: "testing",
    pattern: /test|tests|pytest|unittest|coverage|اختبر|اختبارات|فحوصات/i,
    reason: "طلب اختبار أو تحقق",
  },
  {
    capability: "file_generation",
    pattern: /file|ملف|أنشئ|سوي|اكتب|generate|create|عدّل|تعديل/i,
    reason: "طلب إنشاء أو تعديل ملف",
  },
  {
    capability: "cybersecurity",
    pattern: /security|cyber|vulnerability|ثغرة|أمني|اختراق|هجوم|cve|headers|xss|sql injection/i,
    reason: "طلب تحليل أمني",
  },
  {
    capability: "security_lab",
    pattern: /lab|مختبر|staging|ctf|تجريبي|authorized|مصرح/i,
    reason: "طلب أمني داخل مختبر أو نطاق مصرح",
  },
  {
    capability: "exam",
    pattern: /exam|امتحان|اختبار أكاديمي|exam_mode|هدف الامتحان/i,
    reason: "طلب ضمن سياق امتحان",
  },
  {
    capability: "reporting",
    pattern: /report|تقرير|finding|نتيجة|evidence|دليل|remediation|معالجة/i,
    reason: "طلب تقرير أو توثيق نتيجة",
  },
];

function addCapability(out: Capability[], capability: Capability) {
  if (!out.includes(capability)) out.push(capability);
}

export function routeCapabilities(input: CapabilityInput): CapabilityPlan {
  const text = [input.text, input.projectTechnology ?? "", ...(input.fileNames ?? [])]
    .join(" ")
    .trim();
  const capabilities: Capability[] = [];
  const steps: Array<{ capability: Capability; reason: string }> = [];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      addCapability(capabilities, rule.capability);
      steps.push({ capability: rule.capability, reason: rule.reason });
    }
  }

  if (input.hasImage) {
    addCapability(capabilities, "general_engineering");
    steps.push({ capability: "general_engineering", reason: "تحليل صورة أو Screenshot ضمن الطلب" });
  }
  if (input.examMode) {
    addCapability(capabilities, "exam");
    steps.push({ capability: "exam", reason: "وضع الامتحان مفعّل في السياق" });
  }
  if (!capabilities.length) {
    capabilities.push("general_engineering");
    steps.push({ capability: "general_engineering", reason: "طلب عام يحتاج فهمًا هندسيًا" });
  }

  const researchRequired =
    capabilities.includes("research") || /حالياً|اليوم|current|now/i.test(text);
  const validationRequired = capabilities.some((capability) =>
    ["file_generation", "debugging", "code_review", "cybersecurity"].includes(capability),
  );
  const testingRequired =
    capabilities.includes("testing") ||
    capabilities.includes("debugging") ||
    capabilities.includes("file_generation");

  return {
    requiredCapabilities: capabilities,
    steps,
    researchRequired,
    validationRequired,
    testingRequired,
  };
}

export function formatCapabilityPlan(plan: CapabilityPlan): string {
  return [
    `القدرات المطلوبة: ${plan.requiredCapabilities.join(", ")}`,
    `البحث الحي: ${plan.researchRequired ? "مطلوب" : "غير مطلوب"}`,
    `التحقق: ${plan.validationRequired ? "مطلوب" : "حسب النتيجة"}`,
    `الاختبار: ${plan.testingRequired ? "مطلوب" : "حسب النتيجة"}`,
  ].join("\n");
}
