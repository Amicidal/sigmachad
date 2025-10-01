const sanitizeString = (value: unknown, max = 256): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

export const sanitizeEnvironment = (value: unknown): string => {
  const raw = sanitizeString(value, 64) || "";
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/g, "")
    .replace(/-$/g, "");

  const allowed = new Set([
    "dev",
    "staging",
    "prod",
    "production",
    "perf-lab",
    "qa",
    "test",
    "local",
  ]);

  if (allowed.has(normalized)) {
    return normalized === "production" ? "prod" : normalized;
  }

  if (normalized.startsWith("prod")) {
    return normalized === "prod" ? "prod" : normalized;
  }
  if (normalized.startsWith("stag")) return "staging";
  if (normalized.startsWith("perf")) return "perf-lab";
  if (normalized.startsWith("qa")) return "qa";
  if (normalized.startsWith("test")) return "test";
  if (normalized.startsWith("dev")) return "dev";

  return normalized || "unknown";
};
