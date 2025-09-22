import type { PerformanceHistoryOptions } from "../models/types.js";
export declare const sanitizeIntegerFilter: (raw: unknown, { min, max }: {
    min: number;
    max: number;
}) => number | undefined;
export declare const sanitizePerformanceSeverity: (raw: unknown) => "critical" | "high" | "medium" | "low" | undefined;
export declare const normalizeMetricIdFilter: (raw: unknown) => string | undefined;
export declare const resolvePerformanceHistoryOptions: (query: Record<string, any>) => PerformanceHistoryOptions;
//# sourceMappingURL=performanceFilters.d.ts.map