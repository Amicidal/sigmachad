/**
 * Noise/heuristics configuration with env overrides.
 */
export declare const floatFromEnv: (key: string, defaultValue: number, min: number, max: number) => number;
export declare const intFromEnv: (key: string, defaultValue: number, min: number, max: number) => number;
export declare const noiseConfig: {
    AST_MIN_NAME_LENGTH: number;
    AST_STOPLIST_EXTRA: Set<string>;
    MIN_INFERRED_CONFIDENCE: number;
    AST_CONF_EXTERNAL: number;
    AST_CONF_FILE: number;
    AST_CONF_CONCRETE: number;
    AST_BOOST_SAME_FILE: number;
    AST_BOOST_TYPECHECK: number;
    AST_BOOST_EXPORTED: number;
    AST_STEP_NAME_LEN: number;
    AST_PENALTY_IMPORT_DEPTH: number;
    AST_MAX_TC_LOOKUPS_PER_FILE: number;
    DOC_LINK_MIN_OCCURRENCES: number;
    DOC_LINK_LONG_NAME: number;
    DOC_LINK_BASE_CONF: number;
    DOC_LINK_STEP_CONF: number;
    DOC_LINK_STRONG_NAME_CONF: number;
    SECURITY_MIN_SEVERITY: string;
    SECURITY_MIN_CONFIDENCE: number;
    PERF_MIN_HISTORY: number;
    PERF_TREND_MIN_RUNS: number;
    PERF_DEGRADING_MIN_DELTA_MS: number;
    PERF_IMPACT_AVG_MS: number;
    PERF_IMPACT_P95_MS: number;
    PERF_SEVERITY_PERCENT_CRITICAL: number;
    PERF_SEVERITY_PERCENT_HIGH: number;
    PERF_SEVERITY_PERCENT_MEDIUM: number;
    PERF_SEVERITY_PERCENT_LOW: number;
    PERF_SEVERITY_DELTA_CRITICAL: number;
    PERF_SEVERITY_DELTA_HIGH: number;
    PERF_SEVERITY_DELTA_MEDIUM: number;
    PERF_SEVERITY_DELTA_LOW: number;
};
//# sourceMappingURL=noise.d.ts.map