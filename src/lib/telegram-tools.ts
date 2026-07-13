// Tool registry for أليسا — Telegram bot
// Each tool is small, isolated, and wrapped in try/catch by the dispatcher.
// AI-backed tools take an `aiChat` callable from the webhook (dependency-inject to avoid circular imports).

export type AiChat = (messages: any[], model?: string) => Promise<string>;

// ==================== BOT COMMANDS MENU ====================
// Telegram limits: 32 commands max, command must be [a-z0-9_], up to 32 chars,
// description up to 256 chars. We keep the menu concise (~30 entries).
export const BOT_COMMANDS: Array<{ command: string; description: string }> = [
  { command: "start", description: "بدء التشغيل + قائمة الميزات" },
  { command: "help", description: "المساعدة والميزات المتاحة" },
  { command: "ping", description: "اختبار اتصال البوت" },
  { command: "img", description: "🎨 توليد صورة من وصف نصي" },
  { command: "edit", description: "✏️ تعديل ملف (استخدمه كابشن للملف)" },
  { command: "file", description: "📄 توليد ملف كود/نص جاهز" },
  { command: "code", description: "🧑‍💻 تحويل صورة واجهة إلى كود" },
  { command: "search", description: "🌐 بحث حي في الإنترنت" },
  { command: "explain", description: "شرح كود برمجي بالتفصيل" },
  { command: "debug", description: "اكتشاف أخطاء السكربتات" },
  { command: "optimize", description: "تحسين أداء الكود" },
  { command: "doc", description: "توليد توثيق فني للكود" },
  { command: "sql", description: "توليد استعلامات SQL" },
  { command: "json2sql", description: "تحويل JSON إلى SQL" },
  { command: "tests", description: "توليد Unit Tests" },
  { command: "translate", description: "ترجمة احترافية" },
  { command: "rewrite", description: "إعادة صياغة النص" },
  { command: "grammar", description: "تدقيق إملائي ونحوي" },
  { command: "ideas", description: "عصف ذهني وتوليد أفكار" },
  { command: "email", description: "صياغة بريد إلكتروني رسمي" },
  { command: "tasks", description: "تنظيم جدول مهام" },
  { command: "simplify", description: "تبسيط مفهوم معقد" },
  { command: "compare", description: "مقارنة بين شيئين" },
  { command: "ip", description: "🌐 معلومات عنوان IP" },
  { command: "dns", description: "🌐 فحص سجلات DNS" },
  { command: "whois", description: "🌐 معلومات نطاق (WHOIS/RDAP)" },
  { command: "ping_url", description: "🌐 فحص اتصال موقع" },
  { command: "meta", description: "🏷️ تحليل وسوم Meta لصفحة" },
  { command: "short", description: "🔗 اختصار رابط" },
  { command: "weather", description: "☀️ حالة الطقس لمدينة" },
  { command: "currency", description: "💱 تحويل عملات" },
  { command: "calc", description: "🧮 آلة حاسبة متقدمة" },
];

// ==================== NETWORK / API TOOLS ====================
async function tryFetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Alisa/2026 (+telegram)" } });
    const txt = await r.text();
    try { return { ok: r.ok, status: r.status, data: JSON.parse(txt) }; }
    catch { return { ok: r.ok, status: r.status, text: txt }; }
  } finally { clearTimeout(t); }
}

export async function toolIp(ip: string): Promise<string> {
  const target = ip.trim() || "";
  const url = target ? `https://ipwho.is/${encodeURIComponent(target)}` : `https://ipwho.is/`;
  const res = await tryFetchJson(url);
  const d = res.data ?? {};
  if (!d.success && d.success !== undefined) return `فشل الاستعلام: ${d.message ?? "IP غير صالح"}`;
  return [
    `🌐 معلومات IP: ${d.ip ?? target}`,
    `النوع: ${d.type ?? "-"}`,
    `الدولة: ${d.country ?? "-"} (${d.country_code ?? "-"})`,
    `المدينة: ${d.city ?? "-"} — ${d.region ?? "-"}`,
    `الإحداثيات: ${d.latitude ?? "-"}, ${d.longitude ?? "-"}`,
    `المنطقة الزمنية: ${d.timezone?.id ?? "-"}`,
    `المزود (ISP): ${d.connection?.isp ?? "-"}`,
    `المؤسسة: ${d.connection?.org ?? "-"}`,
    `ASN: ${d.connection?.asn ?? "-"}`,
  ].join("\n");
}

