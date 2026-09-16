export type RuntimeHealthStatus = {
  ok: boolean;
  app: string;
  version: string;
  gitCommit: string;
  database: boolean;
  telegram: boolean;
  aiGateway: boolean;
  examMode: boolean;
  webhookConfigured: boolean;
  timestamp: string;
};

export function getRuntimeHealth(): RuntimeHealthStatus {
  const gitCommit =
    process.env.GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    "unavailable";

  return {
    ok: true,
    app: "ALYSSA CYBER",
    version: gitCommit === "unavailable" ? "local-dev" : gitCommit.slice(0, 12),
    gitCommit,
    database: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    aiGateway: Boolean(process.env.LOVABLE_API_KEY),
    examMode: (process.env.EXAM_MODE ?? "false").toLowerCase() === "true",
    webhookConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    timestamp: new Date().toISOString(),
  };
}
