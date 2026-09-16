// ============ قائمة أزرار داخل المحادثة (بدل قائمة الأوامر القديمة) ============
import { BOT_COMMANDS } from "./telegram-tools";

export type MenuSection = {
  key: string;
  color: string;   // لون القسم (إيموجي ملوّن)
  title: string;
  commands: string[];
};

export const MENU_SECTIONS: MenuSection[] = [
  {
    key: "core", color: "🔴", title: "الأساسيات",
    commands: ["start", "help", "ping", "menu", "search", "selftest", "stats"],
  },
  {
    key: "media", color: "🟢", title: "الصور والوسائط",
    commands: ["img", "imagine", "code", "color", "caption_ig"],
  },
  {
    key: "files", color: "🔴", title: "الملفات",
    commands: ["file", "edit", "readfile", "myfiles", "grepcode", "summarize"],
  },
  {
    key: "dev", color: "🟢", title: "المبرمج",
    commands: ["explain", "debug", "optimize", "doc", "sql", "json2sql", "tests", "regex", "cron", "apiplan"],
  },
  {
    key: "net", color: "🔴", title: "الشبكة والأدوات",
    commands: ["ip", "dns", "whois", "ping_url", "meta", "short", "weather", "currency", "calc"],
  },
  {
    key: "mind", color: "🟢", title: "المشاعر والنوايا",
    commands: ["emotion", "sarcasm", "intent", "tone", "empathy", "sentiment", "memoryplan"],
  },
  {
    key: "create", color: "🔴", title: "الإبداع",
    commands: ["creative", "poem", "story2", "lyrics", "script", "dream", "joke", "quote", "roast"],
  },
  {
    key: "work", color: "🟢", title: "العمل والحياة",
    commands: ["cv", "cover", "interview", "plan", "pitch", "study", "workout", "diet", "tasks", "email"],
  },
  {
    key: "text", color: "🔵", title: "النصوص واللغة",
    commands: ["translate", "rewrite", "grammar", "simplify", "compare", "keywords", "ideas", "define", "synonyms"],
  },
  {
    key: "social", color: "🔵", title: "السوشيال ميديا",
    commands: ["hashtags", "tweet", "linkedin", "youtube", "blog", "press", "slogan", "announce", "invite"],
  },
];

const DESC = new Map(BOT_COMMANDS.map((c) => [c.command, c.description]));

export function commandDescription(cmd: string): string {
  return DESC.get(cmd) ?? `الأمر /${cmd}`;
}

export type InlineKeyboard = { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> };

export function mainMenuKeyboard(): InlineKeyboard {
  const rows: InlineKeyboard["inline_keyboard"] = [];
  for (let i = 0; i < MENU_SECTIONS.length; i += 2) {
    rows.push(
      MENU_SECTIONS.slice(i, i + 2).map((s) => ({
        text: `${s.color} ${s.title}`,
        callback_data: `sec:${s.key}`,
      })),
    );
  }
  rows.push([{ text: "📊 إحصائيات كودي", callback_data: "cmd:stats" }]);
  rows.push([{ text: "🩺 فحص ذاتي شامل", callback_data: "cmd:selftest" }]);
  return { inline_keyboard: rows };
}

export function sectionKeyboard(key: string): InlineKeyboard | null {
  const sec = MENU_SECTIONS.find((s) => s.key === key);
  if (!sec) return null;
  const rows: InlineKeyboard["inline_keyboard"] = [];
  for (let i = 0; i < sec.commands.length; i += 3) {
    rows.push(
      sec.commands.slice(i, i + 3).map((c) => ({
        text: `${sec.color} /${c}`,
        callback_data: `cmd:${c}`,
      })),
    );
  }
  rows.push([{ text: "⬅️ رجوع للقائمة", callback_data: "menu" }]);
  return { inline_keyboard: rows };
}

export function sectionText(key: string): string {
  const sec = MENU_SECTIONS.find((s) => s.key === key);
  if (!sec) return "قسم غير معروف";
  const lines = sec.commands.map((c) => `${sec.color} /${c} — ${commandDescription(c)}`);
  return `${sec.color} *${sec.title}*\n\n${lines.join("\n")}\n\nاضغط أي زر لتشوف طريقة استخدامه 👇`;
}

export const MAIN_MENU_TEXT =
  "🎛️ قائمة أليسا — اختار قسم من الأزرار:\n\n" +
  MENU_SECTIONS.map((s) => `${s.color} ${s.title} (${s.commands.length} أداة)`).join("\n");