export async function toolDns(domain: string, type = "A"): Promise<string> {
  const t = (type || "A").toUpperCase();
  const d = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
  if (!d) return "اكتب اسم النطاق. مثال: /dns example.com A";
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${t}`;
  const r = await fetch(url, { headers: { accept: "application/dns-json" } });
  const j: any = await r.json();
  const ans = j.Answer ?? [];
  if (!ans.length) return `ما لكيت سجلات ${t} للنطاق ${d}`;
  const rows = ans.slice(0, 15).map((a: any) => `• ${a.name} ${a.type} → ${a.data} (TTL ${a.TTL})`).join("\n");
  return `🔎 DNS ${t} لـ ${d}:\n${rows}`;
}

export async function toolWhois(domain: string): Promise<string> {
  const d = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
  if (!d) return "اكتب اسم النطاق. مثال: /whois example.com";
  // RDAP (Registration Data Access Protocol) — free, no key
  const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(d)}`);
  if (!r.ok) return `فشل الاستعلام (${r.status})`;
  const j: any = await r.json();
  const events = (j.events ?? []) as any[];
  const ev = (k: string) => events.find((e) => e.eventAction === k)?.eventDate ?? "-";
  const status = (j.status ?? []).join(", ") || "-";
  const ns = (j.nameservers ?? []).map((n: any) => n.ldhName).slice(0, 6).join(", ") || "-";
  const registrar = (j.entities ?? []).find((e: any) => (e.roles ?? []).includes("registrar"))?.vcardArray?.[1]?.find((f: any) => f[0] === "fn")?.[3] ?? "-";
  return [
    `📇 WHOIS/RDAP لـ ${d}`,
    `الحالة: ${status}`,
    `المسجّل: ${registrar}`,
    `تاريخ التسجيل: ${ev("registration")}`,
    `آخر تحديث: ${ev("last changed")}`,
    `تاريخ الانتهاء: ${ev("expiration")}`,
    `Nameservers: ${ns}`,
  ].join("\n");
}

export async function toolPingUrl(target: string): Promise<string> {
  let url = target.trim();
  if (!url) return "اكتب رابط. مثال: /ping_url https://google.com";
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const attempts = 3;
  const results: number[] = [];
  let status = 0;
  for (let i = 0; i < attempts; i++) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { method: "HEAD", redirect: "follow" });
      status = r.status;
      results.push(Date.now() - t0);
    } catch { results.push(-1); }
  }
  const good = results.filter((n) => n >= 0);
  const avg = good.length ? Math.round(good.reduce((a, b) => a + b, 0) / good.length) : -1;
  return [
    `📡 فحص ${url}`,
    `الحالة: ${status || "لم يستجب"}`,
    `المحاولات: ${results.map((r) => (r < 0 ? "❌" : `${r}ms`)).join(" | ")}`,
    `المعدل: ${avg < 0 ? "غير متاح" : `${avg}ms`}`,
  ].join("\n");
}

export async function toolMeta(url: string): Promise<string> {
  let u = url.trim();
  if (!u) return "اكتب رابط. مثال: /meta https://example.com";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Alisa/2026" } });
  if (!r.ok) return `فشل الجلب (${r.status})`;
  const html = (await r.text()).slice(0, 500000);
  const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
  const title = pick(/<title[^>]*>([^<]{1,300})<\/title>/i);
  const desc = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i);
  const kw = pick(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']{1,500})["']/i);
  const ogT = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,500})["']/i);
  const ogD = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{1,500})["']/i);
  const ogI = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']{1,500})["']/i);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']{1,500})["']/i);
  const h1 = pick(/<h1[^>]*>([^<]{1,300})<\/h1>/i);
  return [
    `🏷️ Meta لـ ${u}`,
    `Title: ${title || "-"}`,
    `Description: ${desc || "-"}`,
    `Keywords: ${kw || "-"}`,
    `og:title: ${ogT || "-"}`,
    `og:description: ${ogD || "-"}`,
    `og:image: ${ogI || "-"}`,
    `canonical: ${canonical || "-"}`,
    `H1: ${h1 || "-"}`,
  ].join("\n");
}

