// ============ Self-awareness: أليسا تقرأ ملفات مشروعها الحقيقية ============
// كل ملفات المصدر تُحزم داخل البندل وقت البناء، فتقدر أليسا تقراها حرف بحرف وقت التشغيل.

const RAW = import.meta.glob("../**/*.{ts,tsx,css,json,md}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function norm(p: string): string {
  return p.replace(/^\.\.\//, "src/").replace(/^\.\//, "src/");
}

const FILES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW)
    .filter(([p]) => !/routeTree\.gen\.ts$/.test(p))
    .map(([p, c]) => [norm(p), typeof c === "string" ? c : String(c)]),
);

export function sourcePaths(): string[] {
  return Object.keys(FILES).sort();
}

export function sourceStats(): { files: number; lines: number; chars: number } {
  let lines = 0, chars = 0;
  for (const c of Object.values(FILES)) {
    chars += c.length;
    lines += c.split("\n").length;
  }
  return { files: Object.keys(FILES).length, lines, chars };
}

export function listSourceText(): string {
  const s = sourceStats();
  const rows = sourcePaths().map((p) => {
    const c = FILES[p];
    return `• ${p} — ${c.split("\n").length} سطر / ${c.length} حرف`;
  });
  return `🗂️ ملفاتي (${s.files} ملف • ${s.lines} سطر • ${s.chars} حرف):\n\n${rows.join("\n")}`;
}

export function resolveSourcePath(query: string): string | null {
  const q = query.trim().replace(/^\/+/, "");
  if (!q) return null;
  const paths = sourcePaths();
  return (
    paths.find((p) => p === q) ??
    paths.find((p) => p.endsWith("/" + q)) ??
    paths.find((p) => p.toLowerCase().includes(q.toLowerCase())) ??
    null
  );
}

export function readSourceFile(query: string): { path: string; content: string } | null {
  const p = resolveSourcePath(query);
  if (!p) return null;
  return { path: p, content: FILES[p] };
}

export function searchSource(query: string, maxHits = 40): string {
  const q = query.trim();
  if (!q) return "اكتب نص للبحث داخل ملفاتي 🔎";
  const out: string[] = [];
  let hits = 0;
  for (const p of sourcePaths()) {
    const lines = FILES[p].split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q.toLowerCase())) {
        out.push(`${p}:${i + 1}\n   ${lines[i].trim().slice(0, 180)}`);
        if (++hits >= maxHits) return `🔎 نتائج البحث عن "${q}" (أول ${hits}):\n\n${out.join("\n")}`;
      }
    }
  }
  return hits ? `🔎 نتائج البحث عن "${q}" (${hits}):\n\n${out.join("\n")}` : `ما لكيت "${q}" بأي ملف من ملفاتي.`;
}

/** ملخّص مختصر يُحقن بالـ system prompt حتى تعرف أليسا هيكل نفسها دائماً. */
export function selfSummary(): string {
  const s = sourceStats();
  const top = sourcePaths().slice(0, 40).join(", ");
  return `أنا أملك وصول كامل لملفات مصدري (${s.files} ملف، ${s.lines} سطر، ${s.chars} حرف). أهم الملفات: ${top}. أقدر أقرأ أي ملف حرف بحرف عبر /اقرأ <اسم الملف> وأبحث بكل الكود عبر /بحث_كود <نص>.`;
}
