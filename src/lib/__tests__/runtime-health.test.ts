import { afterEach, describe, expect, it } from "vitest";
import { getRuntimeHealth } from "../runtime-health";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
});

describe("runtime health", () => {
  it("reports configuration presence without exposing secret values", () => {
    process.env.GIT_COMMIT = "abcdef1234567890";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "configured";
    process.env.TELEGRAM_BOT_TOKEN = "configured";
    process.env.LOVABLE_API_KEY = "configured";

    const health = getRuntimeHealth();

    expect(health).toMatchObject({
      ok: true,
      app: "ALYSSA CYBER",
      version: "abcdef123456",
      gitCommit: "abcdef1234567890",
      database: true,
      telegram: true,
      aiGateway: true,
      webhookConfigured: true,
    });
    expect(JSON.stringify(health)).not.toContain("configured");
  });
});