export async function toolShort(url: string): Promise<string> {
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return "اكتب رابط كامل يبدأ بـ http/https";
  const r = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(u)}`);
  const txt = (await r.text()).trim();
  if (!r.ok || !/^https?:\/\//.test(txt)) return `فشل الاختصار: ${txt.slice(0, 200)}`;
  return `🔗 الرابط المختصر:\n${txt}`;
}

export async function toolWeather(city: string): Promise<string> {
  const c = city.trim() || "Baghdad";
  const r = await fetch(`https://wttr.in/${encodeURIComponent(c)}?format=j1&lang=ar`, {
    headers: { "User-Agent": "curl/8" },
  });
  if (!r.ok) return `فشل جلب الطقس (${r.status})`;
  const j: any = await r.json();
  const now = j.current_condition?.[0];
  if (!now) return "ما لكيت بيانات طقس لهذه المدينة";
  const area = j.nearest_area?.[0]?.areaName?.[0]?.value ?? c;
  const country = j.nearest_area?.[0]?.country?.[0]?.value ?? "";
  const fc = j.weather?.slice(0, 3).map((d: any) =>
    `• ${d.date}: من ${d.mintempC}° إلى ${d.maxtempC}° — ${d.hourly?.[4]?.lang_ar?.[0]?.value ?? d.hourly?.[4]?.weatherDesc?.[0]?.value ?? ""}`
  ).join("\n") ?? "";
  return [
    `☀️ الطقس في ${area} ${country ? "(" + country + ")" : ""}`,
    `الآن: ${now.temp_C}°C — يشعر كأنه ${now.FeelsLikeC}°C`,
    `الحالة: ${now.lang_ar?.[0]?.value ?? now.weatherDesc?.[0]?.value}`,
    `الرطوبة: ${now.humidity}% • الرياح: ${now.windspeedKmph} كم/س`,
    ``,
    `توقعات:`,
    fc,
  ].join("\n");
}

export async function toolCurrency(input: string): Promise<string> {
  // Format: "100 USD to IQD" or "USD IQD" or "USD IQD 100"
  const parts = input.trim().split(/\s+/);
  let amount = 1, from = "USD", to = "IQD";
  const nums = parts.filter((p) => /^\d+(\.\d+)?$/.test(p));
  const codes = parts.filter((p) => /^[A-Za-z]{3}$/.test(p)).map((c) => c.toUpperCase());
  if (nums.length) amount = parseFloat(nums[0]);
  if (codes.length >= 1) from = codes[0];
  if (codes.length >= 2) to = codes[1];
  const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!r.ok) return `فشل جلب أسعار الصرف (${r.status})`;
  const j: any = await r.json();
  const rate = j.rates?.[to];
  if (!rate) return `عملة غير معروفة: ${to}. جرّب أكواد ISO مثل USD, EUR, IQD, SAR, AED`;
  const val = (amount * rate).toLocaleString(undefined, { maximumFractionDigits: 4 });
  return `💱 ${amount} ${from} = ${val} ${to}\n(سعر الوحدة: 1 ${from} = ${rate} ${to})\nآخر تحديث: ${j.time_last_update_utc ?? "-"}`;
}

