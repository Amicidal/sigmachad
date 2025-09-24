/**
 * Advanced conflict resolution engine with visual diff generation and smart merge strategies
 */

import { EventEmitter } from 'events';
// import { diffLines, diffWords, diffChars, Change } from 'diff';

// Simple diff implementation to replace external dependency
interface Change {
  added?: boolean;
  removed?: boolean;
  value: string;
}

function diffLines(oldStr: string, newStr: string): Change[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const changes: Change[] = [];

  // Simple line-by-line comparison
  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) {
      changes.push({ added: true, value: newLine + '\n' });
    } else if (newLine === undefined) {
      changes.push({ removed: true, value: oldLine + '\n' });
    } else if (oldLine !== newLine) {
      changes.push({ removed: true, value: oldLine + '\n' });
      changes.push({ added: true, value: newLine + '\n' });
    } else {
      changes.push({ value: oldLine + '\n' });
    }
  }

  return changes;
}

function diffWords(oldStr: string, newStr: string): Change[] {
  const oldWords = oldStr.split(/\s+/);
  const newWords = newStr.split(/\s+/);
  const changes: Change[] = [];

  // Simple word-by-word comparison
  const maxWords = Math.max(oldWords.length, newWords.length);
  for (let i = 0; i < maxWords; i++) {
    const oldWord = oldWords[i];
    const newWord = newWords[i];

    if (oldWord === undefined) {
      changes.push({ added: true, value: newWord + ' ' });
    } else if (newWord === undefined) {
      changes.push({ removed: true, value: oldWord + ' ' });
    } else if (oldWord !== newWord) {
      changes.push({ removed: true, value: oldWord + ' ' });
      changes.push({ added: true, value: newWord + ' ' });
    } else {
      changes.push({ value: oldWord + ' ' });
    }
  }

  return changes;
}

function diffChars(oldStr: string, newStr: string): Change[] {
  const changes: Change[] = [];
  const maxLen = Math.max(oldStr.length, newStr.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChar = oldStr[i];
    const newChar = newStr[i];

    if (oldChar === undefined) {
      changes.push({ added: true, value: newChar });
    } else if (newChar === undefined) {
      changes.push({ removed: true, value: oldChar });
    } else if (oldChar !== newChar) {
      changes.push({ removed: true, value: oldChar });
      changes.push({ added: true, value: newChar });
    } else {
      changes.push({ value: oldChar });
    }
  }

  return changes;
}
import {
  RollbackConflict,
  ConflictType,
  ConflictStrategy,
  ConflictResolution,
  DiffEntry,
  RollbackLogEntry,
  RollbackError
} from './RollbackTypes.js';

/**
 * Visual diff representation
 */
interface VisualDiff {
  id: string;
  type: 'line' | 'word' | 'char' | 'json' | 'semantic';
  conflict: RollbackConflict;
  changes: DiffLine[];
  summary: DiffSummary;
  metadata: {
    totalLines: number;
    addedLines: number;
    removedLines: number;
    modifiedLines: number;
    similarity: number; // 0-100%
  };
}

interface DiffLine {
  lineNumber?: number;
  type: 'added' | 'removed' | 'modified' | 'context';
  content: string;
  originalContent?: string;
  confidence: number; // 0-100%
  tokens?: DiffToken[];
}

interface DiffToken {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
  position: { start: number; end: number };
}

interface DiffSummary {
  conflictType: ConflictType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  recommendedStrategy: ConflictStrategy;
  reason: string;
  impact: {
    entities: string[];
    relationships: string[];
    dependencies: string[];
  };
}

/**
 * Merge result for conflict resolution
 */
interface MergeResult {
  success: boolean;
  mergedValue: any;
  strategy: ConflictStrategy;
  confidence: number; // 0-100%
  warnings: string[];
  appliedChanges: {
    kept: string[];
    discarded: string[];
    merged: string[];
  };
}

/**
 * Smart merge strategy configuration
 */
interface SmartMergeConfig {
  preferNewer: boolean;
  preferLarger: boolean;
  preserveStructure: boolean;
  allowPartialMerge: boolean;
  maxComplexity: number;
  semanticAnalysis: boolean;
}

/**
 * Conflict resolution context
 */
interface ConflictContext {
  rollbackId: string;
  entityType?: string;
  path: string[];
  metadata?: Record<string, any>;
  dependencies?: string[];
  priority: number;
}

/**
 * Advanced conflict resolution engine
 */
export class ConflictResolutionEngine extends EventEmitter {
  private mergeConfig: SmartMergeConfig = {
    preferNewer: true,
    preferLarger: false,
    preserveStructure: true,
    allowPartialMerge: true,
    maxComplexity: 1000,
    semanticAnalysis: true
  };

  constructor(config?: Partial<SmartMergeConfig>) {
    super();
    if (config) {
      this.mergeConfig = { ...this.mergeConfig, ...config };
    }
  }

  /**
   * Generate visual diff for a conflict
   */
  async generateVisualDiff(conflict: RollbackConflict): Promise<VisualDiff> {
    const diffId = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Determine the best diff type based on content
      const diffType = this.determineDiffType(conflict.currentValue, conflict.rollbackValue);

      // Generate the appropriate diff
      const changes = await this.generateDiff(
        conflict.currentValue,
        conflict.rollbackValue,
        diffType
      );

      // Analyze the diff for metadata
      const metadata = this.analyzeDiff(changes);

      // Create summary with recommendations
      const summary = await this.createDiffSummary(conflict, changes, metadata);

      return {
        id: diffId,
        type: diffType,
        conflict,
        changes,
        summary,
        metadata
      };

    } catch (error) {
      throw new RollbackError(
        'Failed to generate visual diff',
        'VISUAL_DIFF_FAILED',
        {
          conflictPath: conflict.path,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Apply smart merge strategy to resolve conflict
   */
  async smartMerge(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {
      // Analyze conflict complexity
      const complexity = this.analyzeConflictComplexity(conflict);
      if (complexity > this.mergeConfig.maxComplexity) {
        return {
          success: false,
          mergedValue: null,
          strategy: ConflictStrategy.ASK_USER,
          confidence: 0,
          warnings: ['Conflict too complex for automatic merge'],
          appliedChanges: { kept: [], discarded: [], merged: [] }
        };
      }

      // Determine best merge strategy
      const strategy = await this.determineBestStrategy(conflict, context);

      // Apply the chosen strategy
      switch (strategy) {
        case ConflictStrategy.MERGE:
          return await this.performIntelligentMerge(conflict, context);

        case ConflictStrategy.OVERWRITE:
          return this.performOverwrite(conflict, 'rollback');

        case ConflictStrategy.SKIP:
          return this.performSkip(conflict);

        default:
          return {
            success: false,
            mergedValue: null,
            strategy: ConflictStrategy.ASK_USER,
            confidence: 0,
            warnings: ['Strategy not supported for smart merge'],
            appliedChanges: { kept: [], discarded: [], merged: [] }
          };
      }

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.ABORT,
        confidence: 0,
        warnings: [`Merge failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }

  /**
   * Generate interactive conflict resolution UI data
   */
  async generateConflictUI(conflict: RollbackConflict): Promise<{
    visualDiff: VisualDiff;
    options: ConflictResolutionOption[];
    recommendations: {
      primary: ConflictResolutionOption;
      alternatives: ConflictResolutionOption[];
    };
  }> {
    const visualDiff = await this.generateVisualDiff(conflict);
    const options = await this.generateResolutionOptions(conflict);

    // Sort options by confidence/safety
    const sortedOptions = options.sort((a, b) => b.confidence - a.confidence);

    return {
      visualDiff,
      options,
      recommendations: {
        primary: sortedOptions[0],
        alternatives: sortedOptions.slice(1)
      }
    };
  }

  /**
   * Batch process multiple conflicts with intelligent grouping
   */
  async batchResolveConflicts(
    conflicts: RollbackConflict[],
    resolution: ConflictResolution,
    context?: ConflictContext
  ): Promise<Map<string, MergeResult>> {
    const results = new Map<string, MergeResult>();

    // Group related conflicts
    const conflictGroups = this.groupRelatedConflicts(conflicts);

    for (const group of conflictGroups) {
      // Process each group independently
      for (const conflict of group) {
        const result = await this.resolveConflict(conflict, resolution, context);
        results.set(conflict.path, result);
      }
    }

    return results;
  }

  /**
   * Single conflict resolution with fallback strategies
   */
  async resolveConflict(
    conflict: RollbackConflict,
    resolution: ConflictResolution,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {
      // Try primary strategy first
      const primaryResult = await this.applyResolutionStrategy(conflict, resolution.strategy, context);

      if (primaryResult.success && primaryResult.confidence >= 70) {
        return primaryResult;
      }

      // If primary strategy fails or low confidence, try smart merge
      if (resolution.strategy !== ConflictStrategy.MERGE) {
        const smartMergeResult = await this.smartMerge(conflict, context);
        if (smartMergeResult.success && smartMergeResult.confidence > primaryResult.confidence) {
          return smartMergeResult;
        }
      }

      // Return best result
      return primaryResult.confidence >= smartMergeResult.confidence ? primaryResult : smartMergeResult;

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.ABORT,
        confidence: 0,
        warnings: [`Resolution failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }

  private determineDiffType(currentValue: any, rollbackValue: any): 'line' | 'word' | 'char' | 'json' | 'semantic' {
    // Handle null/undefined cases
    if (!currentValue || !rollbackValue) {
      return 'semantic';
    }

    // Check if both values are objects
    if (typeof currentValue === 'object' && typeof rollbackValue === 'object') {
      return 'json';
    }

    // Check if both values are strings
    if (typeof currentValue === 'string' && typeof rollbackValue === 'string') {
      // If strings contain newlines, use line diff
      if (currentValue.includes('\n') || rollbackValue.includes('\n')) {
        return 'line';
      }

      // If strings are long, use word diff
      if (currentValue.length > 100 || rollbackValue.length > 100) {
        return 'word';
      }

      // Otherwise use character diff
      return 'char';
    }

    // Default to semantic for complex cases
    return 'semantic';
  }

  private async generateDiff(
    currentValue: any,
    rollbackValue: any,
    diffType: 'line' | 'word' | 'char' | 'json' | 'semantic'
  ): Promise<DiffLine[]> {
    const currentStr = this.valueToString(currentValue);
    const rollbackStr = this.valueToString(rollbackValue);

    let changes: Change[] = [];

    switch (diffType) {
      case 'line':
        changes = diffLines(rollbackStr, currentStr);
        break;
      case 'word':
        changes = diffWords(rollbackStr, currentStr);
        break;
      case 'char':
        changes = diffChars(rollbackStr, currentStr);
        break;
      case 'json':
        changes = await this.generateJsonDiff(rollbackValue, currentValue);
        break;
      case 'semantic':
        changes = await this.generateSemanticDiff(rollbackValue, currentValue);
        break;
    }

    return this.convertToDiffLines(changes, diffType);
  }

  private async generateJsonDiff(rollbackValue: any, currentValue: any): Promise<Change[]> {
    try {
      const rollbackJson = JSON.stringify(rollbackValue, null, 2);
      const currentJson = JSON.stringify(currentValue, null, 2);
      return diffLines(rollbackJson, currentJson);
    } catch (error) {
      // Fallback to string comparison
      const rollbackStr = this.valueToString(rollbackValue);
      const currentStr = this.valueToString(currentValue);
      return diffWords(rollbackStr, currentStr);
    }
  }

  private async generateSemanticDiff(rollbackValue: any, currentValue: any): Promise<Change[]> {
    // For semantic diff, we'll create custom changes based on structural differences
    const changes: Change[] = [];

    if (typeof rollbackValue !== typeof currentValue) {
      changes.push({
        removed: true,
        value: `Type: ${typeof rollbackValue} (${this.valueToString(rollbackValue)})`
      });
      changes.push({
        added: true,
        value: `Type: ${typeof currentValue} (${this.valueToString(currentValue)})`
      });
    } else if (rollbackValue !== currentValue) {
      changes.push({
        removed: true,
        value: this.valueToString(rollbackValue)
      });
      changes.push({
        added: true,
        value: this.valueToString(currentValue)
      });
    } else {
      changes.push({
        value: this.valueToString(currentValue)
      });
    }

    return changes;
  }

  private convertToDiffLines(changes: Change[], diffType: string): DiffLine[] {
    const lines: DiffLine[] = [];
    let lineNumber = 1;

    for (const change of changes) {
      const content = change.value || '';
      const contentLines = content.split('\n');

      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (i === contentLines.length - 1 && line === '') continue; // Skip empty last line

        let type: 'added' | 'removed' | 'modified' | 'context' = 'context';
        if (change.added) type = 'added';
        else if (change.removed) type = 'removed';

        lines.push({
          lineNumber: type !== 'added' ? lineNumber++ : undefined,
          type,
          content: line,
          confidence: 95, // High confidence for standard diff
          tokens: diffType === 'word' || diffType === 'char' ? this.tokenizeLine(line, change) : undefined
        });
      }
    }

    return lines;
  }

  private tokenizeLine(line: string, change: Change): DiffToken[] {
    return [{
      text: line,
      type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      position: { start: 0, end: line.length }
    }];
  }

  private valueToString(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return value.toString();
      }
    }
    return String(value);
  }

  private analyzeDiff(changes: DiffLine[]): VisualDiff['metadata'] {
    const totalLines = changes.length;
    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    for (const change of changes) {
      switch (change.type) {
        case 'added':
          addedLines++;
          break;
        case 'removed':
          removedLines++;
          break;
        case 'modified':
          modifiedLines++;
          break;
      }
    }

    // Calculate similarity (simple heuristic)
    const unchangedLines = totalLines - addedLines - removedLines - modifiedLines;
    const similarity = totalLines > 0 ? (unchangedLines / totalLines) * 100 : 0;

    return {
      totalLines,
      addedLines,
      removedLines,
      modifiedLines,
      similarity
    };
  }

  private async createDiffSummary(
    conflict: RollbackConflict,
    changes: DiffLine[],
    metadata: VisualDiff['metadata']
  ): Promise<DiffSummary> {
    // Determine severity based on conflict type and diff size
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (conflict.type === ConflictType.TYPE_MISMATCH) {
      severity = 'high';
    } else if (metadata.similarity < 30) {
      severity = 'critical';
    } else if (metadata.similarity < 60) {
      severity = 'medium';
    }

    // Determine if auto-resolvable
    const autoResolvable =
      severity !== 'critical' &&
      metadata.similarity > 50 &&
      changes.length < 20;

    // Recommend strategy
    let recommendedStrategy = ConflictStrategy.ASK_USER;
    if (autoResolvable) {
      if (metadata.similarity > 80) {
        recommendedStrategy = ConflictStrategy.MERGE;
      } else {
        recommendedStrategy = ConflictStrategy.OVERWRITE;
      }
    }

    return {
      conflictType: conflict.type,
      severity,
      autoResolvable,
      recommendedStrategy,
      reason: this.generateReasonText(conflict, metadata, severity),
      impact: {
        entities: this.extractAffectedEntities(conflict),
        relationships: this.extractAffectedRelationships(conflict),
        dependencies: this.extractAffectedDependencies(conflict)
      }
    };
  }

  private generateReasonText(
    conflict: RollbackConflict,
    metadata: VisualDiff['metadata'],
    severity: string
  ): string {
    const similarity = Math.round(metadata.similarity);

    if (severity === 'critical') {
      return `Critical conflict with ${similarity}% similarity. Manual review required.`;
    } else if (severity === 'high') {
      return `High-risk conflict due to ${conflict.type}. Consider careful review.`;
    } else if (similarity > 80) {
      return `Minor differences detected (${similarity}% similar). Safe to auto-merge.`;
    } else {
      return `Moderate conflict with ${similarity}% similarity. Review recommended.`;
    }
  }

  private extractAffectedEntities(conflict: RollbackConflict): string[] {
    // Extract entity IDs from path and context
    const entities = new Set<string>();

    if (conflict.path.startsWith('entity:')) {
      entities.add(conflict.path.split(':')[1]);
    }

    if (conflict.context?.entities) {
      conflict.context.entities.forEach((e: string) => entities.add(e));
    }

    return Array.from(entities);
  }

  private extractAffectedRelationships(conflict: RollbackConflict): string[] {
    // Extract relationship IDs from path and context
    const relationships = new Set<string>();

    if (conflict.path.startsWith('relationship:')) {
      relationships.add(conflict.path.split(':')[1]);
    }

    if (conflict.context?.relationships) {
      conflict.context.relationships.forEach((r: string) => relationships.add(r));
    }

    return Array.from(relationships);
  }

  private extractAffectedDependencies(conflict: RollbackConflict): string[] {
    // Extract dependency information from context
    if (conflict.context?.dependencies) {
      return Array.from(conflict.context.dependencies);
    }
    return [];
  }

  private analyzeConflictComplexity(conflict: RollbackConflict): number {
    let complexity = 0;

    // Base complexity from conflict type
    switch (conflict.type) {
      case ConflictType.VALUE_MISMATCH:
        complexity += 10;
        break;
      case ConflictType.TYPE_MISMATCH:
        complexity += 50;
        break;
      case ConflictType.DEPENDENCY_CONFLICT:
        complexity += 100;
        break;
      default:
        complexity += 25;
    }

    // Add complexity based on value sizes
    const currentSize = this.valueToString(conflict.currentValue).length;
    const rollbackSize = this.valueToString(conflict.rollbackValue).length;
    complexity += Math.max(currentSize, rollbackSize) / 100;

    // Add complexity for nested objects
    if (typeof conflict.currentValue === 'object' && conflict.currentValue !== null) {
      complexity += Object.keys(conflict.currentValue).length * 5;
    }

    return Math.round(complexity);
  }

  private async determineBestStrategy(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<ConflictStrategy> {
    // Consider context priority
    if (context?.priority !== undefined) {
      if (context.priority > 8) return ConflictStrategy.OVERWRITE;
      if (context.priority < 3) return ConflictStrategy.SKIP;
    }

    // Consider conflict type
    switch (conflict.type) {
      case ConflictType.MISSING_TARGET:
        return ConflictStrategy.SKIP;
      case ConflictType.PERMISSION_DENIED:
        return ConflictStrategy.ASK_USER;
      case ConflictType.TYPE_MISMATCH:
        return this.mergeConfig.preserveStructure ? ConflictStrategy.ASK_USER : ConflictStrategy.OVERWRITE;
      default:
        return ConflictStrategy.MERGE;
    }
  }

  private async performIntelligentMerge(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {
      let mergedValue: any;
      let confidence = 0;
      const warnings: string[] = [];
      const appliedChanges = { kept: [], discarded: [], merged: [] };

      // Handle different value types
      if (typeof conflict.currentValue === 'object' && typeof conflict.rollbackValue === 'object') {
        const objectMerge = await this.mergeObjects(conflict.currentValue, conflict.rollbackValue);
        mergedValue = objectMerge.result;
        confidence = objectMerge.confidence;
        warnings.push(...objectMerge.warnings);
        appliedChanges.merged.push(...objectMerge.mergedKeys);
      } else if (typeof conflict.currentValue === 'string' && typeof conflict.rollbackValue === 'string') {
        const stringMerge = await this.mergeStrings(conflict.currentValue, conflict.rollbackValue);
        mergedValue = stringMerge.result;
        confidence = stringMerge.confidence;
        warnings.push(...stringMerge.warnings);
      } else {
        // For primitive values, choose based on configuration
        if (this.mergeConfig.preferNewer) {
          mergedValue = conflict.currentValue;
          appliedChanges.kept.push('current_value');
          appliedChanges.discarded.push('rollback_value');
        } else {
          mergedValue = conflict.rollbackValue;
          appliedChanges.kept.push('rollback_value');
          appliedChanges.discarded.push('current_value');
        }
        confidence = 60; // Moderate confidence for simple choice
      }

      return {
        success: true,
        mergedValue,
        strategy: ConflictStrategy.MERGE,
        confidence,
        warnings,
        appliedChanges
      };

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.MERGE,
        confidence: 0,
        warnings: [`Intelligent merge failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }

  private async mergeObjects(current: any, rollback: any): Promise<{
    result: any;
    confidence: number;
    warnings: string[];
    mergedKeys: string[];
  }> {
    const result = { ...current }; // Start with current
    const warnings: string[] = [];
    const mergedKeys: string[] = [];
    let conflicts = 0;
    let resolutions = 0;

    // Process rollback object properties
    for (const [key, value] of Object.entries(rollback)) {
      if (!(key in current)) {
        // Key doesn't exist in current, add it
        result[key] = value;
        mergedKeys.push(`+${key}`);
        resolutions++;
      } else if (current[key] !== value) {
        // Key exists but values differ
        conflicts++;

        if (typeof current[key] === typeof value && typeof value === 'object') {
          // Both are objects, try recursive merge
          const nestedMerge = await this.mergeObjects(current[key], value);
          result[key] = nestedMerge.result;
          mergedKeys.push(`~${key}`);
          warnings.push(...nestedMerge.warnings);
          resolutions++;
        } else {
          // Different types or primitives - choose based on config
          if (this.mergeConfig.preferNewer) {
            // Keep current
            mergedKeys.push(`=${key}(current)`);
          } else {
            // Use rollback
            result[key] = value;
            mergedKeys.push(`=${key}(rollback)`);
          }
          resolutions++;
        }
      }
    }

    // Calculate confidence based on resolution success rate
    const confidence = conflicts > 0 ? Math.round((resolutions / conflicts) * 100) : 95;

    if (conflicts > resolutions / 2) {
      warnings.push(`High conflict rate: ${conflicts} conflicts, ${resolutions} resolutions`);
    }

    return { result, confidence, warnings, mergedKeys };
  }

  private async mergeStrings(current: string, rollback: string): Promise<{
    result: string;
    confidence: number;
    warnings: string[];
  }> {
    // For strings, we'll use a simple line-based merge
    const currentLines = current.split('\n');
    const rollbackLines = rollback.split('\n');
    const warnings: string[] = [];

    // Use diff to find common and different parts
    const changes = diffLines(rollback, current);
    const mergedLines: string[] = [];

    let confidence = 80; // Start with high confidence for string merge

    for (const change of changes) {
      if (change.added) {
        // Line was added in current
        if (this.mergeConfig.preferNewer) {
          mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
        }
      } else if (change.removed) {
        // Line was removed in current (exists in rollback)
        if (!this.mergeConfig.preferNewer) {
          mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
        } else {
          confidence -= 5; // Reduce confidence when discarding rollback content
        }
      } else {
        // Unchanged line
        mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
      }
    }

    if (mergedLines.length === 0) {
      warnings.push('String merge resulted in empty content');
      confidence = 30;
    }

    return {
      result: mergedLines.join('\n'),
      confidence: Math.max(0, confidence),
      warnings
    };
  }

  private performOverwrite(conflict: RollbackConflict, preference: 'current' | 'rollback'): MergeResult {
    const mergedValue = preference === 'rollback' ? conflict.rollbackValue : conflict.currentValue;
    const discarded = preference === 'rollback' ? 'current' : 'rollback';

    return {
      success: true,
      mergedValue,
      strategy: ConflictStrategy.OVERWRITE,
      confidence: 90,
      warnings: [`Overwrote ${discarded} value with ${preference} value`],
      appliedChanges: {
        kept: [preference],
        discarded: [discarded],
        merged: []
      }
    };
  }

  private performSkip(conflict: RollbackConflict): MergeResult {
    return {
      success: true,
      mergedValue: conflict.currentValue, // Keep current value
      strategy: ConflictStrategy.SKIP,
      confidence: 100,
      warnings: ['Conflict skipped - current value preserved'],
      appliedChanges: {
        kept: ['current'],
        discarded: ['rollback'],
        merged: []
      }
    };
  }

  private async generateResolutionOptions(conflict: RollbackConflict): Promise<ConflictResolutionOption[]> {
    const options: ConflictResolutionOption[] = [];

    // Always provide basic options
    options.push({
      id: 'keep-current',
      name: 'Keep Current Value',
      description: 'Preserve the current state and ignore rollback value',
      strategy: ConflictStrategy.SKIP,
      confidence: 80,
      preview: this.valueToString(conflict.currentValue)
    });

    options.push({
      id: 'use-rollback',
      name: 'Use Rollback Value',
      description: 'Replace current value with rollback value',
      strategy: ConflictStrategy.OVERWRITE,
      confidence: 85,
      preview: this.valueToString(conflict.rollbackValue)
    });

    // Add merge option if values are compatible
    if (this.canMerge(conflict.currentValue, conflict.rollbackValue)) {
      const mergePreview = await this.performIntelligentMerge(conflict);
      options.push({
        id: 'smart-merge',
        name: 'Smart Merge',
        description: 'Intelligently combine both values',
        strategy: ConflictStrategy.MERGE,
        confidence: mergePreview.confidence,
        preview: this.valueToString(mergePreview.mergedValue)
      });
    }

    return options;
  }

  private canMerge(value1: any, value2: any): boolean {
    // Can merge if both are objects or both are strings
    return (
      (typeof value1 === 'object' && typeof value2 === 'object') ||
      (typeof value1 === 'string' && typeof value2 === 'string')
    );
  }

  private groupRelatedConflicts(conflicts: RollbackConflict[]): RollbackConflict[][] {
    // Simple grouping by path prefix for now
    const groups = new Map<string, RollbackConflict[]>();

    for (const conflict of conflicts) {
      const pathParts = conflict.path.split('/');
      const groupKey = pathParts.slice(0, 2).join('/'); // Group by first two path parts

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(conflict);
    }

    return Array.from(groups.values());
  }

  private async applyResolutionStrategy(
    conflict: RollbackConflict,
    strategy: ConflictStrategy,
    context?: ConflictContext
  ): Promise<MergeResult> {
    switch (strategy) {
      case ConflictStrategy.MERGE:
        return await this.performIntelligentMerge(conflict, context);
      case ConflictStrategy.OVERWRITE:
        return this.performOverwrite(conflict, 'rollback');
      case ConflictStrategy.SKIP:
        return this.performSkip(conflict);
      default:
        return {
          success: false,
          mergedValue: null,
          strategy,
          confidence: 0,
          warnings: [`Strategy ${strategy} not implemented`],
          appliedChanges: { kept: [], discarded: [], merged: [] }
        };
    }
  }
}

interface ConflictResolutionOption {
  id: string;
  name: string;
  description: string;
  strategy: ConflictStrategy;
  confidence: number;
  preview: string;
}

// Export types for external use
export type {
  VisualDiff,
  DiffLine,
  DiffToken,
  DiffSummary,
  MergeResult,
  SmartMergeConfig,
  ConflictContext,
  ConflictResolutionOption
};