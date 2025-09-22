import { sanitizeEnvironment } from "./environment.js";
import { normalizeMetricIdForId } from "./codeEdges.js";
export const sanitizeIntegerFilter = (raw, { min, max }) => {
    const value = typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim().length > 0
            ? Number.parseInt(raw, 10)
            : undefined;
    if (value === undefined || !Number.isFinite(value))
        return undefined;
    const integer = Math.floor(value);
    if (!Number.isFinite(integer))
        return undefined;
    return Math.min(max, Math.max(min, integer));
};
export const sanitizePerformanceSeverity = (raw) => {
    if (typeof raw !== "string")
        return undefined;
    const normalized = raw.trim().toLowerCase();
    switch (normalized) {
        case "critical":
        case "high":
        case "medium":
        case "low":
            return normalized;
        default:
            return undefined;
    }
};
export const normalizeMetricIdFilter = (raw) => {
    if (typeof raw !== "string")
        return undefined;
    const trimmed = raw.trim();
    if (!trimmed)
        return undefined;
    const normalized = normalizeMetricIdForId(trimmed);
    if (!normalized)
        return undefined;
    if (normalized === "unknown" && trimmed.toLowerCase() !== "unknown") {
        return undefined;
    }
    return normalized;
};
export const resolvePerformanceHistoryOptions = (query) => {
    const metricId = normalizeMetricIdFilter(query.metricId);
    const environment = typeof query.environment === "string" && query.environment.trim().length > 0
        ? sanitizeEnvironment(query.environment)
        : undefined;
    const severity = sanitizePerformanceSeverity(query.severity);
    const limit = sanitizeIntegerFilter(query.limit, { min: 1, max: 500 });
    const days = sanitizeIntegerFilter(query.days, { min: 1, max: 365 });
    return {
        metricId,
        environment,
        severity,
        limit,
        days,
    };
};
//# sourceMappingURL=performanceFilters.js.map