// ==================== SAFE CALCULATOR ====================
export function toolCalc(expr: string): string {
  const src = expr.trim();
  if (!src) return "اكتب معادلة. مثال: /calc sqrt(2)+sin(pi/4)*3";
  // Whitelist: numbers, operators, parens, comma, dot, and known function names
  if (!/^[\s0-9+\-*/().,%\^eE\p{L}_]+$/u.test(src)) return "رموز غير مسموحة.";
  const allowed = ["sin","cos","tan","asin","acos","atan","atan2","sqrt","cbrt","abs","log","log2","log10","exp","pow","min","max","round","floor","ceil","trunc","sign","hypot","random"];
  const consts: Record<string, number> = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E };
  // Replace ^ with ** and names with Math.name or constants
  let js = src.replace(/\^/g, "**");
  js = js.replace(/\b([a-zA-Z_]\w*)\b/g, (_, name) => {
    if (allowed.includes(name)) return `Math.${name}`;
    if (name in consts) return String(consts[name]);
    throw new SyntaxError(`اسم غير مسموح: ${name}`);
  });
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${js});`)();
    if (typeof val !== "number" || !isFinite(val)) return "النتيجة غير صالحة.";
    return `🧮 ${src} = ${val}`;
  } catch (e: any) {
    return `خطأ: ${e?.message ?? e}`;
  }
}

// ==================== AI-BACKED TOOLS ====================
// Each tool is a specialized system prompt + user payload.
const AI_TOOLS: Record<string, { sys: (arg: string) => string; ask: (arg: string) => string }> = {
  explain: {
    sys: () => "أنت Senior Engineer. اشرح الكود المُعطى سطراً بسطر: الغرض العام، البنية، الدوال الأساسية، تدفق التنفيذ، والملاحظات المهمة. رد عربي منسّق.",
    ask: (a) => `اشرح هذا الكود:\n\n${a}`,
  },
  debug: {
    sys: () => "أنت Senior Engineer متخصص في اكتشاف الأخطاء. حلل الكود، اذكر كل خطأ محتمل (بنائي، منطقي، أمني، أداء) واقترح إصلاحاً دقيقاً لكل واحد.",
    ask: (a) => `اكتشف كل الأخطاء بهذا الكود واقترح إصلاحات:\n\n${a}`,
  },
  optimize: {
    sys: () => "أنت Senior Engineer. أعد كتابة الكود بشكل أكثر كفاءة، وضّح التحسينات (تعقيد زمني/ذاكرة/قراءة). أرجع الكود المحسّن كامل داخل \\`\\`\\`FILE:optimized.<ext>\\`\\`\\` ثم شرحاً قصيراً بعده.",
    ask: (a) => `حسّن هذا الكود:\n\n${a}`,
  },
  doc: {
    sys: () => "أنت مسؤول Documentation. ولّد توثيقاً فنياً احترافياً (README + ملاحظات API) للكود المُعطى، بالعربية والإنجليزية عند الحاجة.",
    ask: (a) => `ولّد توثيق فني للكود التالي:\n\n${a}`,
  },
  sql: {
    sys: () => "أنت خبير قواعد بيانات. اكتب استعلام SQL نظيف (PostgreSQL افتراضياً) يحقق طلب المستخدم، مع تعليقات موجزة داخل الاستعلام. أرجع الاستعلام داخل \\`\\`\\`FILE:query.sql\\`\\`\\`.",
    ask: (a) => `اكتب استعلام SQL: ${a}`,
  },
  json2sql: {
    sys: () => "أنت خبير قواعد بيانات. حوّل JSON التالي إلى CREATE TABLE + INSERT statements ملائمة (PostgreSQL). استنتج الأنواع بذكاء. أرجع النتيجة داخل \\`\\`\\`FILE:migration.sql\\`\\`\\`.",
    ask: (a) => `حوّل JSON التالي إلى SQL:\n\n${a}`,
  },
  tests: {
    sys: () => "أنت خبير اختبارات. ولّد Unit Tests شاملة (تغطية للحالات الحدية والسلبية) للكود المُعطى. اختر إطار الاختبار المناسب. أرجع الاختبارات داخل \\`\\`\\`FILE:tests.<ext>\\`\\`\\`.",
    ask: (a) => `اكتب Unit Tests لهذا الكود:\n\n${a}`,
  },
  translate: {
    sys: () => "أنت مترجم محترف. اكتشف اللغة المصدر تلقائياً وترجم إلى اللغة الهدف. إذا لم يذكر المستخدم اللغة الهدف، ترجم بين العربية والإنجليزية. حافظ على المعنى والنبرة.",
    ask: (a) => `ترجم:\n\n${a}`,
  },
  rewrite: {
    sys: () => "أعد صياغة النص بأسلوب أوضح وأكثر احترافية، مع الحفاظ على المعنى واللغة الأصلية.",
    ask: (a) => `أعد صياغة:\n\n${a}`,
  },
  grammar: {
    sys: () => "دقق إملائياً ونحوياً النص التالي، اذكر الأخطاء وصححها، ثم أعطِ النسخة النهائية المصححة.",
    ask: (a) => `دقق:\n\n${a}`,
  },
  ideas: {
    sys: () => "أنت خبير عصف ذهني. ولّد 10 أفكار إبداعية ومتنوعة حول الموضوع، مع شرح موجز لكل فكرة.",
    ask: (a) => `عصف ذهني حول: ${a}`,
  },
  email: {
    sys: () => "اكتب بريداً إلكترونياً رسمياً واضحاً موجزاً، بلغة السياق (عربي/إنجليزي)، مع تحية وخاتمة مناسبتين.",
    ask: (a) => `اكتب بريد: ${a}`,
  },
  tasks: {
    sys: () => "نظّم جدول مهام واضح ومرتب زمنياً (يومي/أسبوعي حسب السياق) مع أولويات وتقديرات وقت واقعية.",
    ask: (a) => `نظّم مهام: ${a}`,
  },
  simplify: {
    sys: () => "بسّط المفهوم للطالب المبتدئ باستخدام تشبيهات من الحياة اليومية، بلا مصطلحات تقنية معقدة.",
    ask: (a) => `بسّط: ${a}`,
  },
  compare: {
    sys: () => "قارن بين الشيئين في جدول واضح (السعر، الأداء، سهولة الاستخدام، البيئة، نقاط القوة/الضعف)، ثم اذكر توصيتك.",
    ask: (a) => `قارن: ${a}`,
  },
  quote: {
    sys: () => "قدّم اقتباساً تحفيزياً أصيلاً باللغة العربية مع اسم قائله، ثم شرحاً قصيراً لمعناه.",
    ask: () => "اقتباس اليوم",
  },
  joke: {
    sys: () => "قدّم نكتة عربية خفيفة ومحترمة، مناسبة للجمهور العام.",
    ask: () => "نكتة",
  },
  recipe: {
    sys: () => "بناءً على المكونات، اقترح وصفة عملية: الاسم، المكونات، الخطوات، وقت التحضير، وسعرات تقريبية.",
    ask: (a) => `المكونات المتوفرة: ${a}`,
  },
  story: {
    sys: () => "اكتب قصة قصيرة (300–500 كلمة) هادفة وممتعة حول الموضوع، بلغة عربية أدبية سلسة.",
    ask: (a) => `اكتب قصة عن: ${a}`,
  },
  celebrity: {
    sys: () => "اكتب نبذة موجزة (5–8 نقاط) عن الشخصية المذكورة: من هو، أهم إنجازاته، ولماذا يُعرف.",
    ask: (a) => `عن: ${a}`,
  },
  sports: {
    sys: () => "قدّم آخر ما تعرفه عن نتائج الفريق/المباراة المذكورة، وإذا لم تكن متأكداً من نتيجة لحظية اقترح على المستخدم استخدام /search.",
    ask: (a) => `نتائج/إحصائيات: ${a}`,
  },
  events: {
    sys: () => "اذكر أهم الأحداث العالمية الحالية أو المرتقبة (رياضية، تكنولوجية، سياسية، ثقافية) حسب السياق الزمني.",
    ask: (a) => `أحداث: ${a || "هذا الأسبوع"}`,
  },
  seo: {
    sys: () => "أنت خبير SEO. حلل صفحة الويب بناء على البيانات المعطاة (Title, Meta, H1, محتوى مستخرج) وأعطِ ملاحظات محددة قابلة للتنفيذ.",
    ask: (a) => `حلل SEO:\n\n${a}`,
  },
  docx2pdf: {
    sys: () => "التحويل الفعلي من DOCX إلى PDF يحتاج مكتبة على السيرفر. اشرح للمستخدم أن هذه الخدمة قيد الإعداد وحالياً يمكنه إرسال الملف كنص عبر /تعديل.",
    ask: () => "شرح فقط",
  },
  summarize: {
    sys: () => "لخّص النص بالنقاط الرئيسية (5–10 نقاط) بلغة عربية واضحة، مع الحفاظ على المعلومات المهمة.",
    ask: (a) => `لخّص:\n\n${a}`,
  },
};

export async function runAiTool(
  key: string,
  arg: string,
  aiChat: AiChat,
): Promise<string> {
  const t = AI_TOOLS[key];
  if (!t) return `أداة غير معروفة: ${key}`;
  const reply = await aiChat([
    { role: "system", content: t.sys(arg) },
    { role: "user", content: t.ask(arg) },
  ]);
  return reply?.trim() || "ما كدرت أولّد رد.";
}

export const AI_TOOL_KEYS = Object.keys(AI_TOOLS);
