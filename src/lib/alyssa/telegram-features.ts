export type InlineButton = { text: string; copy_text?: { text: string }; callback_data?: string };
export type Action = "rephrase" | "shorten" | "expand" | "image-change" | "image-color" | "image-detail" | "history";
export const REQUESTS_PER_MINUTE = 20;
export const COPY_LIMIT = 256;
export const MESSAGE_LIMIT = 4096;

export function copySections(text: string): string[] {
  const blocks = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1].trim()).filter(Boolean);
  if (blocks.length) return blocks;
  return text.length >= 120 || /(?:^|\n)\s*(?:[-•]|\d+[.)])\s/.test(text) ? [text] : [];
}

export function copyButton(text: string): InlineButton | null {
  return text.length > 0 && text.length <= COPY_LIMIT ? { text: "📋 نسخ", copy_text: { text } } : null;
}

/** Plain text transport preserves literal code; no Markdown entities are split. */
export function splitMessage(text: string, limit = 3900): string[] {
  if (!text) return [];
  if (limit < 2 || limit > MESSAGE_LIMIT) throw new Error("Invalid message limit");
  const out: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    let boundary = remaining.lastIndexOf("\n\n", limit);
    if (boundary >= limit / 2) boundary += 2;
    else {
      boundary = remaining.lastIndexOf("\n", limit);
      if (boundary >= limit / 2) boundary += 1;
      else boundary = limit;
    }
    // Never cut a UTF-16 surrogate pair (Telegram entities use UTF-16 offsets).
    const last = remaining.charCodeAt(boundary - 1);
    if (last >= 0xd800 && last <= 0xdbff) boundary--;
    out.push(remaining.slice(0, boundary));
    remaining = remaining.slice(boundary);
  }
  if (remaining) out.push(remaining);
  return out;
}

export function actionPrompt(action: Action): string {
  const prompts: Record<Action, string> = {
    rephrase: "أعد صياغة هذا الرد بعراقي طبيعي وحافظ على معناه.",
    shorten: "اختصر هذا الرد واحتفظ بالمعلومات المهمة.",
    expand: "فصّل هذا الرد حسب سياق الطلب، بدون اختراع حقائق أو ادعاء تنفيذ جديد.",
    "image-change": "غيّر تكوين الصورة مع الحفاظ على الموضوع الأساسي.",
    "image-color": "غيّر لوحة ألوان الصورة إلى ألوان مختلفة مع الحفاظ على الموضوع والتفاصيل.",
    "image-detail": "زد التفاصيل المرئية ووضوح الصورة مع الحفاظ على موضوعها وألوانها.",
    history: "",
  };
  return prompts[action];
}

export function parseControl(value: unknown): { id: string; action: Action } | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^alisa:([0-9a-f-]{36}):(rephrase|shorten|expand|image-change|image-color|image-detail|history)$/);
  return match ? { id: match[1], action: match[2] as Action } : null;
}

export function authorizedControl(owner: number, chat: number, caller: number, currentChat: number): boolean {
  return owner === caller && chat === currentChat && caller > 0;
}

export function quotedContext(message: { text?: string; caption?: string; photo?: unknown[]; document?: { file_name?: string } } | undefined): string {
  if (!message) return "";
  const text = message.text ?? message.caption ?? "";
  const note = message.photo?.length ? "[صورة مقتبسة: النص ليس بديلًا عن تحليل الصورة]" : message.document ? `[ملف مقتبس: ${message.document.file_name ?? "ملف"}؛ المحتوى يحتاج قراءة]` : "";
  return [text.slice(0, 8000), note].filter(Boolean).join("\n");
}

export function savedMedia(contents: string[]): { kind: "photo" | "document"; fileId: string; label: string }[] {
  const found = new Map<string, { kind: "photo" | "document"; fileId: string; label: string }>();
  for (const content of contents) {
    for (const m of content.matchAll(/\[مرفق (صورة|ملف)([^\]]*?)\| telegram_file_id=([\w-]+)\]/g)) {
      found.set(m[3], { kind: m[1] === "صورة" ? "photo" : "document", fileId: m[3], label: m[2].replace(/^:\s*/, "").trim() || m[1] });
    }
  }
  return [...found.values()];
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/402|billing|credit|payment/i.test(message)) return "رصيد خدمة الذكاء مو متاح هسه؛ يحتاج صاحب البوت يراجع الرصيد.";
  if (/429|quota|rate.?limit/i.test(message)) return "وصلنا حدّ استخدام الخدمة؛ انتظر شوي قبل طلب جديد.";
  if (/401|403|credential|API_KEY|configured/i.test(message)) return "الخدمة مو مهيأة أو ما عندها صلاحية هسه؛ يحتاج صاحب البوت يراجع إعدادها.";
  if (/timeout|timed out|AbortError/i.test(message)) return "المعالجة أخذت وقت طويل وما اكتملت؛ ما راح أعيد الطلب تلقائيًا.";
  if (/unsupported|format|صيغة/i.test(message)) return "صيغة المرفق مو مدعومة بهالخدمة.";
  if (/500|502|503|504/i.test(message)) return "الخدمة بيها عطل مؤقت؛ ما اكتمل طلبك.";
  return "ما اكتمل الطلب هالمرة؛ ما راح أدّعي إني نفّذته. جرّب لاحقًا.";
}

export function limitAllowed(count: number, limit = REQUESTS_PER_MINUTE): boolean { return count < limit; }
export function historyAfterReset<T extends { ts: number }>(rows: T[], resetAt: number): T[] { return rows.filter((r) => r.ts > resetAt); }