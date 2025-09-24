/**
 * Noise/heuristics configuration with env overrides.
 */
export const floatFromEnv = (key, defaultValue, min, max) => {
    const raw = process.env[key];
    if (raw === undefined)
        return defaultValue;
    const parsed = parseFloat(raw);
    if (isNaN(parsed))
        return defaultValue;
    if (key.includes("PERCENT")) {
        // For percent
        return Math.max(0, Math.min(100, parsed));
    }
    if (key.includes("DELTA")) {
        // For delta
        return Math.max(0, parsed);
    }
    return Math.max(min, Math.min(max, parsed));
};
export const intFromEnv = (key, defaultValue, min, max) => {
    const raw = process.env[key];
    if (raw === undefined)
        return defaultValue;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed))
        return defaultValue;
    return Math.max(Math.max(0, min), Math.min(max, parsed)); // >=0 always
};
function listFromEnv(name) {
    const raw = process.env[name];
    if (!raw)
        return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
export const noiseConfig = {
    // AST heuristics
    AST_MIN_NAME_LENGTH: intFromEnv("AST_MIN_NAME_LENGTH", 3, 1, 32),
    AST_STOPLIST_EXTRA: new Set(listFromEnv("AST_STOPLIST_EXTRA").map((s) => s.toLowerCase())),
    MIN_INFERRED_CONFIDENCE: floatFromEnv("MIN_INFERRED_CONFIDENCE", 0.4, 0, 1),
    AST_CONF_EXTERNAL: floatFromEnv("AST_CONF_EXTERNAL", 0.4, 0, 1),
    AST_CONF_FILE: floatFromEnv("AST_CONF_FILE", 0.6, 0, 1),
    AST_CONF_CONCRETE: floatFromEnv("AST_CONF_CONCRETE", 0.9, 0, 1),
    AST_BOOST_SAME_FILE: floatFromEnv("AST_BOOST_SAME_FILE", 0.0, 0, 1),
    AST_BOOST_TYPECHECK: floatFromEnv("AST_BOOST_TYPECHECK", 0.0, 0, 1),
    AST_BOOST_EXPORTED: floatFromEnv("AST_BOOST_EXPORTED", 0.0, 0, 1),
    AST_STEP_NAME_LEN: floatFromEnv("AST_STEP_NAME_LEN", 0.0, 0, 1),
    AST_PENALTY_IMPORT_DEPTH: floatFromEnv("AST_PENALTY_IMPORT_DEPTH", 0.0, 0, 1),
    // Gate expensive TypeScript checker lookups per file to improve performance at scale
    AST_MAX_TC_LOOKUPS_PER_FILE: intFromEnv("AST_MAX_TC_LOOKUPS_PER_FILE", 200, 0, 100000),
    // Doc/spec linking
    DOC_LINK_MIN_OCCURRENCES: intFromEnv("DOC_LINK_MIN_OCCURRENCES", 2, 1, 10),
    DOC_LINK_LONG_NAME: intFromEnv("DOC_LINK_LONG_NAME", 10, 4, 64),
    DOC_LINK_BASE_CONF: floatFromEnv("DOC_LINK_BASE_CONF", 0.4, 0, 1),
    DOC_LINK_STEP_CONF: floatFromEnv("DOC_LINK_STEP_CONF", 0.2, 0, 1),
    DOC_LINK_STRONG_NAME_CONF: floatFromEnv("DOC_LINK_STRONG_NAME_CONF", 0.8, 0, 1),
    // Security gating
    SECURITY_MIN_SEVERITY: (process.env.SECURITY_MIN_SEVERITY || "medium").toLowerCase(),
    SECURITY_MIN_CONFIDENCE: floatFromEnv("SECURITY_MIN_CONFIDENCE", 0.6, 0, 1),
    // Performance relationship gating
    PERF_MIN_HISTORY: intFromEnv("PERF_MIN_HISTORY", 5, 1, 100),
    PERF_TREND_MIN_RUNS: intFromEnv("PERF_TREND_MIN_RUNS", 3, 1, 50),
    PERF_DEGRADING_MIN_DELTA_MS: intFromEnv("PERF_DEGRADING_MIN_DELTA_MS", 200, 0, 100000),
    PERF_IMPACT_AVG_MS: intFromEnv("PERF_IMPACT_AVG_MS", 1500, 0, 600000),
    PERF_IMPACT_P95_MS: intFromEnv("PERF_IMPACT_P95_MS", 2000, 0, 600000),
    PERF_SEVERITY_PERCENT_CRITICAL: floatFromEnv("PERF_SEVERITY_PERCENT_CRITICAL", 50, 0, 100),
    PERF_SEVERITY_PERCENT_HIGH: floatFromEnv("PERF_SEVERITY_PERCENT_HIGH", 25, 0, 100),
    PERF_SEVERITY_PERCENT_MEDIUM: floatFromEnv("PERF_SEVERITY_PERCENT_MEDIUM", 10, 0, 100),
    PERF_SEVERITY_PERCENT_LOW: floatFromEnv("PERF_SEVERITY_PERCENT_LOW", 5, 0, 100),
    PERF_SEVERITY_DELTA_CRITICAL: floatFromEnv("PERF_SEVERITY_DELTA_CRITICAL", 2000, 0, Infinity),
    PERF_SEVERITY_DELTA_HIGH: floatFromEnv("PERF_SEVERITY_DELTA_HIGH", 1000, 0, Infinity),
    PERF_SEVERITY_DELTA_MEDIUM: floatFromEnv("PERF_SEVERITY_DELTA_MEDIUM", 250, 0, Infinity),
    PERF_SEVERITY_DELTA_LOW: floatFromEnv("PERF_SEVERITY_DELTA_LOW", 0, 0, Infinity),
};
//# sourceMappingURL=noise.js.map