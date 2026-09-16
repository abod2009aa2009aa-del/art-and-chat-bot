import { afterEach, describe, expect, it } from "vitest";
import { routeCapabilities } from "../capability-router";
import { checkScope, isPublicHttpTarget } from "../scope-guard.server";
import { validateProjectFilePath } from "../store.server";
import { TOOLS } from "../tools.server";

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

  it("enforces exam time and allowed services", () => {
    process.env.EXAM_MODE = "true";
    process.env.EXAM_TARGET_DOMAIN = "example.com";
    process.env.ALLOWED_TEST_CATEGORIES = "reconnaissance";
    process.env.ALLOWED_SERVICES = "443";
    process.env.EXAM_START_TIME = new Date(Date.now() + 60_000).toISOString();
    expect(checkScope("https://example.com", "reconnaissance").allowed).toBe(false);

    process.env.EXAM_START_TIME = new Date(Date.now() - 60_000).toISOString();
    expect(checkScope("http://example.com", "reconnaissance").allowed).toBe(false);
  });

  it("blocks private and local URL targets", () => {
    expect(isPublicHttpTarget("http://127.0.0.1:8080")).toBe(false);
    expect(isPublicHttpTarget("http://10.0.0.5")).toBe(false);
    expect(isPublicHttpTarget("http://[::1]")).toBe(false);
    expect(isPublicHttpTarget("https://example.com")).toBe(true);
  });

  it("rejects traversal and oversized path forms before persistence", () => {
    expect(validateProjectFilePath("src/main.py")).toBe("src/main.py");
    expect(() => validateProjectFilePath("../../secrets.txt")).toThrow();
    expect(() => validateProjectFilePath("C:\\temp\\file.txt")).not.toThrow();
  });
});

describe("ALYSSA validation capability", () => {
  it("registers real static project validation without claiming execution", () => {
    const tool = TOOLS.find((entry) => entry.name === "validate_project");
    expect(tool).toBeDefined();
    expect(tool?.description).toMatch(/lintPython|static|ساكن|ثابت/i);
    expect(TOOLS.some((entry) => entry.name === "run_python")).toBe(true);
  });
});
