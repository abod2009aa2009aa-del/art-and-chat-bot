import { isIP } from "node:net";

export type ScopeDecision = {
  allowed: boolean;
  reason: string;
  target: string;
  activeTesting: boolean;
  category?: string;
};

const rateWindow = new Map<string, { startedAt: number; count: number }>();

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

function examTimeAllowsNow(): boolean {
  const start = env("EXAM_START_TIME");
  const end = env("EXAM_END_TIME");
  const now = Date.now();
  if (start) {
    const value = Date.parse(start);
    if (!Number.isNaN(value) && now < value) return false;
  }
  if (end) {
    const value = Date.parse(end);
    if (!Number.isNaN(value) && now > value) return false;
  }
  return true;
}

function serviceAllowed(url: URL): boolean {
  const allowed = env("ALLOWED_SERVICES")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return true;
  const service = url.port || (url.protocol === "https:" ? "443" : "80");
  return allowed.includes(service) || allowed.includes(url.protocol.replace(":", ""));
}

function rateAllowed(host: string, category: string): boolean {
  const key = `${host}:${category.toLowerCase()}`;
  const now = Date.now();
  const windowMs = 60_000;
  const max = Number.parseInt(env("SECURITY_RATE_LIMIT_PER_MINUTE") || "30", 10);
  const current = rateWindow.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    rateWindow.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= (Number.isFinite(max) ? max : 30)) return false;
  current.count += 1;
  return true;
}

export function isPublicHttpTarget(target: string): boolean {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(url.protocol)) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (["localhost", "localhost.localdomain"].includes(host) || host.endsWith(".localhost")) return false;
  if (isIP(host) === 4) {
    const octets = host.split(".").map(Number);
    const [a, b] = octets;
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168)) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
  }
  if (isIP(host) === 6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:"))) return false;
  return true;
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
      category,
    };
  }
  if (!examTimeAllowsNow()) {
    return { allowed: false, reason: "جلسة الامتحان خارج الوقت المصرح", target: url.href, activeTesting, category };
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
      category,
    };
  }
  if (!serviceAllowed(url)) {
    return { allowed: false, reason: "الخدمة أو المنفذ غير مسموح في جلسة الامتحان", target: url.href, activeTesting, category };
  }
  const targets = configuredTargets();
  if (!targets.length || !targets.some((configured) => hostMatches(url.hostname, configured))) {
    return {
      allowed: false,
      reason: "الهدف خارج النطاق المصرح أو لم يُضبط نطاق امتحان",
      target: url.href,
      activeTesting,
      category,
    };
  }
  if (!rateAllowed(url.hostname, category)) {
    return { allowed: false, reason: "تم تجاوز حد الفحص المؤقت", target: url.href, activeTesting, category };
  }
  return { allowed: true, reason: "الهدف داخل النطاق المصرح", target: url.href, activeTesting, category };
}

export function scopeConfigSummary() {
  return {
    examMode: env("EXAM_MODE").toLowerCase() === "true",
    configured: configuredTargets().length > 0,
    categories: env("ALLOWED_TEST_CATEGORIES")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    services: env("ALLOWED_SERVICES")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    startTime: env("EXAM_START_TIME") || null,
    endTime: env("EXAM_END_TIME") || null,
  };
}
