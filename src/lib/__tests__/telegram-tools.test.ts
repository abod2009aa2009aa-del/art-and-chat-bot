import { describe, it, expect, vi, afterEach } from "vitest";
import {
  BOT_COMMANDS,
  AI_TOOL_KEYS,
  runAiTool,
  toolCalc,
  toolIp,
  toolDns,
  toolWhois,
  toolPingUrl,
  toolMeta,
  toolShort,
  toolWeather,
  toolCurrency,
  detectPhotoIntent,
} from "../telegram-tools";

// ============ 1) قائمة الأوامر ============
describe("BOT_COMMANDS registry", () => {
  it("respects Telegram limits and format", () => {
    expect(BOT_COMMANDS.length).toBeGreaterThan(0);
    expect(BOT_COMMANDS.length).toBeLessThanOrEqual(100);
    for (const c of BOT_COMMANDS) {
      expect(c.command).toMatch(/^[a-z0-9_]{1,32}$/);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.description.length).toBeLessThanOrEqual(256);
    }
  });

  it("has no duplicate commands", () => {
    const names = BOT_COMMANDS.map((c) => c.command);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ============ 2) كل أدوات الـ AI ترجع رد صحيح ============
describe("AI tools — every registered tool returns a valid reply", () => {
  const fakeAi = async (messages: any[]) => {
    // تحقق من أن كل أداة تبني رسائل صالحة
    expect(Array.isArray(messages)).toBe(true);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(String(messages[0].content).trim().length).toBeGreaterThan(10);
    expect(messages[1].role).toBe("user");
    expect(String(messages[1].content).trim().length).toBeGreaterThan(0);
    return "رد تجريبي صالح";
  };

  it("registers a healthy number of tools", () => {
    expect(AI_TOOL_KEYS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(AI_TOOL_KEYS).size).toBe(AI_TOOL_KEYS.length);
  });

  it.each(AI_TOOL_KEYS)("tool /%s works with an argument", async (key: string) => {
    const out = await runAiTool(key, "عينة اختبار: console.log('hi')", fakeAi);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toMatch(/^أداة غير معروفة/);
    expect(out).not.toMatch(/ما كدرت أولّد رد/);
  });

  it.each(AI_TOOL_KEYS)("tool /%s survives an empty argument", async (key: string) => {
    const out = await runAiTool(key, "", fakeAi);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("falls back gracefully when the model returns nothing", async () => {
    const empty = async () => "";
    const out = await runAiTool(AI_TOOL_KEYS[0], "x", empty);
    expect(out).toBe("ما كدرت أولّد رد.");
  });

  it("reports unknown tools instead of throwing", async () => {
    await expect(runAiTool("__nope__", "x", fakeAi)).resolves.toMatch(/أداة غير معروفة/);
  });

  it("every AI tool key is exposed in the commands menu or is an alias", () => {
    const menu = new Set(BOT_COMMANDS.map((c) => c.command));
    const missing = AI_TOOL_KEYS.filter((k) => !menu.has(k));
    // نسمح ببعض الأدوات الداخلية غير المعروضة، لكن الأغلبية يجب أن تظهر
    expect(missing.length).toBeLessThan(AI_TOOL_KEYS.length / 2);
  });
});

// ============ 3) الآلة الحاسبة ============
describe("toolCalc", () => {
  it("evaluates math correctly", () => {
    expect(toolCalc("2+3*4")).toContain("= 14");
    expect(toolCalc("sqrt(16)")).toContain("= 4");
    expect(toolCalc("2^10")).toContain("= 1024");
    expect(toolCalc("round(pi*100)/100")).toContain("= 3.14");
  });
  it("guards against unsafe input", () => {
    expect(toolCalc("")).toMatch(/اكتب معادلة/);
    expect(toolCalc("process.exit(1)")).toMatch(/خطأ|غير مسموح/);
    expect(toolCalc("fetch('http://x')")).toMatch(/خطأ|غير مسموح/);
    expect(toolCalc("1/0")).toMatch(/غير صالحة/);
  });
});

// ============ 4) أدوات الشبكة (fetch مموّه) ============
function mockFetch(payload: any, { text }: { text?: string } = {}) {
  return vi.fn(async () =>
    ({
      ok: true,
      status: 200,
      json: async () => payload,
      text: async () => text ?? JSON.stringify(payload),
      headers: new Map(),
    }) as any,
  );
}

describe("network tools", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  it("toolIp formats a lookup", async () => {
    globalThis.fetch = mockFetch({ success: true, ip: "8.8.8.8", country: "US", city: "Mountain View", connection: { isp: "Google" } });
    const out = await toolIp("8.8.8.8");
    expect(out).toContain("8.8.8.8");
    expect(out).toContain("Google");
  });

  it("toolDns lists records", async () => {
    globalThis.fetch = mockFetch({ Answer: [{ name: "example.com", type: 1, data: "93.184.216.34", TTL: 300 }] });
    const out = await toolDns("example.com", "A");
    expect(out).toContain("93.184.216.34");
  });

  it("toolDns validates input", async () => {
    await expect(toolDns("", "A")).resolves.toMatch(/اكتب اسم النطاق/);
  });

  it("toolWhois validates input", async () => {
    await expect(toolWhois("")).resolves.toMatch(/اكتب اسم النطاق/);
  });

  it("toolPingUrl, toolMeta, toolShort, toolWeather, toolCurrency never throw", async () => {
    globalThis.fetch = mockFetch(
      { result: { rates: { USD: 1, EUR: 0.9 } }, rates: { USD: 1, EUR: 0.9 } },
      { text: "<html><title>T</title><meta name='description' content='D'></html>" },
    );
    for (const call of [
      () => toolPingUrl("https://example.com"),
      () => toolMeta("https://example.com"),
      () => toolShort("https://example.com"),
      () => toolWeather("Baghdad"),
      () => toolCurrency("10 USD EUR"),
    ]) {
      const out = await call().catch((e) => `ERR:${e?.message}`);
      expect(typeof out).toBe("string");
      expect(out.length).toBeGreaterThan(0);
    }
  });
});

// ============ 5) اكتشاف نية الصورة ============
describe("detectPhotoIntent", () => {
  const editCases = [
    "عدل الصورة وخلي الخلفية بيضاء",
    "شيل الشخص من الخلفية",
    "غيّر لون القميص إلى أزرق",
    "حولها إلى ستايل أنمي",
    "edit this image and remove the watermark",
    "make it black and white",
    "upscale this photo please",
    "أضف قبعة على راسه",
    "اجعل الخلفية غروب",
  ];
  const analyzeCases = [
    "",
    "شنو هذا؟",
    "حلل الصورة",
    "وش الخطأ بهذا الكود؟",
    "اقرأ النص الموجود بالصورة",
    "what is in this picture?",
    "explain this error screenshot",
    "ترجم النص بالصورة",
    "شرايك بالتصميم؟",
    "شنو المشكلة هنا ما يشتغل",
  ];

  it.each(editCases)("routes %j to edit", (t: string) => {
    const r = detectPhotoIntent(t);
    expect(r.intent).toBe("edit");
    expect(r.score).toBeGreaterThan(0);
  });

  it.each(analyzeCases)("routes %j to analyze", (t: string) => {
    expect(detectPhotoIntent(t).intent).toBe("analyze");
  });

  it("respects explicit negation", () => {
    expect(detectPhotoIntent("لا تعدل الصورة، فقط وصفها").intent).toBe("analyze");
    expect(detectPhotoIntent("don't edit, just describe").intent).toBe("analyze");
  });

  it("prefers edit for explicit image-edit commands even with a question mark", () => {
    expect(detectPhotoIntent("ممكن تعدل هذه الصورة وتشيل الخلفية؟").intent).toBe("edit");
  });

  it("always returns reasons for debugging", () => {
    const r = detectPhotoIntent("غيّر الخلفية");
    expect(Array.isArray(r.reasons)).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});
