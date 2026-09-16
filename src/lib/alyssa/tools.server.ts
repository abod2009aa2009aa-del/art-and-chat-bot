/* eslint-disable @typescript-eslint/no-explicit-any */

// ALYSSA CYBER — Tool Engine.
// Every tool has a JSON schema, validates its input, logs its execution to the
// database and returns a structured result. No tool fakes a result: when a
// capability is unavailable the tool says so explicitly.

import { zipSync, strToU8 } from "fflate";
import * as store from "./store.server";
import { checkScope, isPublicHttpTarget, scopeConfigSummary } from "./scope-guard.server";

export type ToolContext = {
  ownerId: number;
  chatId: number;
  projectId: string | null;
  jobId: string | null;
  /** files produced during this run that the bot should deliver to Telegram */
  deliveries: Array<{ name: string; buffer: Buffer }>;
};

export type ToolResult = { ok: boolean; [k: string]: unknown };

type ToolDef = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (args: any, ctx: ToolContext) => Promise<ToolResult>;
};

const SECRET_KEYS = /(TOKEN|SECRET|API_KEY|SERVICE_ROLE|PASSWORD|PRIVATE_KEY)/i;
const EXCLUDED_FROM_ZIP = /(^|\/)(\.env(\..*)?|.*\.pem|.*\.key|id_rsa.*|secrets?\.(json|ya?ml))$/i;

function obj(props: Record<string, unknown>, required: string[]) {
  return { type: "object", properties: props, required, additionalProperties: false };
}
const str = (description: string) => ({ type: "string", description });

async function needProject(ctx: ToolContext): Promise<string> {
  if (ctx.projectId) return ctx.projectId;
  const active = await store.activeProject(ctx.ownerId);
  if (active) {
    ctx.projectId = active.id;
    return active.id;
  }
  const created = await store.createProject({
    ownerId: ctx.ownerId,
    chatId: ctx.chatId,
    name: `project-${new Date().toISOString().slice(0, 10)}`,
  });
  ctx.projectId = created.id;
  return created.id;
}

// ---------------- Web research ----------------

export async function webSearch(
  query: string,
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const out: Array<{ title: string; url: string; snippet: string }> = [];
  try {
    const r = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`,
      {
        headers: { "User-Agent": "AlyssaCyber/1.0" },
      },
    );
    if (r.ok) {
      const d: any = await r.json();
      if (d.AbstractText)
        out.push({ title: d.Heading || query, url: d.AbstractURL || "", snippet: d.AbstractText });
      for (const t of (d.RelatedTopics ?? []).slice(0, 8)) {
        if (t.Text && t.FirstURL)
          out.push({ title: t.Text.split(" - ")[0], url: t.FirstURL, snippet: t.Text });
      }
    }
  } catch (e) {
    console.error("[web_search] ddg failed", e);
  }
  if (out.length === 0) {
    try {
      const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "Mozilla/5.0 AlyssaCyber" },
      });
      const html = await r.text();
      const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) && out.length < 8) {
        out.push({ title: m[2].replace(/<[^>]+>/g, "").trim(), url: m[1], snippet: "" });
      }
    } catch (e) {
      console.error("[web_search] html fallback failed", e);
    }
  }
  return out;
}

async function openUrl(url: string, maxChars = 6000) {
  if (!/^https?:\/\//i.test(url)) throw new Error("رابط غير صالح");
  if (!isPublicHttpTarget(url)) throw new Error("تم رفض الرابط لحماية SSRF");
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 AlyssaCyber" } });
  const raw = await r.text();
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { status: r.status, chars: text.length, text: text.slice(0, maxChars) };
}

// ---------------- Static Python analysis (real, not simulated) ----------------

export function lintPython(source: string): {
  issues: Array<{ line: number; level: string; msg: string }>;
  summary: string;
} {
  const issues: Array<{ line: number; level: string; msg: string }> = [];
  const lines = source.split("\n");
  const stack: Array<{ ch: string; line: number }> = [];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  let inTriple: string | null = null;

  lines.forEach((raw, i) => {
    const n = i + 1;
    let line = raw;
    // triple-quoted string tracking
    const tripleMatches = line.match(/"""|'''/g) ?? [];
    for (const t of tripleMatches) {
      if (inTriple === null) inTriple = t;
      else if (inTriple === t) inTriple = null;
    }
    if (inTriple) return;
    line = line
      .replace(/#.*$/, "")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");

    for (const ch of line) {
      if ("([{".includes(ch)) stack.push({ ch, line: n });
      else if (")]}".includes(ch)) {
        const top = stack.pop();
        if (!top || top.ch !== pairs[ch])
          issues.push({ line: n, level: "error", msg: `قوس غير متطابق '${ch}'` });
      }
    }
    if (/\t/.test(raw) && / {2,}/.test(raw))
      issues.push({ line: n, level: "warn", msg: "خلط بين tab و spaces بالمسافات البادئة" });
    if (
      /^\s*(def|class|if|elif|else|for|while|try|except|finally|with)\b[^\n]*[^:\s\\]\s*$/.test(
        line,
      ) &&
      !line.trim().endsWith(",") &&
      !line.includes("(")
    ) {
      issues.push({ line: n, level: "error", msg: "ناقص ':' بنهاية الجملة" });
    }
    if (/\bprint\s+[^(\s=]/.test(line))
      issues.push({ line: n, level: "error", msg: "print بأسلوب Python 2" });
    if (/\bexcept\s*:\s*$/.test(line))
      issues.push({ line: n, level: "warn", msg: "except عام بدون نوع استثناء" });
    if (SECRET_KEYS.test(line) && /=\s*["'][^"']{12,}["']/.test(line)) {
      issues.push({
        line: n,
        level: "error",
        msg: "سر (secret) مكتوب داخل الكود — انقله لمتغير بيئة",
      });
    }
    if (line.length > 200) issues.push({ line: n, level: "warn", msg: "سطر طويل جداً" });
  });
  for (const s of stack)
    issues.push({ line: s.line, level: "error", msg: `قوس '${s.ch}' لم يُغلق` });
  if (inTriple)
    issues.push({ line: lines.length, level: "error", msg: "سلسلة ثلاثية الاقتباس لم تُغلق" });

  const errors = issues.filter((i) => i.level === "error").length;
  return {
    issues: issues.slice(0, 50),
    summary: `${lines.length} سطر — ${errors} خطأ، ${issues.length - errors} تحذير`,
  };
}

function inspectDependencies(files: Array<{ path: string; content: string }>) {
  const imports = new Set<string>();
  const stdlib = new Set([
    "os",
    "sys",
    "re",
    "json",
    "time",
    "math",
    "random",
    "typing",
    "pathlib",
    "asyncio",
    "logging",
    "datetime",
    "sqlite3",
    "subprocess",
    "threading",
    "dataclasses",
    "collections",
    "itertools",
    "functools",
    "hashlib",
    "base64",
    "unittest",
    "argparse",
    "csv",
    "io",
    "shutil",
    "tempfile",
    "uuid",
    "enum",
    "abc",
    "contextlib",
    "traceback",
    "socket",
    "struct",
    "zipfile",
  ]);
  for (const f of files) {
    if (!f.path.endsWith(".py")) continue;
    for (const m of f.content.matchAll(
      /^\s*(?:from\s+([A-Za-z0-9_.]+)|import\s+([A-Za-z0-9_., ]+))/gm,
    )) {
      const raw = m[1] ?? m[2] ?? "";
      for (const part of raw.split(",")) {
        const top = part.trim().split(".")[0].split(" ")[0];
        if (top && !stdlib.has(top) && !top.startsWith("_")) imports.add(top);
      }
    }
  }
  const local = new Set(files.map((f) => f.path.replace(/\.py$/, "").split("/").pop()!));
  return [...imports].filter((i) => !local.has(i)).sort();
}

// ---------------- Registry ----------------

export const TOOLS: ToolDef[] = [
  {
    name: "security_scope_check",
    description: "التحقق من نطاق هدف أمني وإعدادات الامتحان دون تنفيذ أي فحص.",
    parameters: obj(
      { target: str("الرابط أو النطاق المراد التحقق منه"), category: str("فئة الفحص") },
      ["target", "category"],
    ),
    run: async (a) => ({
      ok: true,
      decision: checkScope(String(a.target), String(a.category)),
      config: scopeConfigSummary(),
    }),
  },
  {
    name: "http_probe",
    description: "فحص HTTP واحد محدود لهدف مصرح به فقط. لا يكتشف نطاقات أو منافذ إضافية.",
    parameters: obj(
      { target: str("الرابط داخل النطاق المصرح"), category: str("فئة الفحص المسموحة") },
      ["target", "category"],
    ),
    run: async (a) => {
      const decision = checkScope(String(a.target), String(a.category));
      if (!decision.allowed) return { ok: false, blocked: true, decision };
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const started = Date.now();
        const response = await fetch(decision.target, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
        });
        return {
          ok: true,
          target: decision.target,
          status: response.status,
          statusText: response.statusText,
          durationMs: Date.now() - started,
          headers: Object.fromEntries(
            ["content-type", "server", "location", "strict-transport-security"]
              .map((name) => [name, response.headers.get(name)])
              .filter(([, value]) => value !== null),
          ),
        };
      } finally {
        clearTimeout(timer);
      }
    },
  },
  {
    name: "dns_analysis",
    description: "تحليل سجلات DNS لهدف مصرح به عبر DNS-over-HTTPS.",
    parameters: obj(
      { target: str("النطاق أو الرابط داخل النطاق المصرح"), record_type: str("نوع السجل مثل A أو MX"), category: str("فئة الفحص") },
      ["target", "record_type", "category"],
    ),
    run: async (a) => {
      const decision = checkScope(String(a.target), String(a.category));
      if (!decision.allowed) return { ok: false, blocked: true, decision };
      const url = new URL(decision.target);
      const recordType = String(a.record_type || "A").toUpperCase();
      const response = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=${encodeURIComponent(recordType)}`,
        { headers: { accept: "application/dns-json" } },
      );
      if (!response.ok) return { ok: false, error: `DNS service returned ${response.status}` };
      const data = (await response.json()) as { Answer?: Array<Record<string, unknown>> };
      return { ok: true, target: url.hostname, recordType, answers: data.Answer ?? [] };
    },
  },
  {
    name: "security_headers_check",
    description: "فحص رؤوس HTTP الأمنية لهدف مصرح به مع حفظ الدليل الفعلي.",
    parameters: obj(
      { target: str("الرابط داخل النطاق المصرح"), category: str("فئة الفحص") },
      ["target", "category"],
    ),
    run: async (a) => {
      const decision = checkScope(String(a.target), String(a.category));
      if (!decision.allowed) return { ok: false, blocked: true, decision };
      const response = await fetch(decision.target, { method: "HEAD", redirect: "manual" });
      const names = [
        "strict-transport-security",
        "content-security-policy",
        "x-content-type-options",
        "x-frame-options",
        "referrer-policy",
        "permissions-policy",
      ];
      const headers = Object.fromEntries(names.map((name) => [name, response.headers.get(name)]));
      return { ok: true, target: decision.target, status: response.status, headers };
    },
  },
  {
    name: "technology_detection",
    description: "استنتاج تقنيات ظاهرة من رؤوس واستجابة HTTP فعلية لهدف مصرح به.",
    parameters: obj(
      { target: str("الرابط داخل النطاق المصرح"), category: str("فئة الفحص") },
      ["target", "category"],
    ),
    run: async (a) => {
      const decision = checkScope(String(a.target), String(a.category));
      if (!decision.allowed) return { ok: false, blocked: true, decision };
      const response = await fetch(decision.target, { redirect: "manual" });
      const body = (await response.text()).slice(0, 200_000);
      const server = response.headers.get("server");
      const poweredBy = response.headers.get("x-powered-by");
      const technologyMarkers: Array<[string, RegExp]> = [
        ["WordPress", /wp-content|wp-includes/i],
        ["Next.js", /__next_f|next-static/i],
        ["React", /data-reactroot|react-dom/i],
        ["Vue", /data-v-[a-f0-9]+|vue/i],
      ];
      const markers = technologyMarkers
        .filter(([, pattern]) => pattern.test(body))
        .map(([name]) => name);
      return { ok: true, target: decision.target, status: response.status, server, poweredBy, markers };
    },
  },
  {
    name: "job_status",
    description: "قراءة حالة آخر مهمة للمستخدم قبل متابعة أو تشخيص طلب طويل.",
    parameters: obj({}, []),
    run: async (_a, ctx) => {
      const job = await store.latestJob(ctx.ownerId);
      if (!job) return { ok: true, job: null };
      return {
        ok: true,
        job: {
          id: job.id,
          status: job.status,
          title: job.title,
          project_id: job.project_id,
          current_step: job.current_step,
          progress: job.progress,
          step_index: job.step_index,
          total_steps: job.total_steps,
          error: job.error,
          updated_at: job.updated_at,
        },
      };
    },
  },
  {
    name: "control_job",
    description: "إيقاف أو استئناف أو إعادة محاولة أو إلغاء مهمة محفوظة بعد التحقق من ملكيتها.",
    parameters: obj(
      {
        job_id: str("معرّف المهمة"),
        action: { type: "string", enum: ["pause", "resume", "retry", "cancel"] },
      },
      ["job_id", "action"],
    ),
    run: async (a, ctx) => {
      const action = String(a.action);
      if (!["pause", "resume", "retry", "cancel"].includes(action))
        return { ok: false, error: "إجراء مهمة غير صالح" };
      const job = await store.controlJob(
        ctx.ownerId,
        String(a.job_id),
        action as "pause" | "resume" | "retry" | "cancel",
      );
      return job
        ? { ok: true, job_id: job.id, status: job.status }
        : { ok: false, error: "المهمة غير موجودة أو لا تخص هذا المستخدم" };
    },
  },
  {
    name: "web_search",
    description:
      "بحث حي بالإنترنت. استخدمه لأي سؤال عن إصدارات، مكتبات، أخطاء حديثة، أو توثيق رسمي.",
    parameters: obj({ query: str("عبارة البحث") }, ["query"]),
    run: async (a, ctx) => {
      const results = await webSearch(String(a.query));
      await store.saveResearch(ctx.ownerId, String(a.query), results);
      return { ok: true, results: results.slice(0, 6) };
    },
  },
  {
    name: "open_url",
    description: "فتح صفحة/توثيق وقراءة نصها لاستخراج معلومة دقيقة.",
    parameters: obj({ url: str("رابط الصفحة") }, ["url"]),
    run: async (a) => ({ ok: true, ...(await openUrl(String(a.url))) }),
  },
  {
    name: "create_project",
    description: "إنشاء مشروع جديد للمستخدم. استخدمه قبل إنشاء ملفات مشروع جديد.",
    parameters: obj(
      {
        name: str("اسم المشروع"),
        description: str("وصف قصير"),
        technology: str("التقنيات، مثلاً python/fastapi"),
      },
      ["name", "description", "technology"],
    ),
    run: async (a, ctx) => {
      const p = await store.createProject({
        ownerId: ctx.ownerId,
        chatId: ctx.chatId,
        name: String(a.name),
        description: String(a.description ?? ""),
        technology: String(a.technology ?? ""),
      });
      ctx.projectId = p.id;
      return { ok: true, project_id: p.id, name: p.name };
    },
  },
  {
    name: "list_projects",
    description: "عرض مشاريع المستخدم الحالية.",
    parameters: obj({}, []),
    run: async (_a, ctx) => {
      const ps = await store.listProjects(ctx.ownerId);
      return {
        ok: true,
        projects: ps.map((p) => ({
          id: p.id,
          name: p.name,
          technology: p.technology,
          updated_at: p.updated_at,
        })),
      };
    },
  },
  {
    name: "update_project",
    description: "تحديث metadata مشروع المستخدم الحالي دون إنشاء مشروع بديل.",
    parameters: obj(
      {
        project_id: str("معرف المشروع"),
        name: str("اسم المشروع"),
        description: str("وصف المشروع"),
        technology: str("التقنيات"),
        status: str("حالة المشروع"),
      },
      ["project_id"],
    ),
    run: async (a, ctx) => {
      const project = await store.updateProject(ctx.ownerId, String(a.project_id), {
        ...(a.name !== undefined ? { name: String(a.name) } : {}),
        ...(a.description !== undefined ? { description: String(a.description) } : {}),
        ...(a.technology !== undefined ? { technology: String(a.technology) } : {}),
        ...(a.status !== undefined ? { status: String(a.status) } : {}),
      });
      return project ? { ok: true, project_id: project.id, updated_at: project.updated_at } : { ok: false, error: "المشروع غير موجود أو لا يخص المستخدم" };
    },
  },
  {
    name: "list_files",
    description: "عرض ملفات المشروع الحالي مع الأحجام والإصدارات.",
    parameters: obj({}, []),
    run: async (_a, ctx) => {
      const pid = await needProject(ctx);
      const fs = await store.listFiles(pid);
      return {
        ok: true,
        files: fs.map((f) => ({ path: f.path, bytes: f.bytes, version: f.version })),
      };
    },
  },
  {
    name: "read_file",
    description: "قراءة محتوى ملف من المشروع الحالي.",
    parameters: obj({ path: str("مسار الملف داخل المشروع") }, ["path"]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const f = await store.readFile(pid, String(a.path));
      if (!f) return { ok: false, error: "الملف غير موجود" };
      return { ok: true, path: f.path, version: f.version, content: f.content.slice(0, 20000) };
    },
  },
  {
    name: "write_file",
    description:
      "إنشاء أو استبدال ملف داخل المشروع (يحفظ نسخة من القديم تلقائياً). للملفات الطويلة اكتبها على أجزاء عبر append_file.",
    parameters: obj(
      { path: str("مسار الملف"), content: str("المحتوى الكامل"), note: str("سبب التعديل") },
      ["path", "content", "note"],
    ),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const r = await store.writeFile({
        projectId: pid,
        path: String(a.path),
        content: String(a.content),
        note: String(a.note ?? ""),
      });
      return {
        ok: true,
        path: r.file.path,
        version: r.version,
        bytes: r.file.bytes,
        created: r.created,
      };
    },
  },
  {
    name: "append_file",
    description: "إضافة جزء إلى نهاية ملف موجود — للتوليد المُقطّع (chunked) للملفات الطويلة جداً.",
    parameters: obj({ path: str("مسار الملف"), content: str("الجزء المُضاف") }, [
      "path",
      "content",
    ]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const existing = await store.readFile(pid, String(a.path));
      const merged = (existing?.content ?? "") + (existing ? "\n" : "") + String(a.content);
      const r = await store.writeFile({
        projectId: pid,
        path: String(a.path),
        content: merged,
        note: "chunk",
      });
      return {
        ok: true,
        path: r.file.path,
        total_lines: merged.split("\n").length,
        version: r.version,
      };
    },
  },
  {
    name: "update_file",
    description: "استبدال نص محدد داخل ملف (إصلاح دقيق بدون إعادة كتابة كل الملف).",
    parameters: obj(
      { path: str("مسار الملف"), find: str("النص القديم"), replace: str("النص الجديد") },
      ["path", "find", "replace"],
    ),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const f = await store.readFile(pid, String(a.path));
      if (!f) return { ok: false, error: "الملف غير موجود" };
      if (!f.content.includes(String(a.find)))
        return { ok: false, error: "النص المطلوب غير موجود في الملف" };
      const next = f.content.replace(String(a.find), String(a.replace));
      const r = await store.writeFile({
        projectId: pid,
        path: f.path,
        content: next,
        note: "update",
      });
      return { ok: true, path: f.path, version: r.version };
    },
  },
  {
    name: "delete_file",
    description: "حذف ملف من المشروع.",
    parameters: obj({ path: str("مسار الملف") }, ["path"]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      await store.deleteFile(pid, String(a.path));
      return { ok: true };
    },
  },
  {
    name: "search_project",
    description: "بحث نصي داخل كل ملفات المشروع (للعثور على دالة أو خطأ).",
    parameters: obj({ query: str("النص المطلوب") }, ["query"]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      return { ok: true, matches: await store.searchProject(pid, String(a.query)) };
    },
  },
  {
    name: "restore_version",
    description: "إرجاع ملف إلى نسخة سابقة.",
    parameters: obj(
      { path: str("مسار الملف"), version: { type: "integer", description: "رقم النسخة" } },
      ["path", "version"],
    ),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const r = await store.restoreVersion(pid, String(a.path), Number(a.version));
      return { ok: true, path: r.file.path, version: r.version };
    },
  },
  {
    name: "lint_python",
    description:
      "فحص ثابت حقيقي لملف Python: أقواس غير مغلقة، ':' ناقصة، مسافات مختلطة، أسرار داخل الكود. استخدمه بعد كتابة أي ملف بايثون.",
    parameters: obj({ path: str("مسار ملف .py داخل المشروع") }, ["path"]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const f = await store.readFile(pid, String(a.path));
      if (!f) return { ok: false, error: "الملف غير موجود" };
      const res = lintPython(f.content);
      return { ok: true, path: f.path, ...res };
    },
  },
  {
    name: "inspect_dependencies",
    description:
      "استخراج الاعتماديات الخارجية من ملفات بايثون في المشروع (لبناء requirements.txt).",
    parameters: obj({}, []),
    run: async (_a, ctx) => {
      const pid = await needProject(ctx);
      const fs = await store.listFiles(pid);
      return {
        ok: true,
        dependencies: inspectDependencies(fs.map((f) => ({ path: f.path, content: f.content }))),
      };
    },
  },
  {
    name: "run_python",
    description:
      "تنفيذ كود بايثون فعلياً. غير متاح في هذه البيئة (لا يوجد sandbox معزول)، ويرجع رفضاً صريحاً — لا تدّعِ أبداً أنك نفذت الكود.",
    parameters: obj({ path: str("مسار الملف") }, ["path"]),
    run: async () => ({
      ok: false,
      unavailable: true,
      error:
        "تنفيذ الكود غير مفعّل: يحتاج sandbox معزول (CPU/RAM/timeout/network policy) خارج هذا الخادم. المتاح حالياً: فحص ثابت عبر lint_python. أبلغ المستخدم بالحقيقة.",
    }),
  },
  {
    name: "generate_zip",
    description:
      "حزم كل ملفات المشروع في ملف ZIP حقيقي وإرساله للمستخدم (يستثني .env والمفاتيح تلقائياً).",
    parameters: obj({}, []),
    run: async (_a, ctx) => {
      const pid = await needProject(ctx);
      const project = await store.getProject(ctx.ownerId, pid);
      const files = await store.listFiles(pid);
      const kept = files.filter((f) => !EXCLUDED_FROM_ZIP.test(f.path));
      if (!kept.length) return { ok: false, error: "لا توجد ملفات بالمشروع بعد" };
      const tree: Record<string, Uint8Array> = {};
      for (const f of kept) tree[f.path] = strToU8(f.content);
      const zipped = zipSync(tree, { level: 6 });
      const name = `${(project?.name ?? "project").replace(/[^\w.-]+/g, "_")}.zip`;
      ctx.deliveries.push({ name, buffer: Buffer.from(zipped) });
      return { ok: true, file: name, files: kept.length, skipped: files.length - kept.length };
    },
  },
  {
    name: "send_file",
    description: "إرسال ملف من المشروع للمستخدم في تلكرام كمستند.",
    parameters: obj({ path: str("مسار الملف") }, ["path"]),
    run: async (a, ctx) => {
      const pid = await needProject(ctx);
      const f = await store.readFile(pid, String(a.path));
      if (!f) return { ok: false, error: "الملف غير موجود" };
      ctx.deliveries.push({
        name: f.path.split("/").pop()!,
        buffer: Buffer.from(f.content, "utf8"),
      });
      return { ok: true, sent: f.path, bytes: f.bytes };
    },
  },
];

export const TOOL_SCHEMAS = TOOLS.map((t) => ({
  type: "function" as const,
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

export async function executeTool(name: string, args: any, ctx: ToolContext): Promise<ToolResult> {
  const def = TOOLS.find((t) => t.name === name);
  if (!def) return { ok: false, error: `أداة غير معروفة: ${name}` };
  const started = Date.now();
  try {
    const out = await def.run(args ?? {}, ctx);
    await store.logToolCall({
      ownerId: ctx.ownerId,
      projectId: ctx.projectId,
      jobId: ctx.jobId,
      tool: name,
      input: args,
      outputSummary: JSON.stringify(out).slice(0, 1500),
      ok: out.ok !== false,
      durationMs: Date.now() - started,
    });
    return out;
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    await store.logToolCall({
      ownerId: ctx.ownerId,
      projectId: ctx.projectId,
      jobId: ctx.jobId,
      tool: name,
      input: args,
      outputSummary: msg,
      ok: false,
      durationMs: Date.now() - started,
    });
    return { ok: false, error: msg };
  }
}
