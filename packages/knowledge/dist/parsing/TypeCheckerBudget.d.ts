/**
 * TypeChecker Budget System
 * Controls TypeScript type checker usage to manage performance
 */
/**
 * Manages TypeScript type checker budget to prevent performance degradation
 * The type checker is expensive, so we limit its use per file
 */
export declare class TypeCheckerBudget {
    private tcBudgetRemaining;
    private tcBudgetSpent;
    private readonly DEFAULT_BUDGET;
    /**
     * Initialize budget for a new file
     * @param budget - Optional budget limit, defaults to DEFAULT_BUDGET
     */
    initializeBudget(budget?: number): void;
    /**
     * Reset budget counters
     */
    resetBudget(): void;
    /**
     * Take one unit from the budget
     * @returns True if budget was available and consumed, false otherwise
     */
    takeBudget(): boolean;
    /**
     * Check if type checker should be used based on heuristics
     * Consumes budget when returning true
     *
     * @param opts - Options for determining whether to use type checker
     * @param opts.context - The context in which the type checker is being considered
     * @param opts.imported - Whether the symbol is imported
     * @param opts.ambiguous - Whether the reference is ambiguous
     * @param opts.nameLength - Length of the symbol name
     * @returns True if type checker should be used (and budget was consumed)
     */
    shouldUseTypeChecker(opts: {
        context: "call" | "heritage" | "decorator" | "reference" | "export";
        imported?: boolean;
        ambiguous?: boolean;
        nameLength?: number;
    }): boolean;
    /**
     * Get remaining budget
     * @returns Number of type checker calls remaining
     */
    getRemainingBudget(): number;
    /**
     * Get spent budget
     * @returns Number of type checker calls made
     */
    getSpentBudget(): number;
    /**
     * Get budget statistics
     * @returns Object with budget statistics
     */
    getBudgetStats(): {
        remaining: number;
        spent: number;
        total: number;
        percentUsed: number;
    };
    /**
     * Adjust budget based on file size or complexity
     * @param fileSize - Size of the file in bytes
     * @param complexity - Optional complexity score
     * @returns Calculated budget
     */
    calculateBudgetForFile(fileSize: number, complexity?: number): number;
}
//# sourceMappingURL=TypeCheckerBudget.d.ts.map