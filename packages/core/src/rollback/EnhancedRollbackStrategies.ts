/**
 * Enhanced rollback strategies with partial and time-based rollback capabilities
 */

import { EventEmitter } from 'events';
import {
  RollbackStrategy,
  RollbackOperation,
  RollbackPoint,
  Snapshot,
  DiffEntry,
  ConflictResolution,
  ConflictStrategy,
  RollbackConflict,
  ConflictType,
  RollbackLogEntry,
  RollbackError,
  RollbackConflictError,
  DiffOperation
} from './RollbackTypes.js';

/**
 * Enhanced context for partial rollbacks
 */
interface EnhancedRollbackContext {
  operation: RollbackOperation;
  targetRollbackPoint: RollbackPoint;
  snapshots: Snapshot[];
  diff: DiffEntry[];
  conflictResolution: ConflictResolution;
  onProgress?: (progress: number) => void;
  onLog?: (entry: RollbackLogEntry) => void;

  // Enhanced options
  partialSelections?: PartialRollbackSelection[];
  timebasedFilter?: TimebasedFilter;
  dependencyGraph?: DependencyMap;
  dryRun?: boolean;
  maxDuration?: number; // Maximum time to spend on rollback
}

/**
 * Partial rollback selection criteria
 */
interface PartialRollbackSelection {
  type: 'entity' | 'relationship' | 'file' | 'namespace' | 'component';
  identifiers: string[];
  excludePattern?: RegExp;
  includePattern?: RegExp;
  priority?: number; // Higher priority items are rolled back first
}

/**
 * Time-based filter for rollback
 */
interface TimebasedFilter {
  rollbackToTimestamp?: Date;
  includeChangesAfter?: Date;
  excludeChangesAfter?: Date;
  maxChangeAge?: number; // in milliseconds
}

/**
 * Dependency mapping for smart rollback ordering
 */
interface DependencyMap {
  dependencies: Map<string, string[]>; // entity -> dependencies
  reverseDependencies: Map<string, string[]>; // entity -> dependents
}

/**
 * Rollback preview for dry-run operations
 */
interface RollbackPreview {
  totalChanges: number;
  changesByType: Map<DiffOperation, number>;
  estimatedDuration: number;
  potentialConflicts: RollbackConflict[];
  affectedItems: {
    entities: string[];
    relationships: string[];
    files: string[];
  };
  dependencies: {
    required: string[];
    affected: string[];
    circular: string[][];
  };
}

/**
 * Partial rollback strategy - rolls back only selected items
 */
export class PartialRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;

    if (!context.partialSelections || context.partialSelections.length === 0) {
      this.log('error', 'Partial rollback requires selection criteria');
      return false;
    }

    // Validate that selected items exist in the diff
    const availableItems = new Set(context.diff.map(d => d.path));
    for (const selection of context.partialSelections) {
      const matchingItems = selection.identifiers.filter(id => availableItems.has(id));
      if (matchingItems.length === 0) {
        this.log('warn', `No items found for selection type: ${selection.type}`, {
          identifiers: selection.identifiers
        });
      }
    }

    return true;
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {
    const selectedChanges = await this.getSelectedChanges(context);
    const baseTime = 1000; // 1 second base
    const timePerChange = 75; // 75ms per change (slightly more due to filtering overhead)
    return baseTime + (selectedChanges.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting partial rollback strategy', {
      totalAvailableChanges: context.diff.length,
      selectionCriteria: context.partialSelections?.length || 0
    });

    try {
      // Step 1: Filter changes based on selections
      const selectedChanges = await this.getSelectedChanges(context);
      this.log('info', `Selected ${selectedChanges.length} changes for rollback`);
      this.updateProgress(10);

      // Step 2: Build dependency order if available
      const orderedChanges = await this.orderChangesByDependencies(selectedChanges, context.dependencyGraph);
      this.updateProgress(20);

      // Step 3: Detect conflicts for selected changes only
      const conflicts = await this.detectConflicts(orderedChanges);
      await this.handleConflicts(conflicts);
      this.updateProgress(30);

      // Step 4: Apply changes in dependency order
      await this.applySelectedChanges(orderedChanges);

      this.log('info', 'Partial rollback completed successfully', {
        appliedChanges: orderedChanges.length,
        totalAvailableChanges: context.diff.length
      });

    } catch (error) {
      this.log('error', 'Partial rollback failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async generatePreview(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    const selectedChanges = await this.getSelectedChanges(context);
    const conflicts = await this.detectConflicts(selectedChanges);

    const changesByType = new Map<DiffOperation, number>();
    const affectedEntities = new Set<string>();
    const affectedRelationships = new Set<string>();
    const affectedFiles = new Set<string>();

    for (const change of selectedChanges) {
      const currentCount = changesByType.get(change.operation) || 0;
      changesByType.set(change.operation, currentCount + 1);

      // Categorize affected items
      if (change.path.startsWith('entity:')) {
        affectedEntities.add(change.path);
      } else if (change.path.startsWith('relationship:')) {
        affectedRelationships.add(change.path);
      } else if (change.path.includes('/')) {
        affectedFiles.add(change.path);
      }
    }

    // Analyze dependencies
    const dependencyAnalysis = await this.analyzeDependencies(selectedChanges, context.dependencyGraph);

    return {
      totalChanges: selectedChanges.length,
      changesByType,
      estimatedDuration: await this.estimateTime(context),
      potentialConflicts: conflicts,
      affectedItems: {
        entities: Array.from(affectedEntities),
        relationships: Array.from(affectedRelationships),
        files: Array.from(affectedFiles)
      },
      dependencies: dependencyAnalysis
    };
  }

  private async getSelectedChanges(context: EnhancedRollbackContext): Promise<DiffEntry[]> {
    if (!context.partialSelections) return [];

    const selectedChanges: DiffEntry[] = [];
    const processed = new Set<string>();

    // Sort selections by priority
    const sortedSelections = [...context.partialSelections].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const selection of sortedSelections) {
      for (const change of context.diff) {
        if (processed.has(change.path)) continue;

        if (await this.matchesSelection(change, selection)) {
          selectedChanges.push(change);
          processed.add(change.path);
        }
      }
    }

    return selectedChanges;
  }

  private async matchesSelection(change: DiffEntry, selection: PartialRollbackSelection): Promise<boolean> {
    // Check direct identifier match
    if (selection.identifiers.includes(change.path)) {
      return true;
    }

    // Check include pattern
    if (selection.includePattern && !selection.includePattern.test(change.path)) {
      return false;
    }

    // Check exclude pattern
    if (selection.excludePattern && selection.excludePattern.test(change.path)) {
      return false;
    }

    // Type-specific matching
    switch (selection.type) {
      case 'entity':
        return change.path.startsWith('entity:') &&
               selection.identifiers.some(id => change.path.includes(id));

      case 'relationship':
        return change.path.startsWith('relationship:') &&
               selection.identifiers.some(id => change.path.includes(id));

      case 'file':
        return selection.identifiers.some(id => change.path.includes(id) || change.path.endsWith(id));

      case 'namespace':
        return selection.identifiers.some(id => change.path.startsWith(id));

      case 'component':
        return selection.identifiers.some(id =>
          change.path.includes(`/${id}/`) ||
          change.path.includes(`/${id}.`) ||
          change.path.endsWith(`/${id}`)
        );

      default:
        return false;
    }
  }

  private async orderChangesByDependencies(changes: DiffEntry[], dependencyGraph?: DependencyMap): Promise<DiffEntry[]> {
    if (!dependencyGraph) {
      return changes; // Return original order if no dependency info
    }

    const ordered: DiffEntry[] = [];
    const processing = new Set<string>();
    const processed = new Set<string>();
    const changeMap = new Map(changes.map(c => [c.path, c]));

    const processChange = (path: string): void => {
      if (processed.has(path) || processing.has(path)) return;
      if (!changeMap.has(path)) return;

      processing.add(path);

      // Process dependencies first (for rollback, we need to handle dependencies in reverse)
      const dependencies = dependencyGraph.dependencies.get(path) || [];
      for (const dep of dependencies) {
        if (changeMap.has(dep) && !processed.has(dep)) {
          processChange(dep);
        }
      }

      const change = changeMap.get(path)!;
      ordered.push(change);
      processed.add(path);
      processing.delete(path);
    };

    // Process all changes
    for (const change of changes) {
      processChange(change.path);
    }

    this.log('debug', `Ordered ${ordered.length} changes by dependencies`);
    return ordered;
  }

  private async analyzeDependencies(changes: DiffEntry[], dependencyGraph?: DependencyMap) {
    if (!dependencyGraph) {
      return { required: [], affected: [], circular: [] };
    }

    const changePaths = new Set(changes.map(c => c.path));
    const required = new Set<string>();
    const affected = new Set<string>();
    const visited = new Set<string>();
    const circular: string[][] = [];

    const findDependencies = (path: string, visitPath: string[]): void => {
      if (visitPath.includes(path)) {
        // Circular dependency detected
        const circularPath = visitPath.slice(visitPath.indexOf(path));
        circularPath.push(path);
        circular.push(circularPath);
        return;
      }

      if (visited.has(path)) return;
      visited.add(path);

      const deps = dependencyGraph.dependencies.get(path) || [];
      const reverseDeps = dependencyGraph.reverseDependencies.get(path) || [];

      for (const dep of deps) {
        if (!changePaths.has(dep)) {
          required.add(dep);
        }
        findDependencies(dep, [...visitPath, path]);
      }

      for (const rdep of reverseDeps) {
        if (!changePaths.has(rdep)) {
          affected.add(rdep);
        }
        findDependencies(rdep, [...visitPath, path]);
      }
    };

    for (const change of changes) {
      findDependencies(change.path, []);
    }

    return {
      required: Array.from(required),
      affected: Array.from(affected),
      circular
    };
  }

  private async applySelectedChanges(changes: DiffEntry[]): Promise<void> {
    const totalChanges = changes.length;
    let processedChanges = 0;

    for (const change of changes) {
      await this.applyChange(change);
      processedChanges++;

      const progress = 30 + ((processedChanges / totalChanges) * 70);
      this.updateProgress(progress);
    }
  }

  private async detectConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    // Simplified conflict detection for partial changes
    const conflicts: RollbackConflict[] = [];

    // Check for conflicts between selected changes
    const pathCounts = new Map<string, number>();
    for (const change of changes) {
      pathCounts.set(change.path, (pathCounts.get(change.path) || 0) + 1);
    }

    for (const [path, count] of pathCounts) {
      if (count > 1) {
        conflicts.push({
          path,
          type: ConflictType.VALUE_MISMATCH,
          currentValue: 'multiple_changes',
          rollbackValue: 'conflicted_state',
          context: { multipleChanges: true }
        });
      }
    }

    return conflicts;
  }

  private async handleConflicts(conflicts: RollbackConflict[]): Promise<void> {
    if (conflicts.length === 0) return;

    this.log('warn', `Detected ${conflicts.length} conflicts in partial rollback`);

    switch (this.context.conflictResolution.strategy) {
      case ConflictStrategy.ABORT:
        throw new RollbackConflictError('Partial rollback aborted due to conflicts', conflicts);

      case ConflictStrategy.SKIP:
        this.log('info', 'Skipping conflicted changes in partial rollback');
        break;

      case ConflictStrategy.OVERWRITE:
        this.log('warn', 'Overwriting conflicted changes in partial rollback');
        break;

      // Other strategies...
    }
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Applying partial change: ${change.operation} at ${change.path}`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}

/**
 * Time-based rollback strategy - rolls back changes within a time window
 */
export class TimebasedRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;

    if (!context.timebasedFilter) {
      this.log('error', 'Time-based rollback requires time filter criteria');
      return false;
    }

    const filter = context.timebasedFilter;
    if (!filter.rollbackToTimestamp && !filter.includeChangesAfter && !filter.maxChangeAge) {
      this.log('error', 'Time-based rollback requires at least one time criteria');
      return false;
    }

    return true;
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {
    const timeFilteredChanges = await this.getTimeFilteredChanges(context);
    const baseTime = 1000; // 1 second base
    const timePerChange = 60; // 60ms per change
    return baseTime + (timeFilteredChanges.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting time-based rollback strategy', {
      totalAvailableChanges: context.diff.length,
      timeFilter: context.timebasedFilter
    });

    try {
      // Step 1: Filter changes based on time criteria
      const timeFilteredChanges = await this.getTimeFilteredChanges(context);
      this.log('info', `Selected ${timeFilteredChanges.length} changes based on time criteria`);
      this.updateProgress(15);

      // Step 2: Sort changes chronologically for proper rollback order
      const chronologicalChanges = await this.sortChangesChronologically(timeFilteredChanges, context.timebasedFilter!);
      this.updateProgress(25);

      // Step 3: Detect temporal conflicts
      const conflicts = await this.detectTemporalConflicts(chronologicalChanges);
      await this.handleConflicts(conflicts);
      this.updateProgress(35);

      // Step 4: Apply changes in chronological order
      await this.applyTimebasedChanges(chronologicalChanges);

      this.log('info', 'Time-based rollback completed successfully', {
        appliedChanges: chronologicalChanges.length,
        totalAvailableChanges: context.diff.length
      });

    } catch (error) {
      this.log('error', 'Time-based rollback failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async getTimeFilteredChanges(context: EnhancedRollbackContext): Promise<DiffEntry[]> {
    const filter = context.timebasedFilter!;
    const filtered: DiffEntry[] = [];

    for (const change of context.diff) {
      if (await this.matchesTimeFilter(change, filter)) {
        filtered.push(change);
      }
    }

    return filtered;
  }

  private async matchesTimeFilter(change: DiffEntry, filter: TimebasedFilter): Promise<boolean> {
    // Extract timestamp from change metadata or path
    const changeTimestamp = this.extractChangeTimestamp(change);
    if (!changeTimestamp) {
      // If no timestamp available, include by default
      return true;
    }

    // Check rollbackToTimestamp (rollback changes after this time)
    if (filter.rollbackToTimestamp && changeTimestamp <= filter.rollbackToTimestamp) {
      return false;
    }

    // Check includeChangesAfter
    if (filter.includeChangesAfter && changeTimestamp <= filter.includeChangesAfter) {
      return false;
    }

    // Check excludeChangesAfter
    if (filter.excludeChangesAfter && changeTimestamp > filter.excludeChangesAfter) {
      return false;
    }

    // Check maxChangeAge
    if (filter.maxChangeAge) {
      const age = Date.now() - changeTimestamp.getTime();
      if (age > filter.maxChangeAge) {
        return false;
      }
    }

    return true;
  }

  private extractChangeTimestamp(change: DiffEntry): Date | null {
    // Try to extract timestamp from metadata
    if (change.metadata?.timestamp) {
      return new Date(change.metadata.timestamp);
    }

    // Try to extract from path (if contains timestamp)
    const timestampMatch = change.path.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (timestampMatch) {
      return new Date(timestampMatch[1]);
    }

    // Try to extract from oldValue or newValue if they have timestamps
    if (change.oldValue && typeof change.oldValue === 'object' && change.oldValue.timestamp) {
      return new Date(change.oldValue.timestamp);
    }

    if (change.newValue && typeof change.newValue === 'object' && change.newValue.timestamp) {
      return new Date(change.newValue.timestamp);
    }

    return null;
  }

  private async sortChangesChronologically(changes: DiffEntry[], filter: TimebasedFilter): Promise<DiffEntry[]> {
    return changes.sort((a, b) => {
      const timestampA = this.extractChangeTimestamp(a);
      const timestampB = this.extractChangeTimestamp(b);

      if (!timestampA && !timestampB) return 0;
      if (!timestampA) return 1; // Put items without timestamp at end
      if (!timestampB) return -1;

      // For rollback, we usually want to apply changes in reverse chronological order
      // (undo the most recent changes first)
      return timestampB.getTime() - timestampA.getTime();
    });
  }

  private async detectTemporalConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    const conflicts: RollbackConflict[] = [];
    const pathTimestamps = new Map<string, Date[]>();

    // Group changes by path and collect their timestamps
    for (const change of changes) {
      const timestamp = this.extractChangeTimestamp(change);
      if (timestamp) {
        if (!pathTimestamps.has(change.path)) {
          pathTimestamps.set(change.path, []);
        }
        pathTimestamps.get(change.path)!.push(timestamp);
      }
    }

    // Check for temporal conflicts (multiple changes to same path)
    for (const [path, timestamps] of pathTimestamps) {
      if (timestamps.length > 1) {
        // Sort timestamps to detect gaps or overlaps
        const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());

        for (let i = 1; i < sortedTimestamps.length; i++) {
          const gap = sortedTimestamps[i].getTime() - sortedTimestamps[i-1].getTime();
          if (gap < 60000) { // Changes within 1 minute might conflict
            conflicts.push({
              path,
              type: ConflictType.VALUE_MISMATCH,
              currentValue: `change_at_${sortedTimestamps[i-1].toISOString()}`,
              rollbackValue: `change_at_${sortedTimestamps[i].toISOString()}`,
              context: {
                temporalConflict: true,
                timestamps: sortedTimestamps
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private async applyTimebasedChanges(changes: DiffEntry[]): Promise<void> {
    const totalChanges = changes.length;
    let processedChanges = 0;

    for (const change of changes) {
      const changeTimestamp = this.extractChangeTimestamp(change);
      this.log('debug', 'Applying time-based change', {
        path: change.path,
        operation: change.operation,
        timestamp: changeTimestamp?.toISOString()
      });

      await this.applyChange(change);
      processedChanges++;

      const progress = 35 + ((processedChanges / totalChanges) * 65);
      this.updateProgress(progress);
    }
  }

  private async handleConflicts(conflicts: RollbackConflict[]): Promise<void> {
    if (conflicts.length === 0) return;

    this.log('warn', `Detected ${conflicts.length} temporal conflicts`);

    switch (this.context.conflictResolution.strategy) {
      case ConflictStrategy.ABORT:
        throw new RollbackConflictError('Time-based rollback aborted due to temporal conflicts', conflicts);

      case ConflictStrategy.SKIP:
        this.log('info', 'Skipping temporally conflicted changes');
        break;

      case ConflictStrategy.OVERWRITE:
        this.log('warn', 'Applying most recent changes for temporal conflicts');
        break;

      // Other strategies...
    }
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 40)); // Simulate work
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}

/**
 * Dry-run rollback strategy - simulates rollback without applying changes
 */
export class DryRunRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;
    return true; // Dry run can always be performed
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {
    // Dry run is fast since it doesn't apply changes
    const baseTime = 500; // 0.5 seconds base
    const timePerChange = 10; // 10ms per change analysis
    return baseTime + (context.diff.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    this.context = context;
    this.log('info', 'Starting dry-run rollback analysis');

    try {
      // Analyze all changes without applying them
      const preview = await this.generateRollbackPreview(context);

      this.log('info', 'Dry-run rollback analysis completed', {
        totalChanges: preview.totalChanges,
        potentialConflicts: preview.potentialConflicts.length,
        estimatedDuration: preview.estimatedDuration
      });

      return preview;

    } catch (error) {
      this.log('error', 'Dry-run rollback analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async generateRollbackPreview(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    this.updateProgress(10);

    // Analyze change types
    const changesByType = new Map<DiffOperation, number>();
    const affectedEntities = new Set<string>();
    const affectedRelationships = new Set<string>();
    const affectedFiles = new Set<string>();

    for (const change of context.diff) {
      const currentCount = changesByType.get(change.operation) || 0;
      changesByType.set(change.operation, currentCount + 1);

      // Categorize affected items
      if (change.path.startsWith('entity:')) {
        affectedEntities.add(change.path);
      } else if (change.path.startsWith('relationship:')) {
        affectedRelationships.add(change.path);
      } else if (change.path.includes('/')) {
        affectedFiles.add(change.path);
      }
    }

    this.updateProgress(40);

    // Detect potential conflicts
    const conflicts = await this.analyzeAllConflicts(context.diff);
    this.updateProgress(70);

    // Analyze dependencies
    let dependencyAnalysis = { required: [], affected: [], circular: [] };
    if (context.dependencyGraph) {
      dependencyAnalysis = await this.analyzeDependencies(context.diff, context.dependencyGraph);
    }

    this.updateProgress(100);

    return {
      totalChanges: context.diff.length,
      changesByType,
      estimatedDuration: await this.estimateTime(context),
      potentialConflicts: conflicts,
      affectedItems: {
        entities: Array.from(affectedEntities),
        relationships: Array.from(affectedRelationships),
        files: Array.from(affectedFiles)
      },
      dependencies: dependencyAnalysis
    };
  }

  private async analyzeAllConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    const conflicts: RollbackConflict[] = [];
    const pathGroups = new Map<string, DiffEntry[]>();

    // Group changes by path
    for (const change of changes) {
      if (!pathGroups.has(change.path)) {
        pathGroups.set(change.path, []);
      }
      pathGroups.get(change.path)!.push(change);
    }

    // Analyze conflicts within each path group
    for (const [path, pathChanges] of pathGroups) {
      if (pathChanges.length > 1) {
        conflicts.push({
          path,
          type: ConflictType.VALUE_MISMATCH,
          currentValue: 'multiple_operations',
          rollbackValue: 'conflicted_state',
          context: {
            operations: pathChanges.map(c => c.operation),
            changeCount: pathChanges.length
          }
        });
      }

      // Check for type mismatches
      for (const change of pathChanges) {
        if (change.oldValue && change.newValue) {
          const oldType = typeof change.oldValue;
          const newType = typeof change.newValue;
          if (oldType !== newType) {
            conflicts.push({
              path,
              type: ConflictType.TYPE_MISMATCH,
              currentValue: newType,
              rollbackValue: oldType,
              context: { change }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private async analyzeDependencies(changes: DiffEntry[], dependencyGraph: DependencyMap) {
    const changePaths = new Set(changes.map(c => c.path));
    const required = new Set<string>();
    const affected = new Set<string>();
    const circular: string[][] = [];
    const visited = new Set<string>();

    const findCircular = (path: string, visitPath: string[]): void => {
      if (visitPath.includes(path)) {
        const circularPath = visitPath.slice(visitPath.indexOf(path));
        circularPath.push(path);
        circular.push(circularPath);
        return;
      }

      if (visited.has(path)) return;
      visited.add(path);

      const deps = dependencyGraph.dependencies.get(path) || [];
      for (const dep of deps) {
        findCircular(dep, [...visitPath, path]);
      }
    };

    for (const change of changes) {
      const deps = dependencyGraph.dependencies.get(change.path) || [];
      const reverseDeps = dependencyGraph.reverseDependencies.get(change.path) || [];

      for (const dep of deps) {
        if (!changePaths.has(dep)) {
          required.add(dep);
        }
      }

      for (const rdep of reverseDeps) {
        if (!changePaths.has(rdep)) {
          affected.add(rdep);
        }
      }

      findCircular(change.path, []);
    }

    return {
      required: Array.from(required),
      affected: Array.from(affected),
      circular
    };
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}

// Export types for use in other modules
export type {
  EnhancedRollbackContext,
  PartialRollbackSelection,
  TimebasedFilter,
  DependencyMap,
  RollbackPreview
};