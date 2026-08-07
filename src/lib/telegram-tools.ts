// Tool registry for أليسا — Telegram bot
// Each tool is small, isolated, and wrapped in try/catch by the dispatcher.
// AI-backed tools take an `aiChat` callable from the webhook (dependency-inject to avoid circular imports).

export type AiChat = (messages: any[], model?: string) => Promise<string>;

// ==================== BOT COMMANDS MENU ====================
// Telegram allows up to 100 commands. All tools registered so the user
// can browse the whole feature set from the "/" menu.
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
  // ==== 40 ميزة إضافية ====
  { command: "poem", description: "✒️ كتابة قصيدة عربية" },
  { command: "story2", description: "📖 قصة قصيرة إبداعية" },
  { command: "dream", description: "🌙 تفسير حلم" },
  { command: "name", description: "🏷️ اقتراح أسماء (طفل/شركة/منتج)" },
  { command: "slogan", description: "📣 شعار تسويقي" },
  { command: "cv", description: "📄 توليد سيرة ذاتية" },
  { command: "cover", description: "✉️ رسالة تقديم للوظيفة" },
  { command: "interview", description: "🎤 أسئلة مقابلة عمل" },
  { command: "study", description: "📚 خطة دراسة" },
  { command: "workout", description: "💪 خطة تمرين رياضي" },
  { command: "diet", description: "🥗 نظام غذائي" },
  { command: "plan", description: "🗓️ خطة عمل / مشروع" },
  { command: "pitch", description: "🚀 عرض مشروع (Pitch)" },
  { command: "sentiment", description: "🙂 تحليل مشاعر النص" },
  { command: "keywords", description: "🔑 استخراج كلمات مفتاحية" },
  { command: "hashtags", description: "#️⃣ توليد هاشتاقات" },
  { command: "caption_ig", description: "📸 تعليق انستقرام" },
  { command: "tweet", description: "🐦 صياغة تغريدة X" },
  { command: "linkedin", description: "💼 منشور لينكدإن احترافي" },
  { command: "youtube", description: "▶️ وصف فيديو يوتيوب + عنوان" },
  { command: "blog", description: "📝 مقال مدونة SEO" },
  { command: "press", description: "📰 بيان صحفي" },
  { command: "contract", description: "📃 عقد أو اتفاقية بسيطة" },
  { command: "apology", description: "🙏 رسالة اعتذار" },
  { command: "thanks", description: "💐 رسالة شكر" },
  { command: "invite", description: "🎉 صياغة دعوة" },
  { command: "announce", description: "📢 إعلان رسمي" },
  { command: "review", description: "⭐ مراجعة/تقييم منتج" },
  { command: "faq", description: "❓ توليد أسئلة شائعة" },
  { command: "outline", description: "🧭 مخطط موضوع" },
  { command: "synonyms", description: "🔁 مرادفات كلمة" },
  { command: "antonyms", description: "↔️ أضداد كلمة" },
  { command: "define", description: "📖 تعريف مصطلح" },
  { command: "geo", description: "🗺️ معلومات دولة/مدينة" },
  { command: "history_of", description: "🏛️ نبذة تاريخية عن شيء" },
  { command: "motivate", description: "🔥 رسالة تحفيزية" },
  { command: "advice", description: "🤝 نصيحة شخصية" },
  { command: "astro", description: "♌ برج اليوم" },
  { command: "regex", description: "🧬 توليد تعبير Regex" },
  { command: "cron", description: "⏰ توليد تعبير Cron" },
  { command: "color", description: "🎨 اقتراح لوحة ألوان" },
  { command: "roast", description: "🌶️ سخرية ودّية خفيفة" },
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

  // ==================== 40 ميزة إضافية ====================
  poem:       { sys: () => "أنت شاعر عربي متمكن. اكتب قصيدة موزونة أو نصاً شعرياً حراً حسب الطلب، بلغة سلسة وصور جميلة.", ask: (a) => `اكتب قصيدة حول: ${a}` },
  story2:     { sys: () => "اكتب قصة قصيرة إبداعية (250–400 كلمة) بحبكة ونهاية غير متوقعة، بلغة عربية أدبية جميلة.", ask: (a) => `فكرة القصة: ${a}` },
  dream:      { sys: () => "فسّر الحلم بأسلوب واقعي هادئ (رمزية عامة + احتمالات نفسية). لا تدّعِ اليقين واذكر أن التفسير اجتهادي.", ask: (a) => `الحلم: ${a}` },
  name:       { sys: () => "اقترح 10 أسماء إبداعية للفكرة (طفل/شركة/منتج) مع معنى كل اسم بجملة قصيرة.", ask: (a) => `اقترح أسماء لـ: ${a}` },
  slogan:     { sys: () => "أنت كاتب إعلانات. اقترح 8 شعارات تسويقية قصيرة قوية (2–6 كلمات) لكل خيار، بالعربية والإنجليزية.", ask: (a) => `الشعار لـ: ${a}` },
  cv:         { sys: () => "ولّد سيرة ذاتية احترافية منظمة (بيانات، ملخص، خبرات، تعليم، مهارات) من المعلومات المعطاة، بصياغة مقنعة.", ask: (a) => `المعلومات:\n${a}` },
  cover:      { sys: () => "اكتب رسالة تقديم للوظيفة (Cover Letter) قوية ومختصرة (200–300 كلمة) مبنية على المعلومات المعطاة.", ask: (a) => `الوظيفة والخلفية:\n${a}` },
  interview:  { sys: () => "ولّد 15 سؤال مقابلة عمل للتخصص المعطى (تقني + سلوكي)، مع نموذج إجابة مختصر لكل سؤال.", ask: (a) => `التخصص: ${a}` },
  study:      { sys: () => "أنت مخطط تعليمي. اصنع خطة دراسة أسبوعية للموضوع مع أهداف يومية ومصادر مقترحة.", ask: (a) => `الموضوع: ${a}` },
  workout:    { sys: () => "أنت مدرب رياضي. صمّم خطة تمرين أسبوعية مناسبة للهدف والمستوى، مع عدد المجاميع والتكرارات والراحة.", ask: (a) => `الهدف والمستوى: ${a}` },
  diet:       { sys: () => "أنت أخصائي تغذية. اقترح خطة وجبات ليوم كامل حسب الهدف، مع السعرات التقريبية والماكروز.", ask: (a) => `الهدف والوزن: ${a}` },
  plan:       { sys: () => "ضع خطة عمل لمشروع/هدف: الرؤية، الأهداف، الخطوات، الجدول الزمني، المخاطر، ومؤشرات النجاح.", ask: (a) => `المشروع: ${a}` },
  pitch:      { sys: () => "اكتب Pitch Deck نصي (المشكلة، الحل، السوق، النموذج، المنافسة، الفريق، الطلب) للمشروع المعطى.", ask: (a) => `المشروع: ${a}` },
  sentiment:  { sys: () => "حلّل مشاعر النص: إيجابي/سلبي/محايد + شدة (٠–١٠) + مبررات موجزة + كلمات مفتاحية أثّرت بالحكم.", ask: (a) => `النص:\n\n${a}` },
  keywords:   { sys: () => "استخرج 10–20 كلمة/عبارة مفتاحية للنص، مرتبة بالأهمية، بدون تكرار.", ask: (a) => `النص:\n\n${a}` },
  hashtags:   { sys: () => "اقترح 15 هاشتاق فعّال (مزيج عربي/إنجليزي، بعضها Trending وبعضها Niche) للموضوع.", ask: (a) => `الموضوع: ${a}` },
  caption_ig: { sys: () => "اكتب 3 تعليقات انستقرام جذّابة (كل واحد ≤ 220 حرف) مع 5–8 هاشتاقات في نهاية كل واحد.", ask: (a) => `المنشور عن: ${a}` },
  tweet:      { sys: () => "صغ التغريدة بأقل من 280 حرف، قوية وواضحة، بدون هاشتاقات مبالغ فيها.", ask: (a) => `الموضوع: ${a}` },
  linkedin:   { sys: () => "اكتب منشور لينكدإن احترافي (150–250 كلمة) بلمسة شخصية ودعوة للتفاعل في النهاية.", ask: (a) => `الموضوع: ${a}` },
  youtube:    { sys: () => "اقترح 5 عناوين يوتيوب جذّابة + وصف كامل (200 كلمة) مع Timestamps وهاشتاقات وCTA.", ask: (a) => `عن الفيديو: ${a}` },
  blog:       { sys: () => "اكتب مقال مدونة SEO (600–900 كلمة) بعنوان، مقدمة، H2/H3 منظمة، خاتمة، وميتا وصف.", ask: (a) => `الموضوع: ${a}` },
  press:      { sys: () => "صغ بياناً صحفياً بصيغة رسمية (عنوان، مقدمة، جسم، اقتباس، معلومات الاتصال).", ask: (a) => `الحدث: ${a}` },
  contract:   { sys: () => "اكتب مسودة اتفاقية/عقد بسيط (طرفان، غرض، التزامات، مدة، إنهاء، توقيع) وذكّر أنها ليست بديلاً عن محامٍ.", ask: (a) => `تفاصيل العقد: ${a}` },
  apology:    { sys: () => "اكتب رسالة اعتذار صادقة ولبقة تناسب الموقف، بلغة الطرف الآخر.", ask: (a) => `الموقف: ${a}` },
  thanks:     { sys: () => "اكتب رسالة شكر دافئة وأنيقة مناسبة للسياق.", ask: (a) => `السياق: ${a}` },
  invite:     { sys: () => "صغ نص دعوة رسمية جذّابة للمناسبة (تاريخ/مكان/سبب/RSVP).", ask: (a) => `المناسبة: ${a}` },
  announce:   { sys: () => "اكتب إعلاناً رسمياً واضحاً (عنوان، تفاصيل، وقت، مكان، جهة الاتصال).", ask: (a) => `الإعلان عن: ${a}` },
  review:     { sys: () => "اكتب مراجعة/تقييم منتج متوازنة (مقدمة، مواصفات، إيجابيات، سلبيات، لمن يناسب، الحكم النهائي والتقييم/10).", ask: (a) => `المنتج: ${a}` },
  faq:        { sys: () => "ولّد 10 أسئلة شائعة وأجوبتها بلغة واضحة للموضوع.", ask: (a) => `الموضوع: ${a}` },
  outline:    { sys: () => "ضع مخططاً هرمياً (Outline) شاملاً للموضوع بعناوين رئيسية وفرعية وأمثلة.", ask: (a) => `الموضوع: ${a}` },
  synonyms:   { sys: () => "أعطِ 10 مرادفات دقيقة للكلمة مع فرق دلالي مختصر لكل واحدة.", ask: (a) => `الكلمة: ${a}` },
  antonyms:   { sys: () => "أعطِ 10 أضداد للكلمة مع مثال استخدام مختصر لكل ضد.", ask: (a) => `الكلمة: ${a}` },
  define:     { sys: () => "عرّف المصطلح تعريفاً دقيقاً (تعريف عام + مثال + سياق استخدام).", ask: (a) => `المصطلح: ${a}` },
  geo:        { sys: () => "قدّم بطاقة معلومات عن الدولة/المدينة (الموقع، السكان، اللغة، العملة، أبرز المعالم، حقائق سريعة).", ask: (a) => `المكان: ${a}` },
  history_of: { sys: () => "قدّم نبذة تاريخية موجزة (500 كلمة كحد أقصى) مع أهم التواريخ والأحداث.", ask: (a) => `عن: ${a}` },
  motivate:   { sys: () => "اكتب رسالة تحفيزية قوية وشخصية (100–150 كلمة) تناسب حالة المستخدم.", ask: (a) => `الحالة: ${a}` },
  advice:     { sys: () => "قدّم نصيحة شخصية عملية بخطوات واضحة، دون تنميط أو أحكام مطلقة.", ask: (a) => `الموضوع: ${a}` },
  astro:      { sys: () => "قدّم توقعات برج اليوم بأسلوب تسلية (عاطفة، عمل، صحة)، وذكّر أنها للتسلية فقط وليست علماً.", ask: (a) => `البرج: ${a}` },
  regex:      { sys: () => "أنت خبير Regex. ولّد التعبير المطلوب مع شرح كل جزء منه وأمثلة تطابق/عدم تطابق.", ask: (a) => `المطلوب مطابقته: ${a}` },
  cron:       { sys: () => "ولّد تعبير Cron المناسب للجدولة المطلوبة مع شرح بشري وأمثلة على المرات القادمة.", ask: (a) => `الجدولة: ${a}` },
  color:      { sys: () => "اقترح لوحة ألوان (5 ألوان) بأكواد HEX مع اسم كل لون واستخدامه المقترح (Primary/Accent/BG…).", ask: (a) => `الهوية/الموضوع: ${a}` },
  roast:      { sys: () => "قدّم سخرية ودّية خفيفة (Roast) بأسلوب مرح غير مؤذٍ، بلا شتائم ولا إهانات حقيقية.", ask: (a) => `اروست: ${a}` },
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

// ==================== PHOTO INTENT DETECTION ====================
// يحدد إذا كان النص المرفق مع الصورة يطلب "تعديل الصورة" أو "تحليلها".
// يعتمد على تسجيل نقاط (weighted scoring) بدل مطابقة كلمة واحدة، لمنع اللبس.
export type PhotoIntent = {
  intent: "edit" | "analyze";
  score: number;      // موجب = تعديل، سالب/صفر = تحليل
  reasons: string[];
};

const EDIT_SIGNALS: Array<[RegExp, number, string]> = [
  // أفعال تعديل صريحة مرتبطة بالصورة
  [/\b(عدّ?ل|تعديل)\b/u, 3, "فعل تعديل"],
  [/(اجعل|خلّ?يها|خلّ?يه|حوّ?لها|حوّ?له|حوّ?ل\s+الصورة)/u, 3, "تحويل"],
  [/\b(أضف|اضف|ضيف|زيد)\b/u, 2.5, "إضافة عنصر"],
  [/\b(احذف|اح?ذفي|شيل|امسح|ازل|أزل|إزالة|ازالة)\b/u, 2.5, "حذف عنصر"],
  [/(غيّ?ر|بدّ?ل|استبدل)/u, 2.5, "تغيير"],
  [/(خلفي[ةه]|الخلفية)/u, 2, "خلفية"],
  [/(لوّ?نها|لوّ?نه|بالأبيض والأسود|أبيض وأسود|ابيض واسود)/u, 2, "تلوين"],
  [/(قصّ?|قص\s+الصورة|كروب|تكبير|تصغير|دقّ?ة أعلى|وضوح أعلى|حسّ?ن الصورة|رتوش|فلتر|ستايل|أنمي|انمي|كرتون|كارتون)/u, 2.5, "معالجة بصرية"],
  [/(ارسم|أرسم|صمّ?م|اصنع منها|سوّ?يها|سويها)/u, 2, "إعادة إنشاء"],
  // إنجليزي — حدود كلمات
  [/\b(edit|retouch|restyle|inpaint|upscale|enhance|colou?rize|crop|resize|blur|erase)\b/i, 3, "edit verb"],
  [/\b(remove|delete|add|replace|swap|change|turn\s+it\s+into|make\s+it|convert\s+it)\b/i, 2.5, "edit verb"],
  [/\b(background|filter|style|anime|cartoon|sketch|watermark)\b/i, 1.5, "edit target"],
];

