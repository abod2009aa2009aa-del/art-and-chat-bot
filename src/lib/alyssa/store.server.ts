/* eslint-disable @typescript-eslint/no-explicit-any */

// ALYSSA CYBER — Persistence layer (projects, files, versions, jobs, logs).
// Server-only. All access goes through the service-role client; the tables are
// locked (RLS on, no policies) so nothing can reach them from a browser.

export type Project = {
  id: string;
  owner_id: number;
  chat_id: number | null;
  name: string;
  description: string | null;
  technology: string | null;
  status: string;
  state: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language: string | null;
  version: number;
  bytes: number;
  updated_at: string;
};

export type Job = {
  id: string;
  owner_id: number;
  chat_id: number;
  project_id: string | null;
  title: string;
  status: string;
  current_step: string | null;
  step_index: number;
  total_steps: number;
  progress: number;
  plan: unknown;
  last_successful_chunk: string | null;
  error: string | null;
  retry_count: number;
  progress_message_id: number | null;
  updated_at: string;
};

export const JOB_STATUSES = [
  "queued",
  "planning",
  "generating",
  "analyzing",
  "testing",
  "repairing",
  "packaging",
  "completed",
  "failed",
  "paused",
  "resuming",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

async function sb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function log(
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const safe = message.replace(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_TOKEN]");
  try {
    const c = await sb();
    await c
      .from("alyssa_logs")
      .insert({ level, scope, message: safe.slice(0, 4000), meta: meta ?? null });
  } catch (e) {
    console.error("[alyssa-log] failed", e);
  }
  if (level === "error") console.error(`[${scope}] ${safe}`);
  else console.log(`[${scope}] ${safe}`);
}

export async function logToolCall(row: {
  ownerId: number | null;
  projectId?: string | null;
  jobId?: string | null;
  tool: string;
  input: unknown;
  outputSummary: string;
  ok: boolean;
  durationMs: number;
}) {
  try {
    const c = await sb();
    await c.from("alyssa_tool_calls").insert({
      owner_id: row.ownerId,
      project_id: row.projectId ?? null,
      job_id: row.jobId ?? null,
      tool: row.tool,
      input: row.input ?? null,
      output_summary: row.outputSummary.slice(0, 2000),
      ok: row.ok,
      duration_ms: row.durationMs,
    });
  } catch (e) {
    console.error("[tool-call-log] failed", e);
  }
}

export async function upsertUser(u: {
  id: number;
  username?: string | null;
  first_name?: string | null;
  isDeveloper: boolean;
}) {
  try {
    const c = await sb();
    await c.from("alyssa_users").upsert(
      {
        telegram_id: u.id,
        username: u.username ?? null,
        first_name: u.first_name ?? null,
        is_developer: u.isDeveloper,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "telegram_id" },
    );
  } catch (e) {
    console.error("[users] upsert failed", e);
  }
}

// ---------- Projects ----------

export async function createProject(p: {
  ownerId: number;
  chatId: number;
  name: string;
  description?: string;
  technology?: string;
}): Promise<Project> {
  const c = await sb();
  const { data, error } = await c
    .from("alyssa_projects")
    .insert({
      owner_id: p.ownerId,
      chat_id: p.chatId,
      name: p.name.slice(0, 120),
      description: p.description ?? null,
      technology: p.technology ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`createProject: ${error.message}`);
  return data as Project;
}

export async function listProjects(ownerId: number, limit = 20): Promise<Project[]> {
  const c = await sb();
  const { data, error } = await c
    .from("alyssa_projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listProjects: ${error.message}`);
  return (data ?? []) as Project[];
}

export async function getProject(ownerId: number, projectId: string): Promise<Project | null> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  return (data as Project) ?? null;
}

export async function findProjectByName(ownerId: number, name: string): Promise<Project | null> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_projects")
    .select("*")
    .eq("owner_id", ownerId)
    .ilike("name", name)
    .order("updated_at", { ascending: false })
    .limit(1);
  return ((data ?? [])[0] as Project) ?? null;
}

export async function activeProject(ownerId: number): Promise<Project | null> {
  const list = await listProjects(ownerId, 1);
  return list[0] ?? null;
}

export async function touchProject(projectId: string, patch: Partial<Project> = {}) {
  const c = await sb();
  await c
    .from("alyssa_projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", projectId);
}

export async function updateProject(
  ownerId: number,
  projectId: string,
  patch: { name?: string; description?: string; technology?: string; status?: string; state?: Record<string, unknown> },
) {
  const project = await getProject(ownerId, projectId);
  if (!project) return null;
  const c = await sb();
  const { data, error } = await c
    .from("alyssa_projects")
    .update({
      ...patch,
      ...(patch.name ? { name: patch.name.slice(0, 120) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .select()
    .single();
  if (error) throw new Error(`updateProject: ${error.message}`);
  return data as Project;
}

// ---------- Files + versions ----------

function langOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    tsx: "tsx",
    jsx: "jsx",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    sh: "bash",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
    txt: "text",
    toml: "toml",
  };
  return map[ext] ?? ext ?? "text";
}

export function validateProjectFilePath(input: string): string {
  const path = input.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.includes("\0") || path.split("/").some((part) => part === "..")) {
    throw new Error("مسار ملف غير صالح");
  }
  return path;
}

const MAX_PROJECT_FILE_BYTES = 2_000_000;

export async function writeFile(opts: {
  projectId: string;
  path: string;
  content: string;
  note?: string;
}): Promise<{ file: ProjectFile; version: number; created: boolean }> {
  const c = await sb();
  const path = validateProjectFilePath(opts.path);
  const { data: existing } = await c
    .from("alyssa_files")
    .select("*")
    .eq("project_id", opts.projectId)
    .eq("path", path)
    .maybeSingle();

  const bytes = Buffer.byteLength(opts.content, "utf8");
  if (bytes > MAX_PROJECT_FILE_BYTES) {
    throw new Error(`حجم الملف يتجاوز الحد المسموح (${MAX_PROJECT_FILE_BYTES} bytes)`);
  }
  if (existing) {
    const nextVersion = (existing.version ?? 1) + 1;
    // keep the previous content as an immutable version before overwriting
    await c.from("alyssa_file_versions").insert({
      file_id: existing.id,
      version: existing.version,
      content: existing.content,
      note: opts.note ?? null,
    });
    const { data, error } = await c
      .from("alyssa_files")
      .update({
        content: opts.content,
        version: nextVersion,
        bytes,
        language: langOf(path),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(`writeFile: ${error.message}`);
    await touchProject(opts.projectId);
    return { file: data as ProjectFile, version: nextVersion, created: false };
  }

  const { data, error } = await c
    .from("alyssa_files")
    .insert({
      project_id: opts.projectId,
      path,
      content: opts.content,
      bytes,
      language: langOf(path),
    })
    .select()
    .single();
  if (error) throw new Error(`writeFile: ${error.message}`);
  await touchProject(opts.projectId);
  return { file: data as ProjectFile, version: 1, created: true };
}

export async function readFile(projectId: string, path: string): Promise<ProjectFile | null> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_files")
    .select("*")
    .eq("project_id", projectId)
    .eq("path", path.replace(/^\/+/, ""))
    .maybeSingle();
  return (data as ProjectFile) ?? null;
}

export async function listFiles(projectId: string): Promise<ProjectFile[]> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_files")
    .select("id,project_id,path,language,version,bytes,updated_at,content")
    .eq("project_id", projectId)
    .order("path");
  return (data ?? []) as ProjectFile[];
}

export async function deleteFile(projectId: string, path: string) {
  const c = await sb();
  await c.from("alyssa_files").delete().eq("project_id", projectId).eq("path", path);
}

export async function fileVersions(fileId: string) {
  const c = await sb();
  const { data } = await c
    .from("alyssa_file_versions")
    .select("version,note,created_at")
    .eq("file_id", fileId)
    .order("version", { ascending: false });
  return data ?? [];
}

export async function restoreVersion(projectId: string, path: string, version: number) {
  const file = await readFile(projectId, path);
  if (!file) throw new Error("الملف غير موجود");
  const c = await sb();
  const { data } = await c
    .from("alyssa_file_versions")
    .select("content")
    .eq("file_id", file.id)
    .eq("version", version)
    .maybeSingle();
  if (!data) throw new Error(`النسخة v${version} غير موجودة`);
  return writeFile({ projectId, path, content: data.content, note: `restore v${version}` });
}

export async function searchProject(projectId: string, needle: string) {
  const files = await listFiles(projectId);
  const out: Array<{ path: string; line: number; text: string }> = [];
  const q = needle.toLowerCase();
  for (const f of files) {
    const lines = (f.content ?? "").split("\n");
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes(q) && out.length < 60)
        out.push({ path: f.path, line: i + 1, text: l.trim().slice(0, 200) });
    });
  }
  return out;
}

// ---------- Jobs ----------

export async function createJob(j: {
  ownerId: number;
  chatId: number;
  projectId?: string | null;
  title: string;
  plan?: unknown;
  totalSteps?: number;
  progressMessageId?: number | null;
}): Promise<Job> {
  const c = await sb();
  const { data, error } = await c
    .from("alyssa_jobs")
    .insert({
      owner_id: j.ownerId,
      chat_id: j.chatId,
      project_id: j.projectId ?? null,
      title: j.title.slice(0, 200),
      plan: j.plan ?? [],
      total_steps: j.totalSteps ?? 0,
      status: "queued",
      progress_message_id: j.progressMessageId ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`createJob: ${error.message}`);
  return data as Job;
}

export async function updateJob(jobId: string, patch: Partial<Job>) {
  const c = await sb();
  await c
    .from("alyssa_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

export async function checkpointJob(
  jobId: string,
  checkpoint: {
    status?: JobStatus;
    currentStep?: string | null;
    stepIndex?: number;
    totalSteps?: number;
    progress?: number;
    lastSuccessfulChunk?: string | null;
    error?: string | null;
  },
) {
  await updateJob(jobId, {
    ...(checkpoint.status ? { status: checkpoint.status } : {}),
    ...(checkpoint.currentStep !== undefined ? { current_step: checkpoint.currentStep } : {}),
    ...(checkpoint.stepIndex !== undefined ? { step_index: checkpoint.stepIndex } : {}),
    ...(checkpoint.totalSteps !== undefined ? { total_steps: checkpoint.totalSteps } : {}),
    ...(checkpoint.progress !== undefined
      ? { progress: Math.max(0, Math.min(100, checkpoint.progress)) }
      : {}),
    ...(checkpoint.lastSuccessfulChunk !== undefined
      ? { last_successful_chunk: checkpoint.lastSuccessfulChunk }
      : {}),
    ...(checkpoint.error !== undefined ? { error: checkpoint.error } : {}),
  });
}

export async function controlJob(
  ownerId: number,
  jobId: string,
  action: "pause" | "resume" | "cancel" | "retry",
) {
  const job = await getJob(jobId);
  if (!job || job.owner_id !== ownerId) return null;
  const next: Record<typeof action, JobStatus> = {
    pause: "paused",
    resume: "resuming",
    cancel: "cancelled",
    retry: "resuming",
  };
  if (action === "retry") {
    await updateJob(jobId, { retry_count: (job.retry_count ?? 0) + 1 });
  }
  await checkpointJob(jobId, {
    status: next[action],
    error: null,
    currentStep: action === "cancel" ? "cancelled_by_user" : action,
  });
  return getJob(jobId);
}

export async function addJobStep(
  jobId: string,
  idx: number,
  name: string,
  status: string,
  output?: string,
) {
  const c = await sb();
  await c
    .from("alyssa_job_steps")
    .insert({ job_id: jobId, idx, name, status, output: output?.slice(0, 4000) ?? null });
}

export async function getJob(jobId: string): Promise<Job | null> {
  const c = await sb();
  const { data } = await c.from("alyssa_jobs").select("*").eq("id", jobId).maybeSingle();
  return (data as Job) ?? null;
}

export async function latestJob(ownerId: number): Promise<Job | null> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_jobs")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1);
  return ((data ?? [])[0] as Job) ?? null;
}

export async function runningJob(ownerId: number): Promise<Job | null> {
  const c = await sb();
  const { data } = await c
    .from("alyssa_jobs")
    .select("*")
    .eq("owner_id", ownerId)
    .in("status", [
      "queued",
      "planning",
      "generating",
      "analyzing",
      "testing",
      "repairing",
      "packaging",
      "resuming",
      "paused",
    ])
    .order("created_at", { ascending: false })
    .limit(1);
  return ((data ?? [])[0] as Job) ?? null;
}

export async function jobControlState(ownerId: number, jobId: string): Promise<JobStatus | null> {
  const job = await getJob(jobId);
  if (!job || job.owner_id !== ownerId) return null;
  return JOB_STATUSES.includes(job.status as JobStatus) ? (job.status as JobStatus) : null;
}

export async function saveResearch(ownerId: number | null, query: string, results: unknown) {
  try {
    const c = await sb();
    await c
      .from("alyssa_research")
      .insert({ owner_id: ownerId, query: query.slice(0, 500), results });
  } catch (e) {
    console.error("[research] save failed", e);
  }
}

export async function loadMemorySummary(chatId: number): Promise<{
  summary: string;
  sourceThrough: string;
} | null> {
  const c = await sb();
  const { data, error } = await c
    .from("alyssa_memory_summaries")
    .select("summary,source_through")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) throw new Error(`loadMemorySummary: ${error.message}`);
  return data
    ? { summary: String(data.summary), sourceThrough: String(data.source_through) }
    : null;
}

export async function saveMemorySummary(chatId: number, summary: string, sourceThrough: string) {
  const c = await sb();
  const { error } = await c.from("alyssa_memory_summaries").upsert(
    {
      chat_id: chatId,
      summary: summary.slice(0, 20000),
      source_through: sourceThrough,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "chat_id" },
  );
  if (error) throw new Error(`saveMemorySummary: ${error.message}`);
}
