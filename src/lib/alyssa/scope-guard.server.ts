import { isIP } from "node:net";

export type ScopeDecision = {
  allowed: boolean;
  reason: string;
  target: string;
  activeTesting: boolean;
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function hostMatches(host: string, configured: string): boolean {
  const value = configured
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0];
  const normalized = host.toLowerCase().replace(/\.$/, "");
  if (!value) return false;
  if (isIP(value)) return normalized === value;
  return normalized === value || normalized.endsWith(`.${value}`);
}

function configuredTargets(): string[] {
  return [env("EXAM_TARGET_URL"), env("EXAM_TARGET_DOMAIN"), env("EXAM_TARGET_IP")].filter(Boolean);
}

export function checkScope(target: string, category = "general"): ScopeDecision {
  const activeTesting = env("EXAM_MODE").toLowerCase() === "true";
  if (!target) return { allowed: false, reason: "الهدف مطلوب", target, activeTesting };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
  } catch {
    return { allowed: false, reason: "الهدف ليس رابطًا صالحًا", target, activeTesting };
  }
  if (!activeTesting) {
    return {
      allowed: false,
      reason: "الفحص النشط متوقف: EXAM_MODE ليس مفعّلًا",
      target: url.href,
      activeTesting,
    };
  }
  const allowedCategories = env("ALLOWED_TEST_CATEGORIES")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowedCategories.length && !allowedCategories.includes(category.toLowerCase())) {
    return {
      allowed: false,
      reason: `فئة الفحص غير مسموحة: ${category}`,
      target: url.href,
      activeTesting,
    };
  }
  const targets = configuredTargets();
  if (!targets.length || !targets.some((configured) => hostMatches(url.hostname, configured))) {
    return {
      allowed: false,
      reason: "الهدف خارج النطاق المصرح أو لم يُضبط نطاق امتحان",
      target: url.href,
      activeTesting,
    };
  }
  return { allowed: true, reason: "الهدف داخل النطاق المصرح", target: url.href, activeTesting };
}

export function scopeConfigSummary() {
  return {
    examMode: env("EXAM_MODE").toLowerCase() === "true",
    configured: configuredTargets().length > 0,
    categories: env("ALLOWED_TEST_CATEGORIES")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}