const ANALYZE_SIGNALS: Array<[RegExp, number, string]> = [
  // أسئلة واستفهام
  [/[؟?]/u, 2, "سؤال"],
  [/(شنو|شني|شو|وش|ايش|إيش|ما\s+ه(?:ذا|ذه|و|ي)|منو|من\s+هو|ليش|ليه|لماذا|كيف|شلون|هل\b|وين|متى)/u, 2.5, "أداة استفهام"],
  [/\b(what|why|how|who|where|when|which|is\s+this|can\s+you\s+tell)\b/i, 2.5, "question word"],
  // طلبات فهم/تحليل
  [/(حلّ?ل|تحليل|اشرح|شرح|فسّ?ر|تفسير|وصف|صف\s+|اقرأ|اقرا|استخرج|لخّ?ص|ترجم|ترجمة)/u, 3, "طلب تحليل"],
  [/\b(analy[sz]e|explain|describe|read|extract|summari[sz]e|translate|ocr|identify|detect)\b/i, 3, "analysis verb"],
  // أخطاء/مشاكل → تحليل غالباً
  [/(خطأ|الخطا|ايرور|مشكلة|مشكله|ما\s+يشتغل|ميشتغل|لا\s+يعمل|شلون\s+أصلح|صلّ?ح\s+الكود)/u, 2.5, "مشكلة/خطأ"],
  [/\b(error|bug|issue|not\s+working|fix\s+(?:the\s+)?(?:code|error))\b/i, 2.5, "error"],
  // مقارنات/آراء
  [/(رأيك|شرايك|شنو رايك|قيّ?م|تقييم)/u, 1.5, "طلب رأي"],
];

export function detectPhotoIntent(caption?: string | null): PhotoIntent {
  const text = (caption ?? "").trim();
  if (!text) return { intent: "analyze", score: 0, reasons: ["بدون نص → تحليل افتراضي"] };

  let score = 0;
  const reasons: string[] = [];

  for (const [re, w, label] of EDIT_SIGNALS) {
    if (re.test(text)) { score += w; reasons.push(`+${w} ${label}`); }
  }
  for (const [re, w, label] of ANALYZE_SIGNALS) {
    if (re.test(text)) { score -= w; reasons.push(`-${w} ${label}`); }
  }

  // نفي صريح للتعديل
  if (/(لا\s+تعدّ?ل|بدون\s+تعديل|don'?t\s+edit|do\s+not\s+edit|no\s+edit)/iu.test(text)) {
    score -= 6; reasons.push("-6 نفي التعديل");
  }
  // أمر صريح جداً يرجّح التعديل مهما كان
  if (/(عدّ?ل\s+(?:هالصورة|هذه\s+الصورة|الصورة|الصوره)|edit\s+(?:this\s+)?(?:image|photo|picture))/iu.test(text)) {
    score += 4; reasons.push("+4 أمر تعديل صريح على الصورة");
  }

  return { intent: score > 0 ? "edit" : "analyze", score, reasons };
}
