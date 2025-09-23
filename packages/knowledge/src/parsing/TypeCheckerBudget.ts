/**
 * TypeChecker Budget System
 * Controls TypeScript type checker usage to manage performance
 */

import { noiseConfig } from "../../../config/noise.js";

/**
 * Manages TypeScript type checker budget to prevent performance degradation
 * The type checker is expensive, so we limit its use per file
 */
export class TypeCheckerBudget {
  private tcBudgetRemaining: number = 0;
  private tcBudgetSpent: number = 0;

  // Default budget per file - can be configured
  private readonly DEFAULT_BUDGET = 50;

  /**
   * Initialize budget for a new file
   * @param budget - Optional budget limit, defaults to DEFAULT_BUDGET
   */
  initializeBudget(budget?: number): void {
    this.tcBudgetRemaining = budget ?? this.DEFAULT_BUDGET;
    this.tcBudgetSpent = 0;
  }

  /**
   * Reset budget counters
   */
  resetBudget(): void {
    this.tcBudgetRemaining = 0;
    this.tcBudgetSpent = 0;
  }

  /**
   * Take one unit from the budget
   * @returns True if budget was available and consumed, false otherwise
   */
  takeBudget(): boolean {
    if (!Number.isFinite(this.tcBudgetRemaining)) return false;
    if (this.tcBudgetRemaining <= 0) return false;

    this.tcBudgetRemaining -= 1;
    try {
      this.tcBudgetSpent += 1;
    } catch {}

    return true;
  }

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
  }): boolean {
    try {
      const imported = !!opts.imported;
      const ambiguous = !!opts.ambiguous;
      const len = typeof opts.nameLength === "number" ? opts.nameLength : 0;

      // Check if the name is meaningful enough to warrant type checking
      const usefulName = len >= noiseConfig.AST_MIN_NAME_LENGTH;

      // Determine if we want to use type checker based on heuristics
      const shouldCheck = imported || ambiguous || usefulName;

      if (!shouldCheck) return false;

      // Try to consume budget
      return this.takeBudget();
    } catch {
      return false;
    }
  }

  /**
   * Get remaining budget
   * @returns Number of type checker calls remaining
   */
  getRemainingBudget(): number {
    return this.tcBudgetRemaining;
  }

  /**
   * Get spent budget
   * @returns Number of type checker calls made
   */
  getSpentBudget(): number {
    return this.tcBudgetSpent;
  }

  /**
   * Get budget statistics
   * @returns Object with budget statistics
   */
  getBudgetStats(): {
    remaining: number;
    spent: number;
    total: number;
    percentUsed: number;
  } {
    const total = this.tcBudgetSpent + this.tcBudgetRemaining;
    const percentUsed = total > 0 ? (this.tcBudgetSpent / total) * 100 : 0;

    return {
      remaining: this.tcBudgetRemaining,
      spent: this.tcBudgetSpent,
      total,
      percentUsed: Math.round(percentUsed),
    };
  }

  /**
   * Adjust budget based on file size or complexity
   * @param fileSize - Size of the file in bytes
   * @param complexity - Optional complexity score
   * @returns Calculated budget
   */
  calculateBudgetForFile(fileSize: number, complexity?: number): number {
    // Base budget
    let budget = this.DEFAULT_BUDGET;

    // Adjust based on file size (more budget for larger files)
    if (fileSize > 10000) {
      budget += Math.floor(fileSize / 1000);
    }

    // Adjust based on complexity if provided
    if (complexity && complexity > 10) {
      budget += Math.floor(complexity / 2);
    }

    // Cap at reasonable maximum to prevent excessive type checking
    const MAX_BUDGET = 200;
    return Math.min(budget, MAX_BUDGET);
  }
}