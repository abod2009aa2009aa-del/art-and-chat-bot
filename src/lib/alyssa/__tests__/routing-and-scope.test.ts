import { afterEach, describe, expect, it } from "vitest";
import { routeCapabilities } from "../capability-router";
import { checkScope } from "../scope-guard.server";

const savedEnv = { ...process.env };

afterEach(() => {
  process.env = { ...savedEnv };
});

describe("ALYSSA capability routing", () => {
  it("combines capabilities from one natural-language goal", () => {
    const plan = routeCapabilities({
      text: "صلحي مشروع FastAPI، اختبري الخطأ وابحثي عن التوثيق الحالي",
      fileNames: ["main.py", "requirements.txt"],
    });

    expect(plan.requiredCapabilities).toEqual(
      expect.arrayContaining(["python", "api", "debugging", "research", "testing"]),
    );
    expect(plan.testingRequired).toBe(true);
    expect(plan.researchRequired).toBe(true);
  });

  it("routes mobile Python requests without user capability selection", () => {
    const plan = routeCapabilities({ text: "سويلي تطبيق موبايل ببايثون باستخدام Kivy" });
    expect(plan.requiredCapabilities).toEqual(
      expect.arrayContaining(["python", "python_mobile", "android"]),
    );
  });
});

describe("ScopeGuard", () => {
  it("blocks active testing when exam mode is disabled", () => {
    process.env.EXAM_MODE = "false";
    process.env.EXAM_TARGET_DOMAIN = "example.com";
    const decision = checkScope("https://example.com", "reconnaissance");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("EXAM_MODE");
  });

  it("allows only configured targets and categories", () => {
    process.env.EXAM_MODE = "true";
    process.env.EXAM_TARGET_DOMAIN = "example.com";
    process.env.ALLOWED_TEST_CATEGORIES = "reconnaissance";
    expect(checkScope("https://example.com/login", "reconnaissance").allowed).toBe(true);
    expect(checkScope("https://example.com/login", "port_scan").allowed).toBe(false);
    expect(checkScope("https://outside.test", "reconnaissance").allowed).toBe(false);
  });
});
