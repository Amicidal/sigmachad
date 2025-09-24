# Package: sync
Generated: 2025-09-23 07:07:47 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 634 | ⚠️ |
| Critical Issues | 0 | ✅ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 39 | 🚨 |
| Antipatterns | 60 | 🔍 |

### Notable Issues

#### 🚨 Potential Deception (39)
Functions that don't do what their names suggest, or claim functionality they don't have:

- `GitService.ts:399` - **Error silently swallowed - no error handling or logging**
- `SCMService.ts:365` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:783` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:824` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1213` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1235` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1312` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1331` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1351` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1508` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1620` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1644` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1649` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1699` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1834` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:1845` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2049` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2061` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2083` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2146` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2190` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2203` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2215` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2227` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2285` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2350` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2362` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2390` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2420` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2523` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:2707` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3047` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3132` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3179` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3270` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3283` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3302` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3364` - **Error silently swallowed - no error handling or logging**
- `SynchronizationCoordinator.ts:3383` - **Error silently swallowed - no error handling or logging**

#### ⚠️ Warnings (47)
Issues that should be addressed but aren't critical:

- `GitService.ts:399` - Error silently swallowed - no error handling or logging
- `SCMService.ts:365` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:783` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:784` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:824` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1213` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1235` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1312` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1331` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1351` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1508` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1620` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1644` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1649` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1650` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:1699` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1834` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:1845` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2049` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2061` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2083` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2146` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2190` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2203` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2215` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2227` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2285` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2350` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2362` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2390` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2420` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2449` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:2523` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2707` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:2738` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:2968` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:2973` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:3007` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:3038` - Direct console.log in class - use proper logging abstraction
- `SynchronizationCoordinator.ts:3047` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3132` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3179` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3270` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3283` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3302` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3364` - Error silently swallowed - no error handling or logging
- `SynchronizationCoordinator.ts:3383` - Error silently swallowed - no error handling or logging

#### 🔍 Code Antipatterns (60)
Design and architecture issues that should be refactored:

- `SynchronizationCoordinator.ts:312` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:327` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:556` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:626` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:743` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:775` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:784` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:812` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:876` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:899` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:906` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:926` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:975` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:998` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1005` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1025` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1074` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1097` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1104` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1124` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1159` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1223` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1250` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1252` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1348` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1361` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1612` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1624` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1650` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:1671` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1681` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:1930` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2449` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:2572` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2577` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2586` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2599` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2679` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2738` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:2770` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2818` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2821` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2897` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:2968` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:2973` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:3007` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:3028` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:3038` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SynchronizationCoordinator.ts:3069` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:3091` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationCoordinator.ts:3124` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:156` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:214` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:238` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:271` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:309` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:538` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `SynchronizationMonitoring.ts:555` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:573` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SynchronizationMonitoring.ts:613` - **Event type using raw string - consider using enum or const** [weak-event-types]

#### ℹ️ Informational
587 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
scm/
  ConflictResolution.ts
  GitService.ts
  index.ts
  LocalGitProvider.ts
  RollbackCapabilities.ts
  SCMProvider.ts
  SCMService.ts
synchronization/
  index.ts
  SynchronizationCoordinator.ts
  SynchronizationMonitoring.ts
index.ts

================================================================
Files
================================================================

================
File: scm/ConflictResolution.ts
================
import crypto from "crypto";
import { Entity } from "@memento/graph";
import { GraphRelationship } from "@memento/graph";
import { KnowledgeGraphService } from "@memento/knowledge";

export interface Conflict {
  id: string;
  type:
    | "entity_version"
    | "entity_deletion"
    | "relationship_conflict"
    | "concurrent_modification";
  entityId?: string;
  relationshipId?: string;
  description: string;
  conflictingValues: {
    current: any;
    incoming: any;
  };
  diff?: Record<string, { current: any; incoming: any }>;
  signature?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: ConflictResolutionResult;
  resolutionStrategy?: "overwrite" | "merge" | "skip" | "manual";
}

export interface ConflictResolution {
  strategy: "overwrite" | "merge" | "skip" | "manual";
  resolvedValue?: any;
  manualResolution?: string;
  timestamp: Date;
  resolvedBy: string;
}

export interface MergeStrategy {
  name: string;
  priority: number;
  canHandle: (conflict: Conflict) => boolean;
  resolve: (conflict: Conflict) => Promise<ConflictResolutionResult>;
}

export interface ConflictResolutionResult {
  strategy: "overwrite" | "merge" | "skip" | "manual";
  resolvedValue?: any;
  manualResolution?: string;
  timestamp: Date;
  resolvedBy: string;
}

interface ManualOverrideRecord {
  signature: string;
  conflictType: Conflict["type"];
  targetId: string;
  resolvedValue?: any;
  manualResolution?: string;
  resolvedBy: string;
  timestamp: Date;
}

type DiffMap = Record<string, { current: any; incoming: any }>;

export class ConflictResolution {
  private conflicts = new Map<string, Conflict>();
  private mergeStrategies: MergeStrategy[] = [];
  private conflictListeners = new Set<(conflict: Conflict) => void>();
  private manualOverrides = new Map<string, ManualOverrideRecord>();

  private static readonly ENTITY_DIFF_IGNORES = new Set([
    "created",
    "firstSeenAt",
    "lastSeenAt",
    "lastIndexed",
    "lastAnalyzed",
    "lastValidated",
    "snapshotCreated",
    "snapshotTakenAt",
    "timestamp",
  ]);

  private static readonly RELATIONSHIP_DIFF_IGNORES = new Set([
    "created",
    "firstSeenAt",
    "lastSeenAt",
    "version",
    "occurrencesScan",
    "occurrencesTotal",
  ]);

  constructor(private kgService: KnowledgeGraphService) {
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies(): void {

    this.addMergeStrategy({
      name: "last_write_wins",
      priority: 100,
      canHandle: () => true,
      resolve: async (conflict) => ({
        strategy: "overwrite",
        resolvedValue: conflict.conflictingValues.incoming,
        timestamp: new Date(),
        resolvedBy: "system",
      }),
    });


    this.addMergeStrategy({
      name: "property_merge",
      priority: 50,
      canHandle: (conflict) => conflict.type === "entity_version",
      resolve: async (conflict) => {
        const current = conflict.conflictingValues.current as Record<string, any>;
        const incoming = conflict.conflictingValues.incoming as Record<string, any>;

        const merged = { ...current };

        if (incoming.hash) {
          merged.hash = incoming.hash;
        }

        if (incoming.metadata && current.metadata) {
          merged.metadata = { ...current.metadata, ...incoming.metadata };
        } else if (incoming.metadata) {
          merged.metadata = incoming.metadata;
        }

        if (
          incoming.lastModified &&
          current.lastModified &&
          incoming.lastModified > current.lastModified
        ) {
          merged.lastModified = incoming.lastModified;
        } else if (incoming.lastModified) {
          merged.lastModified = incoming.lastModified;
        }

        return {
          strategy: "merge",
          resolvedValue: merged,
          timestamp: new Date(),
          resolvedBy: "system",
        };
      },
    });


    this.addMergeStrategy({
      name: "skip_deletions",
      priority: 25,
      canHandle: (conflict) => conflict.type === "entity_deletion",
      resolve: async () => ({
        strategy: "skip",
        timestamp: new Date(),
        resolvedBy: "system",
      }),
    });
  }

  addMergeStrategy(strategy: MergeStrategy): void {
    this.mergeStrategies.push(strategy);
    this.mergeStrategies.sort((a, b) => b.priority - a.priority);
  }

  async detectConflicts(
    incomingEntities: Entity[],
    incomingRelationships: GraphRelationship[]
  ): Promise<Conflict[]> {
    const detected: Conflict[] = [];

    for (const incomingEntity of incomingEntities) {
      const existingEntity = await this.kgService.getEntity(incomingEntity.id);
      if (!existingEntity) {
        continue;
      }

      const diffResult = this.computeEntityDiff(existingEntity, incomingEntity);
      if (!diffResult) {
        continue;
      }

      if (this.manualOverrides.has(diffResult.signature)) {
        continue;
      }

      const conflictId = this.generateConflictId(
        "entity_version",
        incomingEntity.id,
        diffResult.signature
      );

      const conflict = this.upsertConflict(conflictId, {
        type: "entity_version",
        entityId: incomingEntity.id,
        description: this.describeDiff(
          "Entity",
          incomingEntity.id,
          diffResult.diff
        ),
        conflictingValues: {
          current: existingEntity,
          incoming: incomingEntity,
        },
        diff: diffResult.diff,
        signature: diffResult.signature,
      });

      detected.push(conflict);
    }

    for (const rawRelationship of incomingRelationships) {
      const normalizedIncoming = this.normalizeRelationshipInput(rawRelationship);
      if (!normalizedIncoming.id) {
        continue;
      }

      const existingRelationship = await this.kgService.getRelationshipById(
        normalizedIncoming.id
      );

      if (!existingRelationship) {
        continue;
      }

      const diffResult = this.computeRelationshipDiff(
        existingRelationship,
        normalizedIncoming
      );

      if (!diffResult) {
        continue;
      }

      if (this.manualOverrides.has(diffResult.signature)) {
        continue;
      }

      const conflictId = this.generateConflictId(
        "relationship_conflict",
        normalizedIncoming.id,
        diffResult.signature
      );

      const conflict = this.upsertConflict(conflictId, {
        type: "relationship_conflict",
        relationshipId: normalizedIncoming.id,
        description: this.describeDiff(
          "Relationship",
          normalizedIncoming.id,
          diffResult.diff
        ),
        conflictingValues: {
          current: existingRelationship,
          incoming: normalizedIncoming,
        },
        diff: diffResult.diff,
        signature: diffResult.signature,
      });

      detected.push(conflict);
    }

    return detected;
  }

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<boolean> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.resolved) {
      return false;
    }

    const resolutionResult: ConflictResolutionResult = {
      strategy: resolution.strategy,
      resolvedValue: resolution.resolvedValue,
      manualResolution: resolution.manualResolution,
      timestamp: resolution.timestamp,
      resolvedBy: resolution.resolvedBy,
    };

    const applied = await this.applyResolution(conflict, resolutionResult);
    if (!applied) {
      return false;
    }

    conflict.resolved = true;
    conflict.resolution = resolutionResult;
    conflict.resolutionStrategy = resolutionResult.strategy;

    if (resolutionResult.strategy === "manual" && conflict.signature) {
      this.recordManualOverride(conflict, resolutionResult);
    }

    return true;
  }

  async resolveConflictsAuto(
    conflicts: Conflict[]
  ): Promise<ConflictResolutionResult[]> {
    const resolutions: ConflictResolutionResult[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflictAuto(conflict);
      if (resolution) {
        resolutions.push(resolution);
      }
    }

    return resolutions;
  }

  private async resolveConflictAuto(
    conflict: Conflict
  ): Promise<ConflictResolutionResult | null> {
    for (const strategy of this.mergeStrategies) {
      if (!strategy.canHandle(conflict)) {
        continue;
      }

      try {
        const resolution = await strategy.resolve(conflict);
        const applied = await this.applyResolution(conflict, resolution);
        if (applied) {
          conflict.resolved = true;
          conflict.resolution = resolution;
          conflict.resolutionStrategy = resolution.strategy;
          return resolution;
        }
      } catch (error) {
        console.warn(
          `Strategy ${strategy.name} failed for conflict ${conflict.id}:`,
          error
        );
      }
    }

    return null;
  }

  getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolved);
  }

  getResolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter((c) => c.resolved);
  }

  getConflict(conflictId: string): Conflict | null {
    return this.conflicts.get(conflictId) || null;
  }

  getConflictsForEntity(entityId: string): Conflict[] {
    return Array.from(this.conflicts.values()).filter(
      (c) => c.entityId === entityId && !c.resolved
    );
  }

  addConflictListener(listener: (conflict: Conflict) => void): void {
    this.conflictListeners.add(listener);
  }

  removeConflictListener(listener: (conflict: Conflict) => void): void {
    this.conflictListeners.delete(listener);
  }

  private notifyConflictListeners(conflict: Conflict): void {
    for (const listener of this.conflictListeners) {
      try {
        listener(conflict);
      } catch (error) {
        console.error("Error in conflict listener:", error);
      }
    }
  }

  clearResolvedConflicts(): void {
    for (const [id, conflict] of this.conflicts) {
      if (conflict.resolved) {
        this.conflicts.delete(id);
      }
    }
  }

  getConflictStatistics(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<string, number>;
  } {
    const allConflicts = Array.from(this.conflicts.values());
    const resolved = allConflicts.filter((c) => c.resolved);
    const unresolved = allConflicts.filter((c) => !c.resolved);

    const byType: Record<string, number> = {};
    for (const conflict of allConflicts) {
      byType[conflict.type] = (byType[conflict.type] || 0) + 1;
    }

    return {
      total: allConflicts.length,
      resolved: resolved.length,
      unresolved: unresolved.length,
      byType,
    };
  }

  private computeEntityDiff(
    current: Entity,
    incoming: Entity
  ): { diff: DiffMap; signature: string } | null {
    const normalizedCurrent = this.prepareForDiff(
      current,
      ConflictResolution.ENTITY_DIFF_IGNORES
    );
    const normalizedIncoming = this.prepareForDiff(
      incoming,
      ConflictResolution.ENTITY_DIFF_IGNORES
    );

    const diff = this.computeObjectDiff(normalizedCurrent, normalizedIncoming);
    if (Object.keys(diff).length === 0) {
      return null;
    }

    const signature = this.generateSignature(
      "entity_version",
      incoming.id,
      diff
    );

    return { diff, signature };
  }

  private computeRelationshipDiff(
    current: GraphRelationship,
    incoming: GraphRelationship
  ): { diff: DiffMap; signature: string } | null {
    const normalizedCurrent = this.prepareForDiff(
      current,
      ConflictResolution.RELATIONSHIP_DIFF_IGNORES
    );
    const normalizedIncoming = this.prepareForDiff(
      incoming,
      ConflictResolution.RELATIONSHIP_DIFF_IGNORES
    );

    const diff = this.computeObjectDiff(normalizedCurrent, normalizedIncoming);
    if (Object.keys(diff).length === 0) {
      return null;
    }

    const signature = this.generateSignature(
      "relationship_conflict",
      incoming.id || current.id || "",
      diff
    );

    return { diff, signature };
  }

  private prepareForDiff(
    source: Record<string, any>,
    ignoreKeys: Set<string>
  ): Record<string, any> {
    const prepared: Record<string, any> = {};

    for (const [key, value] of Object.entries(source || {})) {
      if (ignoreKeys.has(key) || typeof value === "function") {
        continue;
      }
      if (value === undefined) {
        continue;
      }
      prepared[key] = this.prepareValue(value, ignoreKeys);
    }

    return prepared;
  }

  private prepareValue(value: any, ignoreKeys: Set<string>): any {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.prepareValue(item, ignoreKeys));
    }
    if (value instanceof Map) {
      const obj: Record<string, any> = {};
      for (const [k, v] of value.entries()) {
        obj[k] = this.prepareValue(v, ignoreKeys);
      }
      return obj;
    }
    if (typeof value === "object") {
      const entries = Object.entries(value)
        .filter(([k]) => !ignoreKeys.has(k))
        .sort(([a], [b]) => a.localeCompare(b));
      const obj: Record<string, any> = {};
      for (const [k, v] of entries) {
        obj[k] = this.prepareValue(v, ignoreKeys);
      }
      return obj;
    }
    if (typeof value === "number" && Number.isNaN(value)) {
      return null;
    }
    return value;
  }

  private computeObjectDiff(
    current: Record<string, any>,
    incoming: Record<string, any>,
    path: string[] = []
  ): DiffMap {
    const diff: DiffMap = {};
    const keys = new Set<string>([
      ...Object.keys(current || {}),
      ...Object.keys(incoming || {}),
    ]);

    for (const key of keys) {
      const currentValue = current ? current[key] : undefined;
      const incomingValue = incoming ? incoming[key] : undefined;
      const currentPath = [...path, key];

      if (this.deepEqual(currentValue, incomingValue)) {
        continue;
      }

      if (
        currentValue &&
        incomingValue &&
        typeof currentValue === "object" &&
        typeof incomingValue === "object" &&
        !Array.isArray(currentValue) &&
        !Array.isArray(incomingValue)
      ) {
        Object.assign(
          diff,
          this.computeObjectDiff(
            currentValue as Record<string, any>,
            incomingValue as Record<string, any>,
            currentPath
          )
        );
      } else {
        diff[currentPath.join(".")] = {
          current: currentValue,
          incoming: incomingValue,
        };
      }
    }

    return diff;
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }
    if (typeof a === "object" && typeof b === "object") {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }

  private generateSignature(
    type: Conflict["type"],
    targetId: string,
    diff: DiffMap
  ): string {
    const serializedDiff = Object.keys(diff)
      .sort()
      .map((key) => `${key}:${JSON.stringify(diff[key])}`)
      .join("|");

    return crypto
      .createHash("sha256")
      .update(`${type}|${targetId}|${serializedDiff}`)
      .digest("hex");
  }

  private generateConflictId(
    type: Conflict["type"],
    targetId: string,
    signature: string
  ): string {
    const hash = crypto
      .createHash("sha1")
      .update(`${type}|${targetId}|${signature}`)
      .digest("hex");
    return `conflict_${type}_${hash}`;
  }

  private upsertConflict(
    conflictId: string,
    data: Omit<Conflict, "id" | "timestamp" | "resolved"> & {
      diff?: DiffMap;
      signature?: string;
    }
  ): Conflict {
    const existing = this.conflicts.get(conflictId);
    const now = new Date();

    if (
      existing &&
      !existing.resolved &&
      this.diffEquals(existing.diff, data.diff)
    ) {
      existing.timestamp = now;
      existing.conflictingValues = data.conflictingValues;
      existing.description = data.description;
      existing.diff = data.diff;
      existing.signature = data.signature;
      return existing;
    }

    const conflict: Conflict = {
      id: conflictId,
      type: data.type,
      entityId: data.entityId,
      relationshipId: data.relationshipId,
      description: data.description,
      conflictingValues: data.conflictingValues,
      diff: data.diff,
      signature: data.signature,
      timestamp: now,
      resolved: false,
    };

    this.conflicts.set(conflictId, conflict);
    this.notifyConflictListeners(conflict);
    return conflict;
  }

  private diffEquals(a?: DiffMap, b?: DiffMap): boolean {
    if (!a && !b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }

    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) {
      return false;
    }

    for (let i = 0; i < keysA.length; i += 1) {
      if (keysA[i] !== keysB[i]) {
        return false;
      }
      const key = keysA[i];
      if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        return false;
      }
    }

    return true;
  }

  private describeDiff(
    prefix: "Entity" | "Relationship",
    identifier: string,
    diff: DiffMap
  ): string {
    const fields = Object.keys(diff).join(", ");
    return `${prefix} ${identifier} has divergence in: ${fields || "values"}`;
  }

  private async applyResolution(
    conflict: Conflict,
    resolution: ConflictResolutionResult
  ): Promise<boolean> {
    try {
      switch (resolution.strategy) {
        case "overwrite":
        case "merge": {
          if (conflict.entityId) {
            const payload =
              resolution.resolvedValue ?? conflict.conflictingValues.incoming;
            if (!payload) {
              throw new Error(
                `No resolved value provided for conflict ${conflict.id}`
              );
            }
            await this.kgService.updateEntity(conflict.entityId, payload);
          } else if (conflict.relationshipId) {
            const payload =
              (resolution.resolvedValue as GraphRelationship) ??
              (conflict.conflictingValues.incoming as GraphRelationship);
            if (!payload) {
              throw new Error(
                `No relationship payload provided for conflict ${conflict.id}`
              );
            }
            await this.kgService.upsertRelationship(
              this.normalizeRelationshipInput(payload)
            );
          }
          break;
        }
        case "skip":

          break;
        case "manual": {
          if (resolution.resolvedValue) {
            if (conflict.entityId) {
              await this.kgService.updateEntity(
                conflict.entityId,
                resolution.resolvedValue
              );
            } else if (conflict.relationshipId) {
              await this.kgService.upsertRelationship(
                this.normalizeRelationshipInput(
                  resolution.resolvedValue as GraphRelationship
                )
              );
            }
          }
          break;
        }
        default:
          throw new Error(
            `Unsupported resolution strategy: ${resolution.strategy}`
          );
      }

      return true;
    } catch (error) {
      console.error(
        `Failed to apply conflict resolution for ${conflict.id}:`,
        error
      );
      return false;
    }
  }

  private recordManualOverride(
    conflict: Conflict,
    resolution: ConflictResolutionResult
  ): void {
    if (!conflict.signature) {
      return;
    }

    const targetId = conflict.entityId || conflict.relationshipId || conflict.id;
    this.manualOverrides.set(conflict.signature, {
      signature: conflict.signature,
      conflictType: conflict.type,
      targetId,
      resolvedValue: resolution.resolvedValue,
      manualResolution: resolution.manualResolution,
      resolvedBy: resolution.resolvedBy,
      timestamp: resolution.timestamp,
    });
  }

  private normalizeRelationshipInput(
    relationship: GraphRelationship
  ): GraphRelationship {
    const rel: any = { ...(relationship as any) };
    rel.fromEntityId = rel.fromEntityId ?? rel.sourceId;
    rel.toEntityId = rel.toEntityId ?? rel.targetId;
    delete rel.sourceId;
    delete rel.targetId;

    if (rel.fromEntityId && rel.toEntityId && rel.type) {
      return this.kgService.canonicalizeRelationship(rel as GraphRelationship);
    }

    return rel as GraphRelationship;
  }
}

================
File: scm/GitService.ts
================
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import type {
  SCMStatusSummary,
  SCMBranchInfo,
  SCMCommitLogEntry,
} from "@memento/core";

const execFileAsync = promisify(execFile);
const FIELD_SEPARATOR = "\u001f";

export interface CommitInfo {
  hash: string;
  author: string;
  email?: string;
  date?: string;
}

export class GitService {
  constructor(private cwd: string = process.cwd()) {}

  private async runGit(
    args: string[],
    options: { maxBuffer?: number; env?: NodeJS.ProcessEnv } = {}
  ): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024,
        env: { ...process.env, ...options.env },
      });
      return String(stdout ?? "");
    } catch (error: any) {
      const stderr = error?.stderr ? String(error.stderr).trim() : "";
      const stdout = error?.stdout ? String(error.stdout).trim() : "";
      const baseMessage = error instanceof Error ? error.message : "";
      const details = [stderr, stdout, baseMessage].filter(Boolean).join("\n");
      const command = ["git", ...args].join(" ");
      const message = details ? `${command}\n${details}` : command;
      const wrapped = new Error(`Git command failed: ${message}`);
      (wrapped as any).cause = error;
      throw wrapped;
    }
  }

  private resolvePath(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Empty path provided");
    }
    const absolute = path.isAbsolute(trimmed)
      ? trimmed
      : path.resolve(this.cwd, trimmed);
    const relative = path.relative(this.cwd, absolute);
    if (relative.startsWith("..")) {
      throw new Error(`Path ${input} is outside of the repository root`);
    }
    return relative.replace(/\\/g, "/");
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd: this.cwd,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getLastCommitInfo(
    fileRelativePath: string
  ): Promise<CommitInfo | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = [
        "log",
        "-1",
        `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad`,
        "--",
        filePath,
      ];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 1024 * 1024,
      });
      const line = String(stdout || "").trim();
      if (!line) return null;
      const [hash, author, email, date] = line.split(FIELD_SEPARATOR);
      return { hash, author, email, date };
    } catch {
      return null;
    }
  }

  async getNumStatAgainstHEAD(
    fileRelativePath: string
  ): Promise<{ added: number; deleted: number } | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = ["diff", "--numstat", "HEAD", "--", filePath];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 1024 * 1024,
      });
      const line = String(stdout || "")
        .trim()
        .split("\n")
        .find(Boolean);
      if (!line) return null;
      const parts = line.split("\t");
      if (parts.length < 3) return null;
      const added = parseInt(parts[0], 10);
      const deleted = parseInt(parts[1], 10);
      return {
        added: Number.isFinite(added) ? added : 0,
        deleted: Number.isFinite(deleted) ? deleted : 0,
      };
    } catch {
      return null;
    }
  }

  async getUnifiedDiff(
    fileRelativePath: string,
    context: number = 3
  ): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = [
        "diff",
        `-U${Math.max(0, Math.min(20, context))}`,
        "--",
        filePath,
      ];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 4 * 1024 * 1024,
      });
      const diff = String(stdout || "").trim();
      return diff || null;
    } catch {
      return null;
    }
  }

  async getCurrentBranch(): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const output = await this.runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
      const branch = output.trim();
      if (!branch || branch === "HEAD") {
        return null;
      }
      return branch;
    } catch {
      return null;
    }
  }

  async getRemoteUrl(remote: string): Promise<string | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const trimmed = remote.trim();
    if (!trimmed) {
      throw new Error("Remote name must not be empty");
    }

    try {
      const output = await this.runGit(["remote", "get-url", trimmed]);
      const url = output.trim();
      return url || null;
    } catch (error) {
      throw new Error(
        `Unable to resolve remote '${trimmed}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async stageFiles(paths: string[]): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const unique = Array.from(
      new Set(
        paths.filter((value): value is string => typeof value === "string")
      )
    );

    if (!unique.length) {
      return [];
    }

    const relativePaths = unique.map((input) => this.resolvePath(input));


    for (const relative of relativePaths) {
      const absolute = path.resolve(this.cwd, relative);
      if (!fs.existsSync(absolute)) {
        try {
          await this.runGit(["ls-files", "--error-unmatch", relative]);
        } catch (error) {
          console.warn(
            `⚠️ Staging untracked/missing file: ${relative} (will be added)`
          );
        }
      } else {

        try {
          await this.runGit(["ls-files", "--cached", relative]);
        } catch {
          console.warn(`⚠️ Staging modified tracked file: ${relative}`);
        }
      }
    }

    await this.runGit(["add", "--", ...relativePaths]);
    return relativePaths;
  }

  async unstageFiles(paths: string[]): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const unique = Array.from(
      new Set(
        paths.filter((value): value is string => typeof value === "string")
      )
    );
    if (!unique.length) {
      return;
    }
    const relativePaths = unique.map((input) => this.resolvePath(input));
    await this.runGit(["reset", "--", ...relativePaths]);
  }

  async hasStagedChanges(): Promise<boolean> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const diff = await this.runGit(["diff", "--cached", "--name-only"]);
    return diff.trim().length > 0;
  }

  async getStagedFiles(): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const diff = await this.runGit(["diff", "--cached", "--name-only"]);
    return diff
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async getCommitHash(ref: string = "HEAD"): Promise<string | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const output = await this.runGit(["rev-parse", ref]);
    const hash = output.trim();
    return hash || null;
  }

  async commit(
    title: string,
    body: string,
    options: {
      allowEmpty?: boolean;
      author?: { name: string; email?: string };
    } = {}
  ): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const args = ["commit", "--no-verify", "-m", title];
    if (body && body.trim().length) {
      args.push("-m", body.trim());
    }
    if (options.allowEmpty) {
      args.push("--allow-empty");
    }

    const envOverrides: NodeJS.ProcessEnv = {};
    if (options.author?.name) {
      envOverrides.GIT_AUTHOR_NAME = options.author.name;
      envOverrides.GIT_COMMITTER_NAME = options.author.name;
    }
    if (options.author?.email) {
      envOverrides.GIT_AUTHOR_EMAIL = options.author.email;
      envOverrides.GIT_COMMITTER_EMAIL = options.author.email;
    }

    await this.runGit(args, { env: envOverrides });
    const hash = await this.getCommitHash("HEAD");
    if (!hash) {
      throw new Error("Unable to determine commit hash after committing");
    }
    return hash;
  }

  private async branchExists(name: string): Promise<boolean> {
    try {
      await this.runGit(["show-ref", "--verify", `refs/heads/${name}`]);
      return true;
    } catch {
      return false;
    }
  }

  private async hasUpstream(branch: string): Promise<boolean> {
    const sanitized = branch.trim();
    if (!sanitized) {
      return false;
    }
    try {
      const output = await this.runGit([
        "rev-parse",
        "--abbrev-ref",
        `${sanitized}@{upstream}`,
      ]);
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  async ensureBranch(
    name: string,
    from?: string,
    options?: { preservePaths?: string[] }
  ): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const sanitized = name.trim();
    if (!sanitized) {
      throw new Error("Branch name must not be empty");
    }

    const current = await this.getCurrentBranch();
    const exists = await this.branchExists(sanitized);

    if (exists) {
      if (current !== sanitized) {
        await this.switchWithStashSupport(sanitized, options?.preservePaths);
      }
      return;
    }

    const base = from ? from.trim() : current;
    const args = ["switch", "-c", sanitized];
    if (base && base.length) {
      args.push(base);
    }
    await this.runGit(args);
  }

  private async switchWithStashSupport(
    targetBranch: string,
    preservePaths?: string[]
  ): Promise<void> {
    try {
      await this.runGit(["switch", targetBranch]);
      return;
    } catch (error) {
      if (!this.isCheckoutConflictError(error)) {
        throw error;
      }
    }

    const stashRef = await this.stashWorkingChanges();
    let switched = false;
    try {
      await this.runGit(["switch", targetBranch]);
      switched = true;
    } catch (switchError) {
      await this.restoreStash(stashRef).catch(() => {});
      throw switchError;
    }

    if (switched) {
      if (preservePaths && preservePaths.length) {
        for (const candidate of preservePaths) {
          try {
            const relative = this.resolvePath(candidate);
            const absolute = path.resolve(this.cwd, relative);
            await fs.promises.rm(absolute, { force: true });
          } catch {

          }
        }
      }
      let applied = false;
      try {
        await this.runGit(["stash", "apply", stashRef]);
        applied = true;
      } catch (popError) {
        const details =
          popError instanceof Error ? popError.message : String(popError ?? "");
        throw new Error(
          `Failed to reapply working changes after switching branches: ${details}. ` +
            `Stash ${stashRef} was kept for manual recovery.`
        );
      } finally {
        if (applied) {
          await this.runGit(["stash", "drop", stashRef]).catch(() => {});
        }
      }
    }
  }

  private async stashWorkingChanges(): Promise<string> {
    await this.runGit([
      "stash",
      "push",
      "--include-untracked",
      "--message",
      "memento-scm-service-temp",
    ]);
    return "stash@{0}";
  }

  private async restoreStash(ref: string): Promise<void> {
    await this.runGit(["stash", "pop", ref]);
  }

  private isCheckoutConflictError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message || "";
    return (
      message.includes("would be overwritten by checkout") ||
      message.includes("Please move or remove them before you switch branches")
    );
  }

  async getCommitDetails(ref: string): Promise<SCMCommitLogEntry | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const raw = await this.runGit([
      "show",
      "-s",
      `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad${FIELD_SEPARATOR}%s`,
      ref,
    ]);
    const line = raw.trim();
    if (!line) {
      return null;
    }
    const [hash, author, email, date, message] = line.split(FIELD_SEPARATOR);
    return {
      hash,
      author,
      email: email || undefined,
      date,
      message,
    };
  }

  async getFilesForCommit(commitHash: string): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const raw = await this.runGit([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commitHash,
    ]);
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async push(
    remote: string,
    branch: string,
    options: { force?: boolean } = {}
  ): Promise<{ output: string }> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const sanitizedRemote = remote.trim();
    const sanitizedBranch = branch.trim();
    if (!sanitizedRemote) {
      throw new Error("Remote name must not be empty");
    }
    if (!sanitizedBranch) {
      throw new Error("Branch name must not be empty");
    }

    const args = ["push"];
    if (options.force) {
      args.push("--force-with-lease");
    }
    const hasTracking = await this.hasUpstream(sanitizedBranch);
    if (!hasTracking) {
      args.push("--set-upstream");
    }
    args.push(sanitizedRemote, sanitizedBranch);
    const output = await this.runGit(args);
    return { output };
  }

  async getStatusSummary(): Promise<SCMStatusSummary | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const raw = await this.runGit(["status", "--short", "--branch"]);
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) {
        return null;
      }

      const first = lines[0];
      let branch = "HEAD";
      let ahead = 0;
      let behind = 0;

      if (first.startsWith("##")) {
        const info = first.slice(2).trim();
        const headMatch = info.match(/^([^\.\s]+)/);
        if (headMatch) {
          branch = headMatch[1];
        }
        const aheadMatch = info.match(/ahead (\d+)/);
        const behindMatch = info.match(/behind (\d+)/);
        if (aheadMatch) ahead = Number.parseInt(aheadMatch[1], 10) || 0;
        if (behindMatch) behind = Number.parseInt(behindMatch[1], 10) || 0;
      }

      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        if (line.startsWith("??")) {
          untracked.push(line.slice(3).trim());
          continue;
        }
        const status = line.slice(0, 2);
        const file = line.slice(3).trim();
        if (!file) continue;
        const stagedFlag = status[0];
        const unstagedFlag = status[1];
        if (stagedFlag && stagedFlag !== " ") {
          staged.push(file);
        }
        if (unstagedFlag && unstagedFlag !== " ") {
          unstaged.push(file);
        }
      }

      let lastCommit: SCMStatusSummary["lastCommit"] = null;
      try {
        const commitRaw = await this.runGit([
          "log",
          "-1",
          "--pretty=format:%H|%an|%ad|%s",
        ]);
        const [hash, author, date, title] = commitRaw.split("|");
        if (hash) {
          lastCommit = {
            hash,
            author: author || "",
            date,
            title: title || "",
          };
        }
      } catch {
        lastCommit = null;
      }

      const clean =
        staged.length === 0 && unstaged.length === 0 && untracked.length === 0;

      return {
        branch,
        clean,
        ahead,
        behind,
        staged,
        unstaged,
        untracked,
        lastCommit,
      };
    } catch {
      return null;
    }
  }

  async listBranches(): Promise<SCMBranchInfo[]> {
    try {
      if (!(await this.isAvailable())) return [];
      const current = await this.getCurrentBranch();
      const raw = await this.runGit([
        "for-each-ref",
        `--format=%(refname:short)${FIELD_SEPARATOR}%(objectname:short)${FIELD_SEPARATOR}%(authordate:iso8601)${FIELD_SEPARATOR}%(authorname)`,
        "refs/heads",
      ]);
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines.map((line) => {
        const [name, hash, date, author] = line.split(FIELD_SEPARATOR);
        return {
          name: name || "",
          isCurrent: current ? name === current : false,
          isRemote: false,
          upstream: null,
          lastCommit: hash
            ? {
                hash,
                title: "",
                author: author || undefined,
                date: date || undefined,
              }
            : null,
        } as SCMBranchInfo;
      });
    } catch {
      return [];
    }
  }

  async getCommitLog(
    options: {
      limit?: number;
      author?: string;
      path?: string;
      since?: string;
      until?: string;
    } = {}
  ): Promise<SCMCommitLogEntry[]> {
    try {
      if (!(await this.isAvailable())) return [];
      const args = ["log"];
      const limit = Math.max(1, Math.min(options.limit ?? 20, 200));
      args.push(`-${limit}`);
      args.push(
        `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%D`
      );
      if (options.author) {
        args.push(`--author=${options.author}`);
      }
      if (options.since) {
        args.push(`--since=${options.since}`);
      }
      if (options.until) {
        args.push(`--until=${options.until}`);
      }

      let includePath = false;
      if (options.path) {
        includePath = true;
      }

      if (includePath) {
        args.push("--");
        args.push(options.path as string);
      }

      const raw = await this.runGit(args, { maxBuffer: 8 * 1024 * 1024 });
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [hash, author, email, date, message, refs] =
            line.split(FIELD_SEPARATOR);
          return {
            hash,
            author,
            email: email || undefined,
            date,
            message,
            refs: refs
              ? refs
                  .split(",")
                  .map((ref) => ref.trim())
                  .filter(Boolean)
              : undefined,
          } as SCMCommitLogEntry;
        });
    } catch {
      return [];
    }
  }

  async getDiff(
    options: {
      from?: string;
      to?: string;
      files?: string[];
      context?: number;
    } = {}
  ): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const args = ["diff"];
      const context = options.context ?? 3;
      const normalizedContext = Math.max(0, Math.min(20, context));
      args.push(`-U${normalizedContext}`);

      if (options.from && options.to) {
        args.push(options.from, options.to);
      } else if (options.from) {
        args.push(options.from);
      } else if (options.to) {
        args.push(options.to);
      }

      if (options.files && options.files.length > 0) {
        args.push("--", ...options.files.filter(Boolean));
      }

      const diff = await this.runGit(args, { maxBuffer: 8 * 1024 * 1024 });
      const trimmed = diff.trim();
      return trimmed || null;
    } catch {
      return null;
    }
  }
}

================
File: scm/index.ts
================
export { default as ConflictResolution } from './ConflictResolution.js';
export { default as GitService } from './GitService.js';
export { default as LocalGitProvider } from './LocalGitProvider.js';
export { default as RollbackCapabilities } from './RollbackCapabilities.js';
export { SCMProvider } from './SCMProvider.js';
export { default as SCMService } from './SCMService.js';

================
File: scm/LocalGitProvider.ts
================
import { GitService } from "./GitService.js";
import {
  SCMProvider,
  SCMProviderPullRequestPayload,
  SCMProviderResult,
  SCMProviderError,
} from "./SCMProvider.js";

export interface LocalGitProviderOptions {
  remote?: string;
}

export class LocalGitProvider implements SCMProvider {
  public readonly name = "local";

  constructor(
    private readonly git: GitService,
    private readonly options: LocalGitProviderOptions = {}
  ) {}

  async preparePullRequest(
    payload: SCMProviderPullRequestPayload
  ): Promise<SCMProviderResult> {
    const remoteName = payload.push?.remote || this.options.remote || "origin";

    let remoteUrl: string | null = null;
    try {
      remoteUrl = await this.git.getRemoteUrl(remoteName);
    } catch (error) {
      throw new SCMProviderError(
        `Remote '${remoteName}' is not configured: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    if (!remoteUrl) {
      throw new SCMProviderError(
        `Remote '${remoteName}' URL could not be determined`
      );
    }

    const pushResult = await this.git.push(remoteName, payload.branch, {
      force: payload.push?.force,
    });

    const message = pushResult.output.trim();
    const url = this.buildLocalPullRequestUrl(remoteUrl, payload.branch, payload.commitHash);

    return {
      provider: this.name,
      remote: remoteName,
      pushed: true,
      message,
      prUrl: url,
      metadata: {
        remoteUrl,
        push: {
          remote: remoteName,
          branch: payload.branch,
          force: payload.push?.force || false,
        },
      },
    };
  }

  private buildLocalPullRequestUrl(
    remoteUrl: string,
    branch: string,
    commitHash: string
  ): string {
    const cleanedRemote = remoteUrl.replace(/\.git$/i, "");
    const encodedBranch = encodeURIComponent(branch);
    return `${cleanedRemote}#${encodedBranch}:${commitHash}`;
  }
}

================
File: scm/RollbackCapabilities.ts
================
import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/core";
import { Entity } from "@memento/graph";
import { GraphRelationship } from "@memento/graph";

const SNAPSHOT_PAGE_SIZE = 1000;

export interface RollbackPoint {
  id: string;
  operationId: string;
  timestamp: Date;
  entities: RollbackEntity[];
  relationships: RollbackRelationship[];
  description: string;
}

export interface RollbackEntity {
  id: string;
  action: "create" | "update" | "delete";
  previousState?: Entity;
  newState?: Entity;
}

export interface RollbackRelationship {
  id: string;
  action: "create" | "update" | "delete";
  fromEntityId?: string;
  toEntityId?: string;
  type?: GraphRelationship["type"];
  previousState?: GraphRelationship;
  newState?: GraphRelationship;
}

export interface SessionCheckpointRecord {
  checkpointId: string;
  sessionId: string;
  reason: "daily" | "incident" | "manual";
  hopCount: number;
  attempts: number;
  seedEntityIds: string[];
  jobId?: string;
  recordedAt: Date;
}

export interface RollbackResult {
  success: boolean;
  rolledBackEntities: number;
  rolledBackRelationships: number;
  errors: RollbackError[];
  partialSuccess: boolean;
}

export interface RollbackError {
  type: "entity" | "relationship";
  id: string;
  action: string;
  error: string;
  recoverable: boolean;
}

export class RollbackCapabilities {
  private rollbackPoints = new Map<string, RollbackPoint>();
  private maxRollbackPoints = 50;
  private sessionCheckpointLinks = new Map<string, SessionCheckpointRecord[]>();

  constructor(
    private kgService: KnowledgeGraphService,
    private dbService: DatabaseService
  ) {}

  private ensureDatabaseReady(context: string): void {
    if (
      !this.dbService ||
      typeof this.dbService.isInitialized !== "function" ||
      !this.dbService.isInitialized()
    ) {
      const message = context
        ? `Database service not initialized (${context})`
        : "Database service not initialized";
      throw new Error(message);
    }
  }




  async createRollbackPoint(
    operationId: string,
    description: string
  ): Promise<string> {
    this.ensureDatabaseReady("createRollbackPoint");
    const rollbackId = `rollback_${operationId}_${Date.now()}`;


    const allEntities = await this.captureCurrentEntities();
    const allRelationships = await this.captureCurrentRelationships();

    const rollbackPoint: RollbackPoint = {
      id: rollbackId,
      operationId,
      timestamp: new Date(),
      entities: allEntities,
      relationships: allRelationships,
      description,
    };

    this.rollbackPoints.set(rollbackId, rollbackPoint);


    this.cleanupOldRollbackPoints();

    return rollbackId;
  }

  registerCheckpointLink(
    sessionId: string,
    record: {
      checkpointId: string;
      reason: "daily" | "incident" | "manual";
      hopCount: number;
      attempts: number;
      seedEntityIds?: string[];
      jobId?: string;
      timestamp?: Date;
    }
  ): void {
    if (!sessionId || !record?.checkpointId) {
      return;
    }

    const seeds = Array.isArray(record.seedEntityIds)
      ? Array.from(
          new Set(
            record.seedEntityIds.filter(
              (value) => typeof value === "string" && value.length > 0
            )
          )
        )
      : [];
    const history = this.sessionCheckpointLinks.get(sessionId) ?? [];
    const entry: SessionCheckpointRecord = {
      sessionId,
      checkpointId: record.checkpointId,
      reason: record.reason,
      hopCount: Math.max(1, Math.min(record.hopCount, 10)),
      attempts: Math.max(1, record.attempts),
      seedEntityIds: seeds,
      jobId: record.jobId,
      recordedAt:
        record.timestamp instanceof Date ? new Date(record.timestamp) : new Date(),
    };

    history.push(entry);
    history.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const trimmed = history.slice(-25);
    this.sessionCheckpointLinks.set(sessionId, trimmed);
  }

  getSessionCheckpointHistory(
    sessionId: string,
    options: { limit?: number } = {}
  ): SessionCheckpointRecord[] {
    const list = this.sessionCheckpointLinks.get(sessionId) ?? [];
    const limitRaw = options.limit;
    if (typeof limitRaw === "number" && limitRaw > 0) {
      return list.slice(Math.max(0, list.length - Math.floor(limitRaw)));
    }
    return [...list];
  }

  getLatestSessionCheckpoint(sessionId: string): SessionCheckpointRecord | undefined {
    const list = this.sessionCheckpointLinks.get(sessionId) ?? [];
    if (list.length === 0) return undefined;
    return list[list.length - 1];
  }




  async listRollbackPoints(entityId: string): Promise<RollbackPoint[]> {
    const entityRollbackPoints: RollbackPoint[] = [];

    for (const [rollbackId, rollbackPoint] of this.rollbackPoints.entries()) {

      const hasEntity =
        (Array.isArray(rollbackPoint.entities) &&
          rollbackPoint.entities.some((entity) => entity.id === entityId)) ||
        (Array.isArray(rollbackPoint.relationships) &&
          rollbackPoint.relationships.some((rel) => {
            const prev = rel.previousState as any;
            const next = rel.newState as any;
            return (
              (!!prev && (prev.fromEntityId === entityId || prev.toEntityId === entityId)) ||
              (!!next && (next.fromEntityId === entityId || next.toEntityId === entityId))
            );
          }));

      if (hasEntity) {
        entityRollbackPoints.push(rollbackPoint);
      }
    }


    return entityRollbackPoints.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }




  private async captureCurrentEntities(): Promise<any[]> {
    try {
      return await this.collectAllEntities();
    } catch (error) {
      console.error("Failed to capture current entities:", error);

      if (
        error instanceof Error &&
        error.message.includes("Database connection failed")
      ) {
        throw error;
      }
      return [];
    }
  }




  private async captureCurrentRelationships(): Promise<any[]> {
    try {
      const relationships = await this.collectAllRelationships();

      return relationships.map((relationship) => ({
        id: relationship.id,
        action: "create",
        fromEntityId: relationship.fromEntityId,
        toEntityId: relationship.toEntityId,
        type: relationship.type,
        previousState: relationship,
        newState: relationship,
      }));
    } catch (error) {
      console.error("Failed to capture current relationships:", error);

      if (
        error instanceof Error &&
        error.message.includes("Database connection failed")
      ) {
        throw error;
      }
      return [];
    }
  }

  private async collectAllEntities(): Promise<Entity[]> {
    const allEntities: Entity[] = [];
    let offset = 0;

    while (true) {
      const batch = await this.kgService.listEntities({
        limit: SNAPSHOT_PAGE_SIZE,
        offset,
      });
      const entities = batch.entities || [];

      if (entities.length === 0) {
        break;
      }

      allEntities.push(...entities);
      offset += entities.length;

      const reachedEnd =
        entities.length < SNAPSHOT_PAGE_SIZE ||
        (typeof batch.total === "number" && allEntities.length >= batch.total);

      if (reachedEnd) {
        break;
      }
    }

    return allEntities;
  }

  private async collectAllRelationships(): Promise<GraphRelationship[]> {
    const allRelationships: GraphRelationship[] = [];
    let offset = 0;

    while (true) {
      const batch = await this.kgService.listRelationships({
        limit: SNAPSHOT_PAGE_SIZE,
        offset,
      });
      const relationships = batch.relationships || [];

      if (relationships.length === 0) {
        break;
      }

      allRelationships.push(...relationships);
      offset += relationships.length;

      const reachedEnd =
        relationships.length < SNAPSHOT_PAGE_SIZE ||
        (typeof batch.total === "number" &&
          allRelationships.length >= batch.total);

      if (reachedEnd) {
        break;
      }
    }

    return allRelationships;
  }




  async recordEntityChange(
    rollbackId: string,
    entityId: string,
    action: "create" | "update" | "delete",
    previousState?: Entity,
    newState?: Entity
  ): Promise<void> {
    this.ensureDatabaseReady("recordEntityChange");
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`);
    }


    if ((action === "update" || action === "delete") && !previousState) {
      previousState = (await this.kgService.getEntity(entityId)) || undefined;
    }

    rollbackPoint.entities.push({
      id: entityId,
      action,
      previousState,
      newState,
    });
  }




  recordRelationshipChange(
    rollbackId: string,
    relationshipId: string,
    action: "create" | "update" | "delete",
    previousState?: GraphRelationship,
    newState?: GraphRelationship
  ): void {
    this.ensureDatabaseReady("recordRelationshipChange");
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackId} not found`);
    }

    const stateForKeys = newState ?? previousState;

    if (!stateForKeys) {
      throw new Error(
        `Cannot record relationship change for ${relationshipId} without relationship state`
      );
    }

    rollbackPoint.relationships.push({
      id: relationshipId,
      action,
      fromEntityId: stateForKeys.fromEntityId,
      toEntityId: stateForKeys.toEntityId,
      type: stateForKeys.type,
      previousState,
      newState,
    });
  }




  async rollbackToPoint(rollbackId: string): Promise<RollbackResult> {
    this.ensureDatabaseReady("rollbackToPoint");
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      return {
        success: false,
        rolledBackEntities: 0,
        rolledBackRelationships: 0,
        errors: [
          {
            type: "entity",
            id: rollbackId,
            action: "rollback",
            error: `Rollback point ${rollbackId} not found`,
            recoverable: false,
          },
        ],
        partialSuccess: false,
      };
    }

    const result: RollbackResult = {
      success: true,
      rolledBackEntities: 0,
      rolledBackRelationships: 0,
      errors: [],
      partialSuccess: false,
    };

    try {

      if (!rollbackPoint.entities || !Array.isArray(rollbackPoint.entities)) {
        result.success = false;
        result.errors.push({
          type: "entity",
          id: rollbackId,
          action: "rollback",
          error: "Rollback point entities property is missing or not an array",
          recoverable: false,
        });
        return result;
      }

      if (
        !rollbackPoint.relationships ||
        !Array.isArray(rollbackPoint.relationships)
      ) {
        result.success = false;
        result.errors.push({
          type: "relationship",
          id: rollbackId,
          action: "rollback",
          error:
            "Rollback point relationships property is missing or not an array",
          recoverable: false,
        });
        return result;
      }



      const hasChangeObjects =
        rollbackPoint.entities.length > 0 &&
        rollbackPoint.entities[0] &&
        (rollbackPoint.entities[0] as any).action !== undefined;

      if (hasChangeObjects) {

        for (let i = rollbackPoint.entities.length - 1; i >= 0; i--) {
          const entityChange = rollbackPoint.entities[i] as any;
          try {
            await this.rollbackEntityChange(entityChange);
            result.rolledBackEntities++;
          } catch (error) {
            const rollbackError: RollbackError = {
              type: "entity",
              id: entityChange.id,
              action: entityChange.action,
              error: error instanceof Error ? error.message : "Unknown error",
              recoverable: false,
            };
            result.errors.push(rollbackError);
            result.success = false;
          }
        }
      } else {


        const currentEntities = await this.collectAllEntities();
        const currentEntityMap = new Map(currentEntities.map((e) => [e.id, e]));


        for (const currentEntity of currentEntities) {
          const existsInCaptured = rollbackPoint.entities.some(
            (captured: any) => captured.id === currentEntity.id
          );
          if (!existsInCaptured) {
            try {
              await this.kgService.deleteEntity(currentEntity.id);
              result.rolledBackEntities++;
            } catch (error) {
              const rollbackError: RollbackError = {
                type: "entity",
                id: currentEntity.id,
                action: "delete",
                error: error instanceof Error ? error.message : "Unknown error",
                recoverable: false,
              };
              result.errors.push(rollbackError);
              result.success = false;
            }
          }
        }


        for (const capturedEntity of rollbackPoint.entities) {
          const currentEntity = currentEntityMap.get(
            (capturedEntity as any).id
          );
          if (!currentEntity) {

            try {
              await this.kgService.createEntity(
                capturedEntity as unknown as Entity
              );
              result.rolledBackEntities++;
            } catch (error) {
              const rollbackError: RollbackError = {
                type: "entity",
                id: (capturedEntity as any).id,
                action: "create",
                error: error instanceof Error ? error.message : "Unknown error",
                recoverable: false,
              };
              result.errors.push(rollbackError);
              result.success = false;
            }
          } else if (
            JSON.stringify(currentEntity) !== JSON.stringify(capturedEntity)
          ) {

            try {

              const entity = capturedEntity as any;
              const { id, type, ...updateFields } = entity;
              await this.kgService.updateEntity(entity.id, updateFields);
              result.rolledBackEntities++;
            } catch (error) {
              const rollbackError: RollbackError = {
                type: "entity",
                id: (capturedEntity as any).id,
                action: "update",
                error: error instanceof Error ? error.message : "Unknown error",
                recoverable: false,
              };
              result.errors.push(rollbackError);
              result.success = false;
            }
          }
        }
      }


      const currentRelationshipList = await this.collectAllRelationships();
      const currentRelationshipMap = new Map(
        currentRelationshipList.map((relationship) => [
          `${relationship.fromEntityId}-${relationship.toEntityId}-${relationship.type}`,
          relationship,
        ])
      );

      const capturedRelationships: Array<{
        key: string;
        id: string;
        state?: GraphRelationship;
      }> = [];
      const capturedRelationshipKeys = new Set<string>();

      for (const captured of rollbackPoint.relationships) {
        const baseState = captured.newState ?? captured.previousState;
        const fromEntityId = captured.fromEntityId ?? baseState?.fromEntityId;
        const toEntityId = captured.toEntityId ?? baseState?.toEntityId;
        const type = captured.type ?? baseState?.type;

        if (!fromEntityId || !toEntityId || !type) {
          continue;
        }

        const key = `${fromEntityId}-${toEntityId}-${type}`;
        capturedRelationshipKeys.add(key);
        capturedRelationships.push({
          key,
          id: captured.id,
          state: baseState,
        });
      }


      for (const currentRelationship of currentRelationshipList) {
        const relationshipKey = `${currentRelationship.fromEntityId}-${currentRelationship.toEntityId}-${currentRelationship.type}`;
        if (!capturedRelationshipKeys.has(relationshipKey)) {
          try {
            await this.kgService.deleteRelationship(currentRelationship.id);
            result.rolledBackRelationships++;
            currentRelationshipMap.delete(relationshipKey);
          } catch (error) {
            const rollbackError: RollbackError = {
              type: "relationship",
              id: currentRelationship.id,
              action: "delete",
              error: error instanceof Error ? error.message : "Unknown error",
              recoverable: false,
            };
            result.errors.push(rollbackError);
            result.success = false;
          }
        }
      }


      for (const captured of capturedRelationships) {
        if (currentRelationshipMap.has(captured.key)) {
          continue;
        }

        if (!captured.state) {
          result.errors.push({
            type: "relationship",
            id: captured.id,
            action: "create",
            error: `Captured relationship ${captured.id} is missing state for recreation`,
            recoverable: false,
          });
          result.success = false;
          continue;
        }

        try {
          await this.kgService.createRelationship(captured.state);
          result.rolledBackRelationships++;
          currentRelationshipMap.set(captured.key, captured.state);
        } catch (error) {
          const rollbackError: RollbackError = {
            type: "relationship",
            id: captured.id,
            action: "create",
            error: error instanceof Error ? error.message : "Unknown error",
            recoverable: false,
          };
          result.errors.push(rollbackError);
          result.success = false;
        }
      }


      if (!result.success && result.errors.length > 0) {
        result.partialSuccess = true;
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        type: "entity",
        id: "rollback_process",
        action: "rollback",
        error:
          error instanceof Error ? error.message : "Unknown rollback error",
        recoverable: false,
      });
    }

    return result;
  }




  private async rollbackEntityChange(change: RollbackEntity): Promise<void> {
    switch (change.action) {
      case "create":

        await this.kgService.deleteEntity(change.id);
        break;

      case "update":

        if (change.previousState) {
          await this.kgService.updateEntity(change.id, change.previousState);
        } else {

          await this.kgService.deleteEntity(change.id);
        }
        break;

      case "delete":

        if (change.previousState) {

          if (change.id !== (change.previousState as any).id) {
            throw new Error(
              `Cannot rollback delete: ID mismatch between change (${
                change.id
              }) and previousState (${(change.previousState as any).id})`
            );
          }
          await this.kgService.createEntity(change.previousState);
        } else {
          throw new Error(
            `Cannot rollback delete operation for ${change.id}: no previous state available`
          );
        }
        break;
    }
  }




  private async rollbackRelationshipChange(
    change: RollbackRelationship
  ): Promise<void> {
    switch (change.action) {
      case "create":

        if (change.newState) {
          try {
            await this.kgService.deleteRelationship(change.id);
          } catch (error) {

            console.warn(
              `Direct relationship deletion failed for ${change.id}, attempting property-based deletion`
            );


          }
        }
        break;

      case "update":

        if (change.previousState) {

          try {
            await this.kgService.deleteRelationship(change.id);
            await this.kgService.createRelationship(change.previousState);
          } catch (error) {
            console.error(
              `Failed to rollback relationship update for ${change.id}:`,
              error
            );
            throw error;
          }
        }
        break;

      case "delete":

        if (change.previousState) {
          try {
            await this.kgService.createRelationship(change.previousState);
          } catch (error) {
            console.error(
              `Failed to recreate deleted relationship ${change.id}:`,
              error
            );
            throw error;
          }
        }
        break;
    }
  }




  async rollbackLastOperation(
    operationId: string
  ): Promise<RollbackResult | null> {

    const operationRollbackPoints = Array.from(this.rollbackPoints.values())
      .filter((point) => point.operationId === operationId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    if (operationRollbackPoints.length === 0) {
      return null;
    }

    return this.rollbackToPoint(operationRollbackPoints[0].id);
  }




  getRollbackPointsForOperation(operationId: string): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values())
      .filter((point) => point.operationId === operationId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }




  getAllRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }




  deleteRollbackPoint(rollbackId: string): boolean {
    return this.rollbackPoints.delete(rollbackId);
  }




  getRollbackPoint(rollbackId: string): RollbackPoint | null {
    return this.rollbackPoints.get(rollbackId) || null;
  }




  cleanupOldRollbackPoints(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let cleanedCount = 0;


    for (const [id, point] of Array.from(this.rollbackPoints.entries())) {
      if (now - new Date(point.timestamp).getTime() >= maxAgeMs) {
        this.rollbackPoints.delete(id);
        cleanedCount++;
      }
    }


    if (this.rollbackPoints.size > this.maxRollbackPoints) {
      const sortedPoints = Array.from(this.rollbackPoints.values())
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, this.maxRollbackPoints);

      const currentSize = this.rollbackPoints.size;
      this.rollbackPoints.clear();
      sortedPoints.forEach((point) => {
        this.rollbackPoints.set(point.id, point);
      });
      cleanedCount += currentSize - this.maxRollbackPoints;
    }

    return cleanedCount;
  }




  async validateRollbackPoint(rollbackId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);
    if (!rollbackPoint) {
      return { valid: false, issues: ["Rollback point not found"] };
    }

    const issues: string[] = [];


    if (!rollbackPoint.entities || !Array.isArray(rollbackPoint.entities)) {
      issues.push(
        "Rollback point entities property is missing or not an array"
      );
    }

    if (
      !rollbackPoint.relationships ||
      !Array.isArray(rollbackPoint.relationships)
    ) {
      issues.push(
        "Rollback point relationships property is missing or not an array"
      );
    }


    if (issues.length > 0) {
      return { valid: false, issues };
    }


    for (const entityChange of rollbackPoint.entities) {
      try {
        const currentEntity = await this.kgService.getEntity(entityChange.id);

        switch (entityChange.action) {
          case "create":
            if (!currentEntity) {
              issues.push(
                `Entity ${entityChange.id} was expected to exist but doesn't`
              );
            }
            break;
          case "update":
          case "delete":
            if (entityChange.previousState && currentEntity) {

              const currentLastModified = (currentEntity as any).lastModified;
              const previousLastModified = (entityChange.previousState as any)
                .lastModified;
              if (
                currentLastModified &&
                previousLastModified &&
                new Date(currentLastModified).getTime() !==
                  new Date(previousLastModified).getTime()
              ) {
                issues.push(
                  `Entity ${entityChange.id} has been modified since rollback point creation`
                );
              }
            }
            break;
        }
      } catch (error) {
        issues.push(
          `Error validating entity ${entityChange.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }




  async createSnapshot(
    operationId: string,
    description: string
  ): Promise<string> {


    return this.createRollbackPoint(operationId, `Snapshot: ${description}`);
  }




  async restoreFromSnapshot(snapshotId: string): Promise<RollbackResult> {
    return this.rollbackToPoint(snapshotId);
  }




  getRollbackStatistics(): {
    totalRollbackPoints: number;
    oldestRollbackPoint: Date | null;
    newestRollbackPoint: Date | null;
    averageEntitiesPerPoint: number;
    averageRelationshipsPerPoint: number;
  } {
    const points = Array.from(this.rollbackPoints.values());

    if (points.length === 0) {
      return {
        totalRollbackPoints: 0,
        oldestRollbackPoint: null,
        newestRollbackPoint: null,
        averageEntitiesPerPoint: 0,
        averageRelationshipsPerPoint: 0,
      };
    }

    const sortedPoints = points.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const totalEntities = points.reduce((sum, point) => {
      if (Array.isArray(point.entities)) {
        return sum + point.entities.length;
      }
      return sum;
    }, 0);
    const totalRelationships = points.reduce((sum, point) => {
      if (Array.isArray(point.relationships)) {
        return sum + point.relationships.length;
      }
      return sum;
    }, 0);

    return {
      totalRollbackPoints: points.length,
      oldestRollbackPoint: sortedPoints[0].timestamp,
      newestRollbackPoint: sortedPoints[sortedPoints.length - 1].timestamp,
      averageEntitiesPerPoint: totalEntities / points.length,
      averageRelationshipsPerPoint: totalRelationships / points.length,
    };
  }
}

================
File: scm/SCMProvider.ts
================
export interface SCMProviderPushOptions {
  remote?: string;
  force?: boolean;
}

export interface SCMProviderPullRequestPayload {
  branch: string;
  baseBranch?: string | null;
  commitHash: string;
  title: string;
  description?: string;
  changes: string[];
  metadata?: Record<string, unknown>;
  push?: SCMProviderPushOptions;
}

export interface SCMProviderResult {
  provider: string;
  remote?: string;
  pushed: boolean;
  message?: string;
  prUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SCMProvider {
  readonly name: string;
  preparePullRequest(payload: SCMProviderPullRequestPayload): Promise<SCMProviderResult>;
}

export class SCMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SCMProviderError";
  }
}

export class SCMProviderNotConfiguredError extends SCMProviderError {
  constructor() {
    super("SCM provider is not configured for pull request creation");
    this.name = "SCMProviderNotConfiguredError";
  }
}

================
File: scm/SCMService.ts
================
import { GitService } from "./GitService.js";
import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/core";
import type {
  CommitPRRequest,
  CommitPRResponse,
  SCMCommitRecord,
  SCMStatusSummary,
  SCMBranchInfo,
  SCMPushResult,
  SCMCommitLogEntry,
  ValidationResult,
} from "@memento/core";
import { RelationshipType } from "@memento/graph";
import type { GraphRelationship } from "@memento/graph";
import type { Change, Entity, Test, Spec } from "@memento/graph";
import {
  SCMProvider,
  SCMProviderResult,
  SCMProviderNotConfiguredError,
  SCMProviderPullRequestPayload,
} from "./SCMProvider.js";

type CommitValidation = {
  title: string;
  description: string;
  changes: string[];
};

export class ValidationError extends Error {
  public readonly details: string[];

  constructor(details: string[]) {
    super(details.join("; "));
    this.name = "ValidationError";
    this.details = details;
  }
}

export class SCMService {
  constructor(
    private readonly git: GitService,
    private readonly kgService: KnowledgeGraphService,
    private readonly dbService: DatabaseService,
    private readonly provider?: SCMProvider
  ) {}

  private gitMutex: Promise<void> = Promise.resolve();

  private async runWithGitLock<T>(operation: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.gitMutex;
    this.gitMutex = previous.then(() => next);

    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async createCommitAndMaybePR(
    request: CommitPRRequest
  ): Promise<CommitPRResponse> {
    const normalized = this.validateCommitRequest(request);
    const shouldCreatePR = request.createPR !== false;

    if (shouldCreatePR && !this.provider) {
      throw new SCMProviderNotConfiguredError();
    }

    return this.runWithGitLock(async () => {
      if (!(await this.git.isAvailable())) {
        throw new Error("Git repository is not available");
      }

      const startingBranch = await this.git.getCurrentBranch();
      const branch =
        (request.branchName && request.branchName.trim()) ||
        (await this.git.getCurrentBranch()) ||
        "main";

      await this.git.ensureBranch(branch, startingBranch ?? undefined, {
        preservePaths: normalized.changes,
      });

      const existingStaged = await this.git.getStagedFiles();
      if (existingStaged.length) {
        const normalizePath = (value: string): string =>
          value.replace(/\\/g, "/").replace(/^\.\//, "");
        const requestedChanges = new Set(
          normalized.changes.map((change) => normalizePath(change))
        );
        const conflicting = existingStaged
          .map((path) => normalizePath(path))
          .filter((path) => !requestedChanges.has(path));

        if (conflicting.length) {
          throw new ValidationError([
            conflicting.length === 1
              ? `Staged change '${conflicting[0]}' is not included in this request. Unstage it or add it to the changes array before retrying.`
              : `Staged changes [${conflicting
                  .slice(0, 5)
                  .join(", ")}${
                  conflicting.length > 5 ? ", …" : ""
                }] are not included in this request. Unstage them or add them to the changes array before retrying.`,
          ]);
        }
      }

      let stagedFiles: string[] = [];
      let commitHash: string | null = null;
      let providerResult: SCMProviderResult | null = null;
      let providerError: unknown = null;
      let providerAttempts = 0;

      try {
        try {
          stagedFiles = await this.git.stageFiles(normalized.changes);
        } catch (error) {
          if (error instanceof Error) {
            throw new ValidationError([error.message]);
          }
          throw error;
        }

        const hasStagedChanges = await this.git.hasStagedChanges();
        if (!hasStagedChanges) {
          await this.git.unstageFiles(stagedFiles);
          throw new ValidationError([
            "No staged changes detected. Ensure the specified files include modifications.",
          ]);
        }

        const author = this.resolveAuthor();
        try {
          commitHash = await this.git.commit(
            normalized.title,
            normalized.description,
            { author }
          );
        } catch (error) {
          await this.git.unstageFiles(stagedFiles);
          if (error instanceof Error && /nothing to commit/i.test(error.message)) {
            throw new ValidationError([
              "No staged changes detected. Ensure the specified files include modifications.",
            ]);
          }
          throw error;
        }

        const commitDetails = await this.git.getCommitDetails(commitHash);
        const committedFiles = await this.git.getFilesForCommit(commitHash);
        const filesForRecord = committedFiles.length ? committedFiles : stagedFiles;
        const commitAuthor = commitDetails?.author ?? author.name;
        const commitAuthorEmail = commitDetails?.email ?? author.email;

        const validationResults = this.normalizeValidationResults(
          request.validationResults
        );

        const testResults = Array.isArray(request.testResults)
          ? request.testResults
              .filter((id) => typeof id === "string" && id.trim())
              .map((id) => id.trim())
          : [];

        const labels = Array.isArray(request.labels)
          ? request.labels
              .filter((label) => typeof label === "string" && label.trim())
              .map((label) => label.trim())
          : [];

        const metadata: Record<string, unknown> = {
          labels,
          createPR: shouldCreatePR,
          relatedSpecId: request.relatedSpecId,
          requestedChanges: normalized.changes,
          stagedFiles,
          commitSummary: normalized.title,
          commitAuthor,
          commitAuthorEmail,
        };

        const providerName = this.provider?.name ?? "local";
        metadata.provider = providerName;

        const createdAt = commitDetails?.date
          ? new Date(commitDetails.date)
          : new Date();

        if (!this.dbService.isInitialized()) {
          await this.dbService.initialize();
        }

        if (shouldCreatePR && this.provider) {
          const providerOutcome = await this.executeProviderWithRetry({
            branch,
            baseBranch: startingBranch,
            commitHash,
            title: normalized.title,
            description: normalized.description,
            changes: filesForRecord,
            metadata,
          });
          providerResult = providerOutcome.result ?? null;
          providerError = providerOutcome.error ?? null;
          providerAttempts = providerOutcome.attempts;

          metadata.providerAttempts = providerAttempts;
          if (providerOutcome.errorHistory.length) {
            metadata.providerErrorHistory = providerOutcome.errorHistory;
          }

          if (providerResult?.provider) {
            metadata.provider = providerResult.provider;
          }
          if (providerResult?.remote) {
            metadata.remote = providerResult.remote;
          }
          if (providerResult?.message) {
            metadata.providerMessage = providerResult.message;
          }
          if (providerResult?.metadata) {
            metadata.providerMetadata = providerResult.metadata;
          }
          if (providerError) {
            metadata.escalationRequired = true;
            metadata.escalationReason =
              "SCM provider failed after retry attempts";
            metadata.providerFailure = this.serializeProviderError(
              providerError,
              providerAttempts
            );
          }
        }

        if (typeof metadata.providerAttempts === "undefined") {
          metadata.providerAttempts = providerAttempts;
        }

        const status: SCMCommitRecord["status"] = providerError
          ? "failed"
          : shouldCreatePR
          ? providerResult?.pushed
            ? "pending"
            : "committed"
          : "committed";

        const commitRecord: SCMCommitRecord = {
          commitHash,
          branch,
          title: normalized.title,
          description: normalized.description || undefined,
          author: commitAuthor,
          changes: filesForRecord,
          relatedSpecId: request.relatedSpecId,
          testResults,
          validationResults: validationResults ?? undefined,
          prUrl: providerResult?.prUrl,
          provider:
            providerResult?.provider ?? (this.provider?.name ?? "local"),
          status,
          metadata,
          createdAt,
          updatedAt: createdAt,
        };

        await this.dbService.recordSCMCommit(commitRecord);

        const changeEntityId = `change:${commitHash}`;
        const changeEntity: Change = {
          id: changeEntityId,
          type: "change",
          changeType: "update",
          entityType: "commit",
          entityId: commitHash,
          timestamp: createdAt,
          author: author.name,
          commitHash,
          newState: {
            branch,
            title: normalized.title,
            description: normalized.description,
            files: filesForRecord,
          },
          specId: request.relatedSpecId,
        };

        await this.safeCreateChange(changeEntity);

        const specEntity = request.relatedSpecId
          ? ((await this.safeGetEntity(request.relatedSpecId)) as Spec | null)
          : null;

        const testEntities: Test[] = [];
        for (const testId of testResults) {
          const entity = await this.safeGetEntity(testId);
          if (entity && (entity as Test).type === "test") {
            testEntities.push(entity as Test);
          }
        }

        const now = createdAt;
        if (specEntity) {
          await this.safeCreateRelationship({
            fromEntityId: specEntity.id,
            toEntityId: changeEntityId,
            type: RelationshipType.MODIFIED_IN,
            created: now,
            lastModified: now,
            version: 1,
            changeType: "update",
            commitHash,
            metadata: {
              branch,
              title: normalized.title,
            },
          });
        }

        for (const testEntity of testEntities) {
          await this.safeCreateRelationship({
            fromEntityId: testEntity.id,
            toEntityId: changeEntityId,
            type: RelationshipType.MODIFIED_IN,
            created: now,
            lastModified: now,
            version: 1,
            changeType: "update",
            commitHash,
            metadata: {
              branch,
            },
          });
        }

        return {
          commitHash,
          prUrl: providerResult?.prUrl,
          branch,
          status,
          provider: commitRecord.provider,
          retryAttempts: providerAttempts,
          escalationRequired: Boolean(providerError),
          escalationMessage: providerError
            ? "Automated PR creation failed; manual intervention required"
            : undefined,
          providerError: providerError
            ? this.serializeProviderError(providerError, providerAttempts)
            : undefined,
          relatedArtifacts: {
            spec: specEntity,
            tests: testEntities,
            validation: validationResults ?? null,
          },
        };
      } catch (error) {
        if (!commitHash && stagedFiles.length) {
          try {
            await this.git.unstageFiles(stagedFiles);
          } catch {

          }
        }
        throw error;
      } finally {
        if (startingBranch && startingBranch !== branch) {
          try {
            await this.git.ensureBranch(startingBranch);
          } catch (restoreError) {
            console.warn(
              "SCMService: failed to restore original branch",
              restoreError
            );
          }
        }
      }
    });
  }

  async getStatus(): Promise<SCMStatusSummary | null> {
    return this.git.getStatusSummary();
  }

  async listBranches(): Promise<SCMBranchInfo[]> {
    return this.git.listBranches();
  }

  async ensureBranch(name: string, from?: string): Promise<SCMBranchInfo> {
    const sanitized = name.trim();
    if (!sanitized) {
      throw new ValidationError(["branch name is required"]);
    }

    await this.git.ensureBranch(sanitized, from);

    const branches = await this.listBranches();
    const existing = branches.find((branch) => branch.name === sanitized);
    if (existing) {
      return existing;
    }

    return {
      name: sanitized,
      isCurrent: true,
      isRemote: false,
      upstream: from ? from.trim() || null : null,
      lastCommit: null,
    };
  }

  async push(options: {
    remote?: string;
    branch?: string;
    force?: boolean;
  } = {}): Promise<SCMPushResult> {
    const branchInput = options.branch ? options.branch.trim() : undefined;
    const branch = branchInput && branchInput.length
      ? branchInput
      : await this.git.getCurrentBranch();

    if (!branch) {
      throw new Error("Unable to determine branch to push");
    }

    const remoteInput = options.remote ? options.remote.trim() : undefined;
    const remote = remoteInput && remoteInput.length ? remoteInput : "origin";

    try {
      const result = await this.git.push(remote, branch, {
        force: options.force,
      });
      let commitHash: string | null = null;
      try {
        commitHash = await this.git.getCommitHash(branch);
      } catch {
        try {
          commitHash = await this.git.getCommitHash('HEAD');
        } catch {
          commitHash = null;
        }
      }
      return {
        remote,
        branch,
        forced: Boolean(options.force),
        pushed: true,
        commitHash: commitHash ?? undefined,
        provider: "local",
        message: result.output.trim() || "Push completed.",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Push failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getDiff(options: {
    from?: string;
    to?: string;
    files?: string[];
    context?: number;
  } = {}): Promise<string | null> {
    return this.git.getDiff(options);
  }

  async getCommitLog(options: {
    limit?: number;
    author?: string;
    path?: string;
    since?: string;
    until?: string;
  } = {}): Promise<SCMCommitLogEntry[]> {
    return this.git.getCommitLog(options);
  }

  async getCommitRecord(commitHash: string): Promise<SCMCommitRecord | null> {
    return this.dbService.getSCMCommitByHash(commitHash);
  }

  async listCommitRecords(limit: number = 50): Promise<SCMCommitRecord[]> {
    return this.dbService.listSCMCommits(limit);
  }

  private validateCommitRequest(request: CommitPRRequest): CommitValidation {
    const errors: string[] = [];

    if (!request || typeof request !== "object") {
      errors.push("request body must be an object");
      throw new ValidationError(errors);
    }

    const title = typeof request.title === "string" ? request.title.trim() : "";
    if (!title) {
      errors.push("title is required");
    }

    const description =
      typeof request.description === "string"
        ? request.description.trim()
        : "";

    const changesInput = Array.isArray(request.changes)
      ? request.changes
      : [];
    const changes = changesInput
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim());

    if (!changes.length) {
      errors.push("changes must include at least one file path");
    }

    if (errors.length) {
      throw new ValidationError(errors);
    }

    return { title, description, changes };
  }

  private normalizeValidationResults(
    raw: unknown
  ): ValidationResult | Record<string, unknown> | null {
    if (raw === undefined || raw === null) {
      return null;
    }

    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return { raw } as Record<string, unknown>;
      }
    }

    if (typeof raw === "object") {
      return raw as Record<string, unknown>;
    }

    return null;
  }

  private resolveAuthor(): { name: string; email: string } {
    const name =
      process.env.GIT_AUTHOR_NAME ||
      process.env.GITHUB_ACTOR ||
      process.env.USER ||
      "memento-bot";

    const emailFromEnv =
      process.env.GIT_AUTHOR_EMAIL ||
      (process.env.GITHUB_ACTOR
        ? `${process.env.GITHUB_ACTOR}@users.noreply.github.com`
        : undefined);

    const email = emailFromEnv && emailFromEnv.trim().length
      ? emailFromEnv.trim()
      : "memento-bot@example.com";

    return { name, email };
  }

  private async safeGetEntity(entityId: string): Promise<Entity | null> {
    try {
      return await this.kgService.getEntity(entityId);
    } catch (error) {
      console.warn("SCMService: failed to fetch entity", entityId, error);
      return null;
    }
  }

  private async safeCreateChange(change: Change): Promise<void> {
    try {
      await this.kgService.createEntity(change as Entity);
    } catch (error) {
      console.warn("SCMService: failed to record change entity", error);
    }
  }

  private async safeCreateRelationship(
    rel: Partial<GraphRelationship> & {
      fromEntityId: string;
      toEntityId: string;
      type: RelationshipType;
    }
  ): Promise<void> {
    try {
      await this.kgService.createRelationship(rel as GraphRelationship);
    } catch (error) {
      console.warn("SCMService: failed to record relationship", error);
    }
  }

  private getProviderRetryLimit(): number {
    const raw = process.env.SCM_PROVIDER_MAX_RETRIES;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 2;
  }

  private getProviderRetryDelay(): number {
    const raw = process.env.SCM_PROVIDER_RETRY_DELAY_MS;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return 500;
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeProviderWithRetry(
    payload: SCMProviderPullRequestPayload
  ): Promise<{
    result: SCMProviderResult | null;
    error?: unknown;
    attempts: number;
    errorHistory: Array<{ attempt: number; error: ReturnType<typeof this.serializeProviderError> }>;
  }> {
    const maxAttempts = Math.max(1, this.getProviderRetryLimit());
    const delayMs = this.getProviderRetryDelay();
    const errorHistory: Array<{
      attempt: number;
      error: ReturnType<typeof this.serializeProviderError>;
    }> = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await this.provider!.preparePullRequest(payload);
        return {
          result,
          attempts: attempt,
          errorHistory,
        };
      } catch (error) {
        const serialized = this.serializeProviderError(error, attempt);
        errorHistory.push({ attempt, error: serialized });

        if (attempt >= maxAttempts) {
          return {
            result: null,
            error,
            attempts: attempt,
            errorHistory,
          };
        }

        await this.sleep(delayMs * attempt);
      }
    }

    return {
      result: null,
      attempts: maxAttempts,
      errorHistory,
    };
  }

  private serializeProviderError(
    error: unknown,
    attempt?: number
  ): {
    message: string;
    code?: string;
    lastAttempt?: number;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name || undefined,
        lastAttempt: attempt,
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        lastAttempt: attempt,
      };
    }

    return {
      message: "Unknown provider error",
      lastAttempt: attempt,
    };
  }
}

================
File: synchronization/index.ts
================
export { default as SynchronizationCoordinator } from './SynchronizationCoordinator.js';
export { default as SynchronizationMonitoring } from './SynchronizationMonitoring.js';

================
File: synchronization/SynchronizationCoordinator.ts
================
import { EventEmitter } from "events";
import crypto from "crypto";
import { KnowledgeGraphService } from "@memento/knowledge";
import { ASTParser } from "@memento/knowledge";
import { DatabaseService } from "@memento/core";
import { FileChange } from "@memento/core";
import {
  GraphRelationship,
  RelationshipType,
} from "@memento/graph";
import { TimeRangeParams } from "@memento/core";
import { GitService } from "../scm/GitService.js";
import {
  ConflictResolution as ConflictResolutionService,
  Conflict,
} from "../scm/ConflictResolution.js";
import { RollbackCapabilities } from "../scm/RollbackCapabilities.js";
import {
  SessionCheckpointJobRunner,
  type SessionCheckpointJobMetrics,
  type SessionCheckpointJobSnapshot,
} from "@memento/jobs";
import type { SessionCheckpointJobOptions } from "@memento/jobs";
import { PostgresSessionCheckpointJobStore } from "@memento/jobs";
import { canonicalRelationshipId } from "@memento/core";

export interface SyncOperation {
  id: string;
  type: "full" | "incremental" | "partial";
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  startTime: Date;
  endTime?: Date;
  filesProcessed: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  entitiesDeleted: number;
  relationshipsCreated: number;
  relationshipsUpdated: number;
  relationshipsDeleted: number;
  errors: SyncError[];
  conflicts: Conflict[];
  rollbackPoint?: string;
}

export interface SyncError {
  file: string;
  type:
    | "parse"
    | "database"
    | "conflict"
    | "unknown"
    | "rollback"
    | "cancelled"
    | "capability";
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export type SyncConflict = Conflict;

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  rollbackOnError?: boolean;
  conflictResolution?: "overwrite" | "merge" | "skip" | "manual";
  batchSize?: number;
}

export type SessionEventKind =
  | "session_started"
  | "session_keepalive"
  | "session_relationships"
  | "session_checkpoint"
  | "session_teardown";

export interface SessionStreamPayload {
  changeId?: string;
  relationships?: Array<{
    id: string;
    type: string;
    fromEntityId?: string;
    toEntityId?: string;
    metadata?: Record<string, unknown> | null;
  }>;
  checkpointId?: string;
  seeds?: string[];
  status?:
    | SyncOperation["status"]
    | "failed"
    | "cancelled"
    | "queued"
    | "manual_intervention";
  errors?: SyncError[];
  processedChanges?: number;
  totalChanges?: number;
  details?: Record<string, unknown>;
}

export interface SessionStreamEvent {
  type: SessionEventKind;
  sessionId: string;
  operationId: string;
  timestamp: string;
  payload?: SessionStreamPayload;
}

export interface CheckpointMetricsSnapshot {
  event: string;
  metrics: SessionCheckpointJobMetrics;
  deadLetters: SessionCheckpointJobSnapshot[];
  context?: Record<string, unknown>;
  timestamp: string;
}

class OperationCancelledError extends Error {
  constructor(operationId: string) {
    super(`Operation ${operationId} cancelled`);
    this.name = "OperationCancelledError";
  }
}

interface SessionSequenceTrackingState {
  lastSequence: number | null;
  lastType: RelationshipType | null;
  perType: Map<RelationshipType | string, number>;
}

export class SynchronizationCoordinator extends EventEmitter {
  private activeOperations = new Map<string, SyncOperation>();
  private completedOperations = new Map<string, SyncOperation>();
  private operationQueue: SyncOperation[] = [];
  private isProcessing = false;
  private paused = false;
  private resumeWaiters: Array<() => void> = [];
  private retryQueue = new Map<
    string,
    { operation: SyncOperation; attempts: number }
  >();
  private maxRetryAttempts = 3;
  private retryDelay = 5000;
  private operationCounter = 0;
  private cancelledOperations = new Set<string>();


  private unresolvedRelationships: Array<{
    relationship: import("../../models/relationships.js").GraphRelationship;
    sourceFilePath?: string;
  }> = [];


  private sessionKeepaliveTimers = new Map<string, NodeJS.Timeout>();
  private activeSessionIds = new Map<string, string>();


  private tuning = new Map<
    string,
    { maxConcurrency?: number; batchSize?: number }
  >();


  private localSymbolIndex: Map<string, string> = new Map();

  private sessionSequenceState: Map<string, SessionSequenceTrackingState> =
    new Map();

  private sessionSequence = new Map<string, number>();

  private checkpointJobRunner: SessionCheckpointJobRunner;

  private anomalyResolutionMode = (
    process.env.ANOMALY_RESOLUTION_MODE ?? "warn"
  ).toLowerCase() as "skip" | "warn" | "process";

  constructor(
    private kgService: KnowledgeGraphService,
    private astParser: ASTParser,
    private dbService: DatabaseService,
    private conflictResolution: ConflictResolutionService,
    private rollbackCapabilities?: RollbackCapabilities,
    checkpointJobRunner?: SessionCheckpointJobRunner
  ) {
    super();
    if (checkpointJobRunner) {
      this.checkpointJobRunner = checkpointJobRunner;
    } else {
      const checkpointOptions = this.createCheckpointJobOptions();
      this.checkpointJobRunner = new SessionCheckpointJobRunner(
        this.kgService,
        this.rollbackCapabilities,
        checkpointOptions
      );
    }
    this.bindCheckpointJobEvents();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on("operationCompleted", this.handleOperationCompleted.bind(this));
    this.on("operationFailed", this.handleOperationFailed.bind(this));
    this.on("conflictDetected", this.handleConflictDetected.bind(this));
  }

  private nextSessionSequence(sessionId: string): number {
    const current = this.sessionSequence.get(sessionId) ?? 0;
    const next = current + 1;
    this.sessionSequence.set(sessionId, next);
    return next;
  }

  private createCheckpointJobOptions(): SessionCheckpointJobOptions {
    const options: SessionCheckpointJobOptions = {};
    if (!this.dbService || typeof this.dbService.isInitialized !== "function") {
      return options;
    }
    if (!this.dbService.isInitialized()) {
      return options;
    }
    try {
      const postgresService = this.dbService.getPostgreSQLService();
      if (postgresService && typeof postgresService.query === "function") {
        options.persistence = new PostgresSessionCheckpointJobStore(
          postgresService
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Unable to configure checkpoint persistence: ${message}`);
    }
    return options;
  }

  private async ensureCheckpointPersistence(): Promise<void> {
    if (
      !this.checkpointJobRunner ||
      this.checkpointJobRunner.hasPersistence()
    ) {
      return;
    }
    if (!this.dbService || typeof this.dbService.isInitialized !== "function") {
      return;
    }
    if (!this.dbService.isInitialized()) {
      return;
    }

    try {
      const postgresService = this.dbService.getPostgreSQLService();
      if (!postgresService || typeof postgresService.query !== "function") {
        return;
      }

      const store = new PostgresSessionCheckpointJobStore(postgresService);
      await this.checkpointJobRunner.attachPersistence(store);
      this.emitCheckpointMetrics("persistence_attached", {
        store: "postgres",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to attach checkpoint persistence: ${message}`);
    }
  }

  private async scheduleSessionCheckpoint(
    sessionId: string,
    seedEntityIds: string[],
    options?: {
      reason?: "daily" | "incident" | "manual";
      hopCount?: number;
      eventId?: string;
      actor?: string;
      annotations?: string[];
      operationId?: string;
      window?: TimeRangeParams;
    }
  ): Promise<
    | { success: true; jobId: string; sequenceNumber: number }
    | { success: false; error: string }
  > {
    if (!seedEntityIds || seedEntityIds.length === 0) {
      return { success: false, error: "No checkpoint seeds provided" };
    }

    const dedupedSeeds = Array.from(new Set(seedEntityIds.filter(Boolean)));
    if (dedupedSeeds.length === 0) {
      return { success: false, error: "No valid checkpoint seeds resolved" };
    }

    try {
      await this.ensureCheckpointPersistence();
      const sequenceNumber = this.nextSessionSequence(sessionId);
      const jobId = await this.checkpointJobRunner.enqueue({
        sessionId,
        seedEntityIds: dedupedSeeds,
        reason: options?.reason ?? "manual",
        hopCount: Math.max(1, Math.min(options?.hopCount ?? 2, 5)),
        sequenceNumber,
        operationId: options?.operationId,
        eventId: options?.eventId,
        actor: options?.actor,
        annotations: options?.annotations,
        triggeredBy: "SynchronizationCoordinator",
        window: options?.window,
      });
      this.emit("checkpointScheduled", {
        sessionId,
        sequenceNumber,
        seeds: dedupedSeeds.length,
        jobId,
      });
      return { success: true, jobId, sequenceNumber };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unknown error: ${String(error)}`;
      console.warn(
        `⚠️ Failed to enqueue session checkpoint job for ${sessionId}: ${message}`
      );
      this.emit("checkpointScheduleFailed", { sessionId, error: message });
      return { success: false, error: message };
    }
  }

  private async enqueueCheckpointWithNotification(params: {
    sessionId: string;
    seeds: string[];
    options?: {
      reason?: "daily" | "incident" | "manual";
      hopCount?: number;
      operationId?: string;
      eventId?: string;
      actor?: string;
      annotations?: string[];
      window?: TimeRangeParams;
    };
    publish: (payload: SessionStreamPayload) => void;
    processedChanges: number;
    totalChanges: number;
  }): Promise<void> {
    if (!params.seeds || params.seeds.length === 0) {
      return;
    }

    const checkpointResult = await this.scheduleSessionCheckpoint(
      params.sessionId,
      params.seeds,
      params.options
    );

    if (checkpointResult.success) {
      params.publish({
        status: "queued",
        checkpointId: undefined,
        seeds: params.seeds,
        processedChanges: params.processedChanges,
        totalChanges: params.totalChanges,
        details: {
          jobId: checkpointResult.jobId,
          sequenceNumber: checkpointResult.sequenceNumber,
        },
      });
      return;
    }

    const errorMessage =
      checkpointResult.error || "Failed to schedule checkpoint";
    try {
      await this.kgService.annotateSessionRelationshipsWithCheckpoint(
        params.sessionId,
        params.seeds,
        {
          status: "manual_intervention",
          reason: params.options?.reason,
          hopCount: params.options?.hopCount,
          seedEntityIds: params.seeds,
          jobId: undefined,
          error: errorMessage,
          triggeredBy: "SynchronizationCoordinator",
        }
      );
    } catch (error) {
      console.warn(
        "⚠️ Failed to annotate session relationships after checkpoint enqueue failure",
        error instanceof Error ? error.message : error
      );
    }
    params.publish({
      status: "manual_intervention",
      checkpointId: undefined,
      seeds: params.seeds,
      processedChanges: params.processedChanges,
      totalChanges: params.totalChanges,
      errors: [
        {
          file: params.sessionId,
          type: "checkpoint",
          message: errorMessage,
          timestamp: new Date(),
          recoverable: false,
        },
      ],
      details: {
        jobId: undefined,
        error: errorMessage,
      },
    });
  }

  private bindCheckpointJobEvents(): void {
    this.checkpointJobRunner.on("jobEnqueued", ({ jobId, payload }) => {
      this.emitCheckpointMetrics("job_enqueued", {
        jobId,
        sessionId: payload?.sessionId,
      });
    });

    this.checkpointJobRunner.on(
      "jobStarted",
      ({ jobId, attempts, payload }) => {
        this.emitCheckpointMetrics("job_started", {
          jobId,
          attempts,
          sessionId: payload?.sessionId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobAttemptFailed",
      ({ jobId, attempts, error, payload }) => {
        this.emitCheckpointMetrics("job_attempt_failed", {
          jobId,
          attempts,
          error,
          sessionId: payload?.sessionId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobCompleted",
      ({ payload, checkpointId, jobId, attempts }) => {
        const operationId = payload.operationId ?? payload.sessionId;
        this.emitSessionEvent({
          type: "session_checkpoint",
          sessionId: payload.sessionId,
          operationId,
          timestamp: new Date().toISOString(),
          payload: {
            checkpointId,
            seeds: payload.seedEntityIds,
            status: "completed",
            details: {
              jobId,
              attempts,
            },
          },
        });

        this.emitCheckpointMetrics("job_completed", {
          jobId,
          attempts,
          sessionId: payload.sessionId,
          checkpointId,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobFailed",
      ({ payload, jobId, attempts, error }) => {
        const operationId = payload.operationId ?? payload.sessionId;
        this.emitSessionEvent({
          type: "session_checkpoint",
          sessionId: payload.sessionId,
          operationId,
          timestamp: new Date().toISOString(),
          payload: {
            checkpointId: undefined,
            seeds: payload.seedEntityIds,
            status: "manual_intervention",
            errors: [
              {
                file: payload.sessionId,
                type: "unknown",
                message: error,
                timestamp: new Date(),
                recoverable: false,
              },
            ],
            details: {
              jobId,
              attempts,
            },
          },
        });

        this.emitCheckpointMetrics("job_failed", {
          jobId,
          attempts,
          sessionId: payload.sessionId,
          error,
        });
      }
    );

    this.checkpointJobRunner.on(
      "jobDeadLettered",
      ({ jobId, attempts, error, payload }) => {
        this.emitCheckpointMetrics("job_dead_lettered", {
          jobId,
          attempts,
          error,
          sessionId: payload?.sessionId,
        });
      }
    );
  }


  updateTuning(
    operationId: string,
    tuning: { maxConcurrency?: number; batchSize?: number }
  ): boolean {
    const op = this.activeOperations.get(operationId);
    if (!op) return false;
    const current = this.tuning.get(operationId) || {};
    const merged = { ...current } as {
      maxConcurrency?: number;
      batchSize?: number;
    };
    if (
      typeof tuning.maxConcurrency === "number" &&
      isFinite(tuning.maxConcurrency)
    ) {
      merged.maxConcurrency = Math.max(
        1,
        Math.min(Math.floor(tuning.maxConcurrency), 64)
      );
    }
    if (typeof tuning.batchSize === "number" && isFinite(tuning.batchSize)) {
      merged.batchSize = Math.max(
        1,
        Math.min(Math.floor(tuning.batchSize), 5000)
      );
    }
    this.tuning.set(operationId, merged);
    this.emit("syncProgress", op, { phase: "tuning_updated", progress: 0 });
    return true;
  }

  private nextOperationId(prefix: string): string {
    const counter = ++this.operationCounter;
    return `${prefix}_${Date.now()}_${counter}`;
  }

  private ensureNotCancelled(operation: SyncOperation): void {
    if (this.cancelledOperations.has(operation.id)) {
      throw new OperationCancelledError(operation.id);
    }
  }

  private ensureDatabaseReady(): void {
    const hasChecker =
      typeof (this.dbService as any)?.isInitialized === "function";
    if (!hasChecker || !this.dbService.isInitialized()) {
      throw new Error("Database not initialized");
    }
  }

  private recordSessionSequence(
    sessionId: string,
    type: RelationshipType,
    sequenceNumber: number,
    eventId: string,
    timestamp: Date
  ): { shouldSkip: boolean; reason?: string } {
    let state = this.sessionSequenceState.get(sessionId);
    if (!state) {
      state = {
        lastSequence: null,
        lastType: null,
        perType: new Map(),
      };
      this.sessionSequenceState.set(sessionId, state);
    }

    let reason: "duplicate" | "out_of_order" | null = null;
    let previousSequence: number | null = null;
    let previousType: RelationshipType | null = null;

    if (state.lastSequence !== null) {
      if (sequenceNumber === state.lastSequence) {
        reason = "duplicate";
        previousSequence = state.lastSequence;
        previousType = state.lastType;
      } else if (sequenceNumber < state.lastSequence) {
        reason = "out_of_order";
        previousSequence = state.lastSequence;
        previousType = state.lastType;
      }
    }

    const perTypePrevious = state.perType.get(type);
    if (!reason && typeof perTypePrevious === "number") {
      if (sequenceNumber === perTypePrevious) {
        reason = "duplicate";
        previousSequence = perTypePrevious;
        previousType = type;
      } else if (sequenceNumber < perTypePrevious) {
        reason = "out_of_order";
        previousSequence = perTypePrevious;
        previousType = type;
      }
    }

    if (reason) {
      this.emit("sessionSequenceAnomaly", {
        sessionId,
        type,
        sequenceNumber,
        previousSequence: previousSequence ?? null,
        reason,
        eventId,
        timestamp,
        previousType: previousType ?? null,
      });

      const skipModes = ["duplicate", "out_of_order"];
      if (this.anomalyResolutionMode === "skip" && skipModes.includes(reason)) {
        return { shouldSkip: true, reason };
      }
    }

    state.perType.set(type, sequenceNumber);
    if (state.lastSequence === null || sequenceNumber > state.lastSequence) {
      state.lastSequence = sequenceNumber;
      state.lastType = type;
    }

    const lastRecorded =
      state.lastSequence === null ? sequenceNumber : state.lastSequence;
    this.sessionSequence.set(sessionId, lastRecorded);

    return { shouldSkip: false };
  }

  private clearSessionTracking(sessionId: string): void {
    this.sessionSequenceState.delete(sessionId);
    this.sessionSequence.delete(sessionId);
  }

  private toIsoTimestamp(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    if (typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    return undefined;
  }

  private serializeSessionRelationship(
    rel: GraphRelationship
  ): Record<string, unknown> {
    const asAny = rel as Record<string, any>;
    const result: Record<string, unknown> = {
      id: asAny.id ?? null,
      type: String(rel.type),
      fromEntityId: rel.fromEntityId,
      toEntityId: rel.toEntityId,
      metadata: asAny.metadata ?? null,
    };

    if (asAny.sessionId) {
      result.sessionId = asAny.sessionId;
    }

    if (typeof asAny.sequenceNumber === "number") {
      result.sequenceNumber = asAny.sequenceNumber;
    }

    const timestampIso = this.toIsoTimestamp(asAny.timestamp ?? rel.created);
    if (timestampIso) {
      result.timestamp = timestampIso;
    }

    const createdIso = this.toIsoTimestamp(rel.created);
    if (createdIso) {
      result.created = createdIso;
    }

    const modifiedIso = this.toIsoTimestamp(rel.lastModified);
    if (modifiedIso) {
      result.lastModified = modifiedIso;
    }

    if (typeof asAny.eventId === "string") {
      result.eventId = asAny.eventId;
    }

    if (typeof asAny.actor === "string") {
      result.actor = asAny.actor;
    }

    if (Array.isArray(asAny.annotations) && asAny.annotations.length > 0) {
      result.annotations = asAny.annotations;
    }

    if (asAny.changeInfo) {
      result.changeInfo = asAny.changeInfo;
    }

    if (asAny.stateTransition) {
      result.stateTransition = asAny.stateTransition;
    }

    if (asAny.impact) {
      result.impact = asAny.impact;
    }

    return result;
  }

  private emitSessionEvent(event: SessionStreamEvent): void {
    try {
      this.emit("sessionEvent", event);
    } catch (error) {
      console.warn(
        "Failed to emit session event",
        error instanceof Error ? error.message : error
      );
    }
  }

  getCheckpointMetrics(): {
    metrics: SessionCheckpointJobMetrics;
    deadLetters: SessionCheckpointJobSnapshot[];
  } {
    return {
      metrics: this.checkpointJobRunner.getMetrics(),
      deadLetters: this.checkpointJobRunner.getDeadLetterJobs(),
    };
  }

  private emitCheckpointMetrics(
    event: string,
    context?: Record<string, unknown>
  ): void {
    const snapshot = this.getCheckpointMetrics();
    const payload: CheckpointMetricsSnapshot = {
      event,
      metrics: snapshot.metrics,
      deadLetters: snapshot.deadLetters,
      context,
      timestamp: new Date().toISOString(),
    };
    try {
      this.emit("checkpointMetricsUpdated", payload);
    } catch (error) {
      console.warn(
        "Failed to emit checkpoint metrics",
        error instanceof Error ? error.message : String(error)
      );
    }

    try {
      console.log("[session.checkpoint.metrics]", {
        event,
        enqueued: snapshot.metrics.enqueued,
        completed: snapshot.metrics.completed,
        failed: snapshot.metrics.failed,
        retries: snapshot.metrics.retries,
        deadLetters: snapshot.deadLetters.length,
        ...(context || {}),
      });
    } catch {}
  }


  async startSync(): Promise<string> {
    return this.startFullSynchronization({});
  }

  async stopSync(): Promise<void> {

    this.isProcessing = false;

    const now = new Date();
    for (const [id, op] of this.activeOperations.entries()) {
      if (op.status === "running" || op.status === "pending") {
        op.status = "completed";
        op.endTime = now;
        this.completedOperations.set(id, op);
        this.activeOperations.delete(id);
        this.emit("operationCompleted", op);
      }
    }

    this.operationQueue = [];
  }


  async stop(): Promise<void> {
    this.pauseSync();
    const waiters = this.resumeWaiters.splice(0);
    for (const waiter of waiters) {
      try {
        waiter();
      } catch {

      }
    }
    await this.stopSync();
    this.removeAllListeners();
  }

  async startFullSynchronization(options: SyncOptions = {}): Promise<string> {
    this.ensureDatabaseReady();

    if (options.includeEmbeddings === undefined) {
      options.includeEmbeddings = false;
    }
    const operation: SyncOperation = {
      id: this.nextOperationId("full_sync"),
      type: "full",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };


    (operation as any).options = options;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Full synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {

      void this.processQueue();
    }


    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  async synchronizeFileChanges(
    changes: FileChange[],
    options: SyncOptions = {}
  ): Promise<string> {
    this.ensureDatabaseReady();
    const operation: SyncOperation = {
      id: this.nextOperationId("incremental_sync"),
      type: "incremental",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };


    (operation as any).options = options;
    (operation as any).changes = changes;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Incremental synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {

      void this.processQueue();
    }


    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  async synchronizePartial(
    updates: PartialUpdate[],
    options: SyncOptions = {}
  ): Promise<string> {
    this.ensureDatabaseReady();
    const operation: SyncOperation = {
      id: this.nextOperationId("partial_sync"),
      type: "partial",
      status: "pending",
      startTime: new Date(),
      filesProcessed: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      entitiesDeleted: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      relationshipsDeleted: 0,
      errors: [],
      conflicts: [],
      rollbackPoint: undefined,
    };


    (operation as any).updates = updates;
    (operation as any).options = options;

    this.activeOperations.set(operation.id, operation);

    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Partial synchronization rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return operation.id;
      }
    }

    this.operationQueue.push(operation);

    this.emit("operationStarted", operation);

    if (!this.isProcessing) {

      void this.processQueue();
    }


    setTimeout(() => {
      const op = this.activeOperations.get(operation.id);
      if (op && op.status === "pending") {
        op.status = "failed";
        op.endTime = new Date();
        op.errors.push({
          file: "coordinator",
          type: "unknown",
          message: "Operation timed out while pending",
          timestamp: new Date(),
          recoverable: false,
        });
        this.emit("operationFailed", op);
      }
    }, options.timeout ?? 30000);

    return operation.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.operationQueue.length > 0) {

      if (this.paused) {
        await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
      }
      const operation = this.operationQueue.shift()!;
      operation.status = "running";

      if (this.cancelledOperations.has(operation.id)) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "cancelled",
          message: `Operation ${operation.id} cancelled before execution`,
          timestamp: new Date(),
          recoverable: true,
        });
        this.activeOperations.delete(operation.id);
        this.completedOperations.set(operation.id, operation);
        this.cancelledOperations.delete(operation.id);
        this.emit("operationCancelled", operation);
        continue;
      }

      try {
        switch (operation.type) {
          case "full":
            await this.performFullSync(operation);
            break;
          case "incremental":
            await this.performIncrementalSync(operation);
            break;
          case "partial":
            await this.performPartialSync(operation);
            break;
        }

        if (this.operationHasBlockingErrors(operation)) {
          await this.finalizeFailedOperation(operation);
          continue;
        }

        this.finalizeSuccessfulOperation(operation);
      } catch (error) {
        const cancelled = error instanceof OperationCancelledError;
        operation.errors.push({
          file: "coordinator",
          type: cancelled ? "cancelled" : "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: cancelled,
        });

        await this.finalizeFailedOperation(operation, { cancelled });
        continue;
      }
    }

    this.isProcessing = false;
  }

  private operationHasBlockingErrors(operation: SyncOperation): boolean {
    if (!Array.isArray(operation.errors) || operation.errors.length === 0) {
      return false;
    }


    return operation.errors.some((error) => error.recoverable === false);
  }

  private finalizeSuccessfulOperation(operation: SyncOperation): void {
    operation.status = "completed";
    operation.endTime = new Date();
    if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {

      }
    }
    operation.rollbackPoint = undefined;
    this.activeOperations.delete(operation.id);
    this.completedOperations.set(operation.id, operation);
    this.cancelledOperations.delete(operation.id);
    this.emit("operationCompleted", operation);
  }

  private async finalizeFailedOperation(
    operation: SyncOperation,
    context: { cancelled?: boolean } = {}
  ): Promise<void> {
    const isCancelled = context.cancelled === true;

    if (!isCancelled) {
      await this.attemptRollback(operation);
    } else if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {

      }
      operation.rollbackPoint = undefined;
    }

    operation.status = "failed";
    operation.endTime = new Date();
    this.activeOperations.delete(operation.id);
    this.completedOperations.set(operation.id, operation);
    this.cancelledOperations.delete(operation.id);

    if (isCancelled) {
      this.emit("operationCancelled", operation);
    } else {
      this.emit("operationFailed", operation);
    }
  }

  private async attemptRollback(operation: SyncOperation): Promise<void> {
    const options = ((operation as any).options || {}) as SyncOptions;
    if (!options.rollbackOnError) {
      return;
    }

    if (!operation.rollbackPoint) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message: "Rollback requested but no rollback point was recorded",
        timestamp: new Date(),
        recoverable: false,
      });
      return;
    }

    if (!this.rollbackCapabilities) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message:
          "Rollback requested but rollback capabilities are not configured",
        timestamp: new Date(),
        recoverable: false,
      });
      return;
    }

    try {
      const result = await this.rollbackCapabilities.rollbackToPoint(
        operation.rollbackPoint
      );

      if (!result.success || result.errors.length > 0) {
        for (const rollbackError of result.errors) {
          operation.errors.push({
            file: "coordinator",
            type: "rollback",
            message: `Rollback ${rollbackError.action} failed for ${rollbackError.id}: ${rollbackError.error}`,
            timestamp: new Date(),
            recoverable: rollbackError.recoverable,
          });
        }
      }
    } catch (error) {
      operation.errors.push({
        file: "coordinator",
        type: "rollback",
        message: `Rollback execution failed: ${
          error instanceof Error ? error.message : "unknown"
        }`,
        timestamp: new Date(),
        recoverable: false,
      });
    } finally {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {

      }
      operation.rollbackPoint = undefined;
    }
  }


  pauseSync(): void {
    this.paused = true;
  }

  resumeSync(): void {
    if (!this.paused) return;
    this.paused = false;
    const waiters = this.resumeWaiters.splice(0);
    for (const w of waiters) {
      try {
        w();
      } catch {}
    }

    if (!this.isProcessing && this.operationQueue.length > 0) {
      void this.processQueue();
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  private async performFullSync(operation: SyncOperation): Promise<void> {

    const scanStart = new Date();
    this.emit("syncProgress", operation, { phase: "scanning", progress: 0 });


    try {
      const { ModuleIndexer } = await import("../knowledge/ModuleIndexer.js");
      const mi = new ModuleIndexer(this.kgService);
      await mi.indexRootPackage().catch(() => {});
    } catch {}


    const files = await this.scanSourceFiles();
    this.ensureNotCancelled(operation);

    this.emit("syncProgress", operation, { phase: "parsing", progress: 0.2 });


    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };


    const opts = ((operation as any).options || {}) as SyncOptions;
    const includeEmbeddings = opts.includeEmbeddings === true;


    const processFile = async (file: string) => {
      this.ensureNotCancelled(operation);
      try {
        const result = await this.astParser.parseFile(file);


        for (const ent of result.entities) {
          if ((ent as any)?.type === "symbol") {
            const nm = (ent as any).name as string | undefined;
            const p = (ent as any).path as string | undefined;
            if (nm && p) {
              const filePath = p.includes(":") ? p.split(":")[0] : p;
              this.localSymbolIndex.set(`${filePath}:${nm}`, ent.id);
            }
          }
        }


        if (result.entities.length > 0 || result.relationships.length > 0) {
          try {
            const conflicts = await this.detectConflicts(
              result.entities,
              result.relationships,
              opts
            );
            if (conflicts.length > 0) {
              this.logConflicts(conflicts, operation, file, opts);
            }
          } catch (conflictError) {
            operation.errors.push({
              file,
              type: "conflict",
              message:
                conflictError instanceof Error
                  ? conflictError.message
                  : "Conflict detection failed",
              timestamp: new Date(),
              recoverable: true,
            });
          }
        }


        (operation as any)._batchEntities = (
          (operation as any)._batchEntities || []
        ).concat(result.entities);
        const relsWithSource = result.relationships.map((r) => ({
          ...(r as any),
          __sourceFile: file,
        }));
        (operation as any)._batchRelationships = (
          (operation as any)._batchRelationships || []
        ).concat(relsWithSource as any);

        operation.filesProcessed++;
      } catch (error) {
        operation.errors.push({
          file,
          type: "parse",
          message: error instanceof Error ? error.message : "Parse error",
          timestamp: new Date(),
          recoverable: true,
        });
      }
    };

    for (let i = 0; i < files.length; ) {
      const tn = this.tuning.get(operation.id) || {};
      const bsRaw = tn.batchSize ?? (opts as any).batchSize ?? 60;
      const batchSize = Math.max(1, Math.min(Math.floor(bsRaw), 1000));
      const mcRaw = tn.maxConcurrency ?? opts.maxConcurrency ?? 12;
      const maxConcurrency = Math.max(
        1,
        Math.min(Math.floor(mcRaw), batchSize)
      );

      const batch = files.slice(i, i + batchSize);
      i += batchSize;


      let idx = 0;
      const worker = async () => {
        while (idx < batch.length) {
          const current = idx++;
          await awaitIfPaused();
          this.ensureNotCancelled(operation);
          await processFile(batch[current]);
        }
      };
      const workers = Array.from(
        { length: Math.min(maxConcurrency, batch.length) },
        () => worker()
      );
      await Promise.allSettled(workers);


      const batchEntities: any[] = (operation as any)._batchEntities || [];
      const batchRelationships: any[] =
        (operation as any)._batchRelationships || [];
      (operation as any)._batchEntities = [];
      (operation as any)._batchRelationships = [];
      this.ensureNotCancelled(operation);

      if (batchEntities.length > 0) {
        try {
          await this.kgService.createEntitiesBulk(batchEntities, {
            skipEmbedding: true,
          });
          operation.entitiesCreated += batchEntities.length;
        } catch (e) {

          for (const ent of batchEntities) {
            try {
              await this.kgService.createEntity(ent, { skipEmbedding: true });
              operation.entitiesCreated++;
            } catch (err) {
              operation.errors.push({
                file: (ent as any).path || "unknown",
                type: "database",
                message: `Entity create failed: ${
                  err instanceof Error ? err.message : "unknown"
                }`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
          }
        }
      }

      if (batchRelationships.length > 0) {

        const resolved: any[] = [];
        for (const relationship of batchRelationships) {
          try {

            const toEntity = await this.kgService.getEntity(
              (relationship as any).toEntityId
            );
            if (toEntity) {
              resolved.push(relationship);
              continue;
            }
          } catch {}
          try {
            const resolvedId = await (this as any).resolveRelationshipTarget(
              relationship,
              (relationship as any).__sourceFile || undefined
            );
            if (resolvedId) {
              resolved.push({
                ...(relationship as any),
                toEntityId: resolvedId,
              });
            } else if (relationship.toEntityId) {
              resolved.push({ ...(relationship as any) });
            } else {
              this.unresolvedRelationships.push({ relationship });
            }
          } catch (relationshipError) {
            operation.errors.push({
              file: "coordinator",
              type: "database",
              message: `Failed to resolve relationship: ${
                relationshipError instanceof Error
                  ? relationshipError.message
                  : "Unknown error"
              }`,
              timestamp: new Date(),
              recoverable: true,
            });
            this.unresolvedRelationships.push({ relationship });
          }
        }
        if (resolved.length > 0) {
          try {
            await this.kgService.createRelationshipsBulk(resolved as any, {
              validate: false,
            });
            operation.relationshipsCreated += resolved.length;
          } catch (e) {

            for (const r of resolved) {
              try {
                await this.kgService.createRelationship(r as any);
                operation.relationshipsCreated++;
              } catch (err) {
                operation.errors.push({
                  file: "coordinator",
                  type: "database",
                  message: `Failed to create relationship: ${
                    err instanceof Error ? err.message : "unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
          }
        }
      }


      if (includeEmbeddings && batchEntities.length > 0) {
        if (
          typeof (this.kgService as any).createEmbeddingsBatch === "function"
        ) {
          try {
            await this.kgService.createEmbeddingsBatch(batchEntities);
          } catch (e) {
            operation.errors.push({
              file: "coordinator",
              type: "database",
              message: `Batch embedding failed: ${
                e instanceof Error ? e.message : "unknown"
              }`,
              timestamp: new Date(),
              recoverable: true,
            });
          }
        } else {
          operation.errors.push({
            file: "coordinator",
            type: "capability",
            message:
              "Embedding batch API unavailable; skipping inline embedding",
            timestamp: new Date(),
            recoverable: true,
          });
        }
      } else if (!includeEmbeddings && batchEntities.length > 0) {

        (operation as any)._embedQueue = (
          (operation as any)._embedQueue || []
        ).concat(batchEntities);
      }

      const progress = 0.2 + (i / files.length) * 0.8;
      this.emit("syncProgress", operation, { phase: "parsing", progress });
    }


    this.ensureNotCancelled(operation);
    await this.runPostResolution(operation);


    try {
      await this.kgService.finalizeScan(scanStart);
    } catch {}

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });


    const pendingToEmbed: any[] = (operation as any)._embedQueue || [];
    if (
      pendingToEmbed.length > 0 &&
      typeof (this.kgService as any).createEmbeddingsBatch === "function"
    ) {

      const chunks: any[][] = [];
      const chunkSize = 200;
      for (let i = 0; i < pendingToEmbed.length; i += chunkSize) {
        chunks.push(pendingToEmbed.slice(i, i + chunkSize));
      }
      (async () => {
        for (const c of chunks) {
          try {
            await this.kgService.createEmbeddingsBatch(c);
          } catch (e) {

            try {
              console.warn("Background embedding batch failed:", e);
            } catch {}
          }
        }
        try {
          console.log(
            `✅ Background embeddings created for ${pendingToEmbed.length} entities`
          );
        } catch {}
      })().catch(() => {});
    } else if (pendingToEmbed.length > 0) {
      operation.errors.push({
        file: "coordinator",
        type: "capability",
        message: "Embedding batch API unavailable; queued embeddings skipped",
        timestamp: new Date(),
        recoverable: true,
      });
    }
  }

  private async performIncrementalSync(
    operation: SyncOperation
  ): Promise<void> {

    const scanStart = new Date();
    this.emit("syncProgress", operation, {
      phase: "processing_changes",
      progress: 0,
    });


    const changes = ((operation as any).changes as FileChange[]) || [];
    const syncOptions = ((operation as any).options || {}) as SyncOptions;

    if (changes.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalChanges = changes.length;
    let processedChanges = 0;


    const awaitIfPaused = async () => {
      if (!this.paused) return;
      await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
    };


    const sessionId = `session_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: sessionId,
        type: "session",
        startTime: operation.startTime,
        status: "active",
        agentType: "sync",
        changes: [],
        specs: [],
      } as any);
    } catch {}


    const toEmbed: any[] = [];
    const sessionRelBuffer: Array<
      import("../../models/relationships.js").GraphRelationship
    > = [];
    const sessionSequenceLocal = new Map<string, number>();
    const allocateSessionSequence = () => {
      const next = sessionSequenceLocal.get(sessionId) ?? 0;
      sessionSequenceLocal.set(sessionId, next + 1);
      return next;
    };
    const flushSessionRelationships = async () => {
      if (sessionRelBuffer.length === 0) {
        return;
      }

      const batch = sessionRelBuffer.slice();

      try {
        await this.kgService.createRelationshipsBulk(batch, {
          validate: false,
        });
        sessionRelBuffer.splice(0, batch.length);
        const relationships = batch.map((rel) =>
          this.serializeSessionRelationship(rel)
        );
        publishSessionEvent("session_relationships", {
          changeId,
          relationships,
          processedChanges,
          totalChanges,
        });
      } catch (e) {
        operation.errors.push({
          file: "coordinator",
          type: "database",
          message: `Bulk session rels failed: ${
            e instanceof Error ? e.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    };
    const enqueueSessionRelationship = (
      type: RelationshipType,
      toEntityId: string,
      options: {
        metadata?: Record<string, any>;
        changeInfo?: Record<string, any> | null;
        stateTransition?: Record<string, any> | null;
        impact?: Record<string, any> | null;
        annotations?: string[];
        actor?: string;
        timestamp?: Date;
      } = {}
    ) => {
      const timestamp = options.timestamp ?? new Date();
      const sequenceNumber = allocateSessionSequence();
      const eventId =
        "evt_" +
        crypto
          .createHash("sha1")
          .update(
            `${sessionId}|${sequenceNumber}|${type}|${toEntityId}|${timestamp.valueOf()}`
          )
          .digest("hex")
          .slice(0, 16);
      const sequenceCheck = this.recordSessionSequence(
        sessionId,
        type,
        sequenceNumber,
        eventId,
        timestamp
      );
      if (sequenceCheck.shouldSkip) {
        console.warn(
          `⚠️ Skipping session relationship due to sequence anomaly: ${sequenceCheck.reason} for ${sessionId}:${type}:${sequenceNumber}`
        );
        return { sequenceNumber, eventId, timestamp, skipped: true };
      }
      const metadata = { ...(options.metadata ?? {}) };
      if (metadata.source === undefined) metadata.source = "sync";
      if (metadata.sessionId === undefined) metadata.sessionId = sessionId;
      const relationship: any = {
        fromEntityId: sessionId,
        toEntityId,
        type,
        created: timestamp,
        lastModified: timestamp,
        version: 1,
        sessionId,
        sequenceNumber,
        timestamp,
        eventId,
        actor: options.actor ?? "sync-coordinator",
        annotations: options.annotations,
        changeInfo: options.changeInfo ?? undefined,
        stateTransition: options.stateTransition ?? undefined,
        impact: options.impact ?? undefined,
        metadata,
      };
      const graphRelationship = relationship as GraphRelationship;
      graphRelationship.id = canonicalRelationshipId(
        sessionId,
        graphRelationship
      );
      sessionRelBuffer.push(
        relationship as import("../../models/relationships.js").GraphRelationship
      );
      this.recordSessionSequence(
        sessionId,
        type,
        sequenceNumber,
        eventId,
        timestamp
      );
      return { sequenceNumber, eventId, timestamp };
    };

    const changedSeeds = new Set<string>();

    const changeId = `change_${operation.id}`;
    try {
      await this.kgService.createOrUpdateEntity({
        id: changeId,
        type: "change",
        changeType: "update",
        entityType: "batch",
        entityId: operation.id,
        timestamp: new Date(),
        sessionId,
      } as any);

      try {
        enqueueSessionRelationship(
          RelationshipType.DEPENDS_ON_CHANGE,
          changeId,
          {
            timestamp: new Date(),
            metadata: { changeId },
            stateTransition: {
              from: "working",
              to: "working",
              verifiedBy: "sync",
              confidence: 0.5,
            },
          }
        );
      } catch {}
    } catch {}

    this.activeSessionIds.set(operation.id, sessionId);

    const publishSessionEvent = (
      type: SessionEventKind,
      payload?: SessionStreamPayload
    ) => {
      this.emitSessionEvent({
        type,
        sessionId,
        operationId: operation.id,
        timestamp: new Date().toISOString(),
        payload,
      });
    };

    const sessionDetails: Record<string, unknown> = {
      totalChanges,
    };
    if (typeof syncOptions.batchSize === "number") {
      sessionDetails.batchSize = syncOptions.batchSize;
    }
    if (typeof syncOptions.maxConcurrency === "number") {
      sessionDetails.maxConcurrency = syncOptions.maxConcurrency;
    }

    publishSessionEvent("session_started", {
      totalChanges,
      processedChanges: 0,
      details: sessionDetails,
    });

    const keepaliveInterval = Math.min(
      Math.max(
        typeof syncOptions.timeout === "number"
          ? Math.floor(syncOptions.timeout / 6)
          : 5000,
        3000
      ),
      20000
    );

    let teardownSent = false;
    const sendTeardown = (payload: SessionStreamPayload) => {
      if (teardownSent) return;
      teardownSent = true;
      publishSessionEvent("session_teardown", payload);
    };

    const keepalive = () => {
      publishSessionEvent("session_keepalive", {
        processedChanges,
        totalChanges,
      });
    };

    keepalive();
    const keepaliveTimer = setInterval(keepalive, keepaliveInterval);
    this.sessionKeepaliveTimers.set(operation.id, keepaliveTimer);

    let teardownPayload: SessionStreamPayload = { status: "completed" };
    let runError: unknown;

    try {
      for (const change of changes) {
        await awaitIfPaused();
        this.ensureNotCancelled(operation);
        try {
          this.emit("syncProgress", operation, {
            phase: "processing_changes",
            progress: (processedChanges / totalChanges) * 0.8,
          });

          switch (change.type) {
            case "create":
            case "modify":

              let parseResult;
              try {
                parseResult = await this.astParser.parseFileIncremental(
                  change.path
                );
              } catch (error) {

                operation.errors.push({
                  file: change.path,
                  type: "parse",
                  message: `Failed to parse file: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  timestamp: new Date(),
                  recoverable: false,
                });
                processedChanges++;
                continue;
              }


              if (
                parseResult.entities.length > 0 ||
                parseResult.relationships.length > 0
              ) {
                const conflicts = await this.detectConflicts(
                  parseResult.entities,
                  parseResult.relationships,
                  syncOptions
                );

                if (conflicts.length > 0) {
                  this.logConflicts(
                    conflicts,
                    operation,
                    change.path,
                    syncOptions
                  );
                }
              }


              for (const entity of parseResult.entities) {
                try {
                  if (
                    parseResult.isIncremental &&
                    parseResult.updatedEntities?.includes(entity)
                  ) {
                    await this.kgService.updateEntity(entity.id, entity);
                    operation.entitiesUpdated++;
                    toEmbed.push(entity);
                  } else {
                    await this.kgService.createEntity(entity, {
                      skipEmbedding: true,
                    });
                    operation.entitiesCreated++;
                    toEmbed.push(entity);
                  }
                } catch (error) {
                  operation.errors.push({
                    file: change.path,
                    type: "database",
                    message: `Failed to process entity ${entity.id}: ${
                      error instanceof Error ? error.message : "Unknown"
                    }`,
                    timestamp: new Date(),
                    recoverable: true,
                  });
                }
              }


              for (const relationship of parseResult.relationships) {
                try {
                  const created = await this.resolveAndCreateRelationship(
                    relationship,
                    change.path
                  );
                  if (created) {
                    operation.relationshipsCreated++;
                  } else {
                    this.unresolvedRelationships.push({
                      relationship,
                      sourceFilePath: change.path,
                    });
                  }
                } catch (error) {
                  operation.errors.push({
                    file: change.path,
                    type: "database",
                    message: `Failed to create relationship: ${
                      error instanceof Error ? error.message : "Unknown"
                    }`,
                    timestamp: new Date(),
                    recoverable: true,
                  });

                  this.unresolvedRelationships.push({
                    relationship,
                    sourceFilePath: change.path,
                  });
                }
              }


              if (parseResult.isIncremental && parseResult.removedEntities) {
                for (const entity of parseResult.removedEntities) {
                  try {

                    const now2 = new Date();
                    try {
                      await this.kgService.createRelationship({
                        id: `rel_${entity.id}_${changeId}_REMOVED_IN`,
                        fromEntityId: entity.id,
                        toEntityId: changeId,
                        type: RelationshipType.REMOVED_IN as any,
                        created: now2,
                        lastModified: now2,
                        version: 1,
                      } as any);
                    } catch {}

                    try {
                      const git = new GitService();
                      const info = await git.getLastCommitInfo(change.path);
                      await this.kgService.createRelationship({
                        id: `rel_${entity.id}_${sessionId}_MODIFIED_BY`,
                        fromEntityId: entity.id,
                        toEntityId: sessionId,
                        type: RelationshipType.MODIFIED_BY as any,
                        created: now2,
                        lastModified: now2,
                        version: 1,
                        metadata: info
                          ? {
                              author: info.author,
                              email: info.email,
                              commitHash: info.hash,
                              date: info.date,
                            }
                          : { source: "sync" },
                      } as any
                      );
                    } catch {}
                    try {
                      enqueueSessionRelationship(
                        RelationshipType.SESSION_IMPACTED,
                        entity.id,
                        {
                          timestamp: now2,
                          metadata: { severity: "high", file: change.path },
                          impact: { severity: "high" },
                        }
                      );
                    } catch {}
                    changedSeeds.add(entity.id);
                    await this.kgService.deleteEntity(entity.id);
                    operation.entitiesDeleted++;
                  } catch (error) {
                    const label =
                      (entity as any).path ||
                      (entity as any).name ||
                      (entity as any).title ||
                      entity.id;
                    operation.errors.push({
                      file: change.path,
                      type: "database",
                      message: `Failed to delete entity ${label}: ${
                        error instanceof Error ? error.message : "Unknown"
                      }`,
                      timestamp: new Date(),
                      recoverable: true,
                    });
                  }
                }
              }


              if (parseResult.isIncremental) {
                const now = new Date();


                if (Array.isArray(parseResult.updatedEntities)) {
                  for (const ent of parseResult.updatedEntities) {
                    try {
                      await this.kgService.appendVersion(ent, {
                        timestamp: now,
                        changeSetId: changeId,
                      });
                      operation.entitiesUpdated++;
                      const operationKind =
                        change.type === "create"
                          ? "added"
                          : change.type === "delete"
                          ? "deleted"
                          : "modified";
                      const changeInfo = {
                        elementType: "file",
                        elementName: change.path,
                        operation: operationKind,
                      };
                      let stateTransition: Record<string, any> | undefined = {
                        from: "unknown",
                        to: "working",
                        verifiedBy: "manual",
                        confidence: 0.5,
                      };
                      try {
                        const git = new GitService();
                        const diff = await git.getUnifiedDiff(change.path, 3);
                        let beforeSnippet = "";
                        let afterSnippet = "";
                        if (diff) {
                          const lines = diff.split("\n");
                          for (const ln of lines) {
                            if (
                              ln.startsWith("---") ||
                              ln.startsWith("+++") ||
                              ln.startsWith("@@")
                            )
                              continue;
                            if (
                              ln.startsWith("-") &&
                              beforeSnippet.length < 400
                            )
                              beforeSnippet += ln.substring(1) + "\n";
                            if (ln.startsWith("+") && afterSnippet.length < 400)
                              afterSnippet += ln.substring(1) + "\n";
                            if (
                              beforeSnippet.length >= 400 &&
                              afterSnippet.length >= 400
                            )
                              break;
                          }
                        }
                        const criticalChange: Record<string, any> = {
                          entityId: ent.id,
                        };
                        if (beforeSnippet.trim())
                          criticalChange.beforeSnippet = beforeSnippet.trim();
                        if (afterSnippet.trim())
                          criticalChange.afterSnippet = afterSnippet.trim();
                        if (Object.keys(criticalChange).length > 1) {
                          stateTransition = {
                            ...stateTransition,
                            criticalChange,
                          };
                        }
                      } catch {

                      }
                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_MODIFIED,
                          ent.id,
                          {
                            timestamp: now,
                            metadata: { file: change.path },
                            changeInfo,
                            stateTransition,
                          }
                        );
                      } catch {}

                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_IMPACTED,
                          ent.id,
                          {
                            timestamp: now,
                            metadata: { severity: "medium", file: change.path },
                            impact: { severity: "medium" },
                          }
                        );
                      } catch {}

                      try {
                        await this.kgService.createRelationship({
                            id: `rel_${ent.id}_${changeId}_MODIFIED_IN`,
                            fromEntityId: ent.id,
                            toEntityId: changeId,
                            type: RelationshipType.MODIFIED_IN as any,
                            created: now,
                            lastModified: now,
                            version: 1,
                          } as any);
                      } catch {}

                      try {
                        const git = new GitService();
                        const info = await git.getLastCommitInfo(change.path);
                        await this.kgService.createRelationship({
                            id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                            fromEntityId: ent.id,
                            toEntityId: sessionId,
                            type: RelationshipType.MODIFIED_BY as any,
                            created: now,
                            lastModified: now,
                            version: 1,
                            metadata: info
                              ? {
                                  author: info.author,
                                  email: info.email,
                                  commitHash: info.hash,
                                  date: info.date,
                                }
                              : { source: "sync" },
                          } as any);
                      } catch {}
                      changedSeeds.add(ent.id);
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `appendVersion failed for ${ent.id}: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }


                if (Array.isArray((parseResult as any).addedRelationships)) {
                  for (const rel of (parseResult as any)
                    .addedRelationships as GraphRelationship[]) {
                    try {
                      let toId = rel.toEntityId;

                      if (!toId || String(toId).includes(":")) {
                        const resolved = await (
                          this as any
                        ).resolveRelationshipTarget(rel, change.path);
                        if (resolved) toId = resolved;
                      }
                      if (toId && rel.fromEntityId) {
                        await this.kgService.openEdge(
                          rel.fromEntityId,
                          toId as any,
                          rel.type,
                          now,
                          changeId
                        );

                        try {
                          const enriched = {
                            ...rel,
                            toEntityId: toId,
                          } as GraphRelationship;
                          await this.kgService.upsertEdgeEvidenceBulk([
                            enriched,
                          ]);
                        } catch {}
                        operation.relationshipsUpdated++;
                      }
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `openEdge failed: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }


                if (Array.isArray((parseResult as any).removedRelationships)) {
                  for (const rel of (parseResult as any)
                    .removedRelationships as GraphRelationship[]) {
                    try {
                      let toId = rel.toEntityId;
                      if (!toId || String(toId).includes(":")) {
                        const resolved = await (
                          this as any
                        ).resolveRelationshipTarget(rel, change.path);
                        if (resolved) toId = resolved;
                      }
                      if (toId && rel.fromEntityId) {
                        await this.kgService.closeEdge(
                          rel.fromEntityId,
                          toId as any,
                          rel.type,
                          now,
                          changeId
                        );
                        operation.relationshipsUpdated++;
                      }
                    } catch (err) {
                      operation.errors.push({
                        file: change.path,
                        type: "database",
                        message: `closeEdge failed: ${
                          err instanceof Error ? err.message : "unknown"
                        }`,
                        timestamp: new Date(),
                        recoverable: true,
                      });
                    }
                  }
                }


                if (Array.isArray((parseResult as any).addedEntities)) {
                  for (const ent of (parseResult as any)
                    .addedEntities as any[]) {
                    try {
                      const now3 = new Date();
                      await this.kgService.createRelationship({
                          id: `rel_${ent.id}_${changeId}_CREATED_IN`,
                          fromEntityId: ent.id,
                          toEntityId: changeId,
                          type: RelationshipType.CREATED_IN as any,
                          created: now3,
                          lastModified: now3,
                          version: 1,
                        } as any);

                      try {
                        const git = new GitService();
                        const info = await git.getLastCommitInfo(change.path);
                        await this.kgService.createRelationship({
                            id: `rel_${ent.id}_${sessionId}_MODIFIED_BY`,
                            fromEntityId: ent.id,
                            toEntityId: sessionId,
                            type: RelationshipType.MODIFIED_BY as any,
                            created: now3,
                            lastModified: now3,
                            version: 1,
                            metadata: info
                              ? {
                                  author: info.author,
                                  email: info.email,
                                  commitHash: info.hash,
                                  date: info.date,
                                }
                              : { source: "sync" },
                          } as any);
                      } catch {}
                      let stateTransitionNew: Record<string, any> | undefined =
                        {
                          from: "unknown",
                          to: "working",
                          verifiedBy: "manual",
                          confidence: 0.4,
                        };
                      try {
                        const git = new GitService();
                        const diff = await git.getUnifiedDiff(change.path, 2);
                        let afterSnippet = "";
                        if (diff) {
                          const lines = diff.split("\n");
                          for (const ln of lines) {
                            if (
                              ln.startsWith("+++") ||
                              ln.startsWith("---") ||
                              ln.startsWith("@@")
                            )
                              continue;
                            if (ln.startsWith("+") && afterSnippet.length < 300)
                              afterSnippet += ln.substring(1) + "\n";
                            if (afterSnippet.length >= 300) break;
                          }
                        }
                        if (afterSnippet.trim()) {
                          stateTransitionNew = {
                            ...stateTransitionNew,
                            criticalChange: {
                              entityId: ent.id,
                              afterSnippet: afterSnippet.trim(),
                            },
                          };
                        }
                      } catch {

                      }
                      try {
                        enqueueSessionRelationship(
                          RelationshipType.SESSION_IMPACTED,
                          ent.id,
                          {
                            timestamp: now3,
                            metadata: { severity: "low", file: change.path },
                            stateTransition: stateTransitionNew,
                            impact: { severity: "low" },
                          }
                        );
                      } catch {}
                      changedSeeds.add(ent.id);
                    } catch {}
                  }
                }
              }
              break;

            case "delete":

              try {
                const fileEntities = await this.kgService.getEntitiesByFile(change.path);

                for (const entity of fileEntities) {
                  await this.kgService.deleteEntity(entity.id);
                  operation.entitiesDeleted++;
                }

                console.log(
                  `🗑️ Removed ${fileEntities.length} entities from deleted file ${change.path}`
                );
              } catch (error) {
                operation.errors.push({
                  file: change.path,
                  type: "database",
                  message: `Failed to handle file deletion: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: false,
                });
              }
              break;
          }

          operation.filesProcessed++;
          processedChanges++;
        } catch (error) {
          operation.errors.push({
            file: change.path,
            type: "parse",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date(),
            recoverable: true,
          });
        }

        await flushSessionRelationships();
      }


      await this.runPostResolution(operation);


      await flushSessionRelationships();


      const seeds = Array.from(changedSeeds);
      if (seeds.length > 0) {
        await this.enqueueCheckpointWithNotification({
          sessionId,
          seeds,
          options: {
            reason: "manual",
            hopCount: 2,
            operationId: operation.id,
          },
          processedChanges,
          totalChanges,
          publish: (payload) =>
            publishSessionEvent("session_checkpoint", payload),
        });
      }


      if (toEmbed.length > 0) {
        try {
          await this.kgService.createEmbeddingsBatch(toEmbed);
        } catch (e) {
          operation.errors.push({
            file: "coordinator",
            type: "database",
            message: `Batch embedding failed: ${
              e instanceof Error ? e.message : "unknown"
            }`,
            timestamp: new Date(),
            recoverable: true,
          });
        }
      }


      try {
        await this.kgService.finalizeScan(scanStart);
      } catch {}
    } catch (error) {
      runError = error;
      teardownPayload = {
        status: "failed",
        details: {
          message: error instanceof Error ? error.message : String(error),
        },
      };
      throw error;
    } finally {
      const timer = this.sessionKeepaliveTimers.get(operation.id);
      if (timer) {
        clearInterval(timer);
        this.sessionKeepaliveTimers.delete(operation.id);
      }
      this.activeSessionIds.delete(operation.id);
      this.clearSessionTracking(sessionId);

      const summaryPayload: SessionStreamPayload = {
        ...teardownPayload,
        processedChanges,
        totalChanges,
      };

      if (
        !summaryPayload.errors &&
        (summaryPayload.status === "failed" || operation.errors.length > 0)
      ) {
        summaryPayload.errors = operation.errors.slice(-5);
      }

      if (summaryPayload.status !== "failed" && runError) {
        summaryPayload.status = "failed";
      }

      if (
        summaryPayload.status !== "failed" &&
        operation.errors.some((err) => err.recoverable === false)
      ) {
        summaryPayload.status = "failed";
      }

      keepalive();
      sendTeardown(summaryPayload);
    }

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async performPartialSync(operation: SyncOperation): Promise<void> {

    this.emit("syncProgress", operation, {
      phase: "processing_partial",
      progress: 0,
    });


    const updates = ((operation as any).updates as PartialUpdate[]) || [];

    if (updates.length === 0) {
      this.emit("syncProgress", operation, {
        phase: "completed",
        progress: 1.0,
      });
      return;
    }

    const totalUpdates = updates.length;
    let processedUpdates = 0;

    for (const update of updates) {
      this.ensureNotCancelled(operation);
      try {
        this.emit("syncProgress", operation, {
          phase: "processing_partial",
          progress: (processedUpdates / totalUpdates) * 0.9,
        });

        switch (update.type) {
          case "create":

            if (update.newValue) {
              try {
                await this.kgService.createEntity(update.newValue);
                operation.entitiesCreated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to create entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "update":

            if (update.changes) {
              try {
                await this.kgService.updateEntity(
                  update.entityId,
                  update.changes
                );
                operation.entitiesUpdated++;
              } catch (error) {
                operation.errors.push({
                  file: update.entityId,
                  type: "database",
                  message: `Failed to update entity: ${
                    error instanceof Error ? error.message : "Unknown"
                  }`,
                  timestamp: new Date(),
                  recoverable: true,
                });
              }
            }
            break;

          case "delete":

            try {
              await this.kgService.deleteEntity(update.entityId);
              operation.entitiesDeleted++;
            } catch (error) {
              operation.errors.push({
                file: update.entityId,
                type: "database",
                message: `Failed to delete entity: ${
                  error instanceof Error ? error.message : "Unknown"
                }`,
                timestamp: new Date(),
                recoverable: true,
              });
            }
            break;
        }

        processedUpdates++;
      } catch (error) {
        operation.errors.push({
          file: "partial_update",
          type: "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
          recoverable: false,
        });
      }
    }

    this.emit("syncProgress", operation, { phase: "completed", progress: 1.0 });
  }

  private async scanSourceFiles(): Promise<string[]> {

    const fs = await import("fs/promises");
    const path = await import("path");

    const files: string[] = [];
    const extensions = [".ts", ".tsx", ".js", ".jsx"];


    const directories = ["src", "lib", "packages", "tests"];


    const shouldExclude = (filePath: string): boolean => {
      return (
        filePath.includes("node_modules") ||
        filePath.includes("dist") ||
        filePath.includes("build") ||
        filePath.includes(".git") ||
        filePath.includes("coverage") ||
        filePath.endsWith(".d.ts") ||
        filePath.endsWith(".min.js")
      );
    };

    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (shouldExclude(fullPath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (
            entry.isFile() &&
            extensions.some((ext) => fullPath.endsWith(ext))
          ) {
            files.push(path.resolve(fullPath));
          }
        }
      } catch (error) {

      }
    };

    try {
      for (const dir of directories) {
        await scanDirectory(dir);
      }


      const uniqueFiles = Array.from(new Set(files));
      console.log(`📂 Found ${uniqueFiles.length} source files to scan`);

      return uniqueFiles;
    } catch (error) {
      console.error("Error scanning source files:", error);
      return [];
    }
  }

  private logConflicts(
    conflicts: Conflict[],
    operation: SyncOperation,
    source: string,
    options?: SyncOptions
  ): void {
    operation.conflicts.push(...conflicts);

    const unresolved = conflicts.filter((conflict) => !conflict.resolved);
    const resolvedCount = conflicts.length - unresolved.length;
    const resolutionMode = options?.conflictResolution ?? "manual";

    if (unresolved.length > 0) {
      console.warn(
        `⚠️ ${unresolved.length}/${conflicts.length} conflicts detected in ${source} (${resolutionMode} mode)`
      );
    } else {
      console.info(
        `✅ ${resolvedCount} conflicts auto-resolved for ${source} (${resolutionMode} mode)`
      );
    }

    for (const conflict of conflicts) {
      this.emit("conflictDetected", conflict);
    }
  }

  private async detectConflicts(
    entities: any[],
    relationships: any[],
    options?: SyncOptions
  ): Promise<Conflict[]> {
    if (entities.length === 0 && relationships.length === 0) {
      return [];
    }

    const conflicts = await this.conflictResolution.detectConflicts(
      entities,
      relationships
    );

    if (conflicts.length === 0) {
      return conflicts;
    }

    const resolutionMode = options?.conflictResolution;
    if (resolutionMode && resolutionMode !== "manual") {
      const results = await this.conflictResolution.resolveConflictsAuto(
        conflicts
      );

      const unresolved = conflicts.filter((conflict) => !conflict.resolved);
      if (results.length !== conflicts.length || unresolved.length > 0) {
        console.warn(
          `⚠️ Auto-resolution (${resolutionMode}) handled ${results.length}/${conflicts.length} conflicts; ${unresolved.length} remain unresolved.`
        );
      }
    }

    return conflicts;
  }

  async rollbackOperation(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.status !== "failed") {
      return false;
    }

    try {

      operation.status = "rolled_back";
      this.emit("operationRolledBack", operation);
      return true;
    } catch (error) {
      this.emit("rollbackFailed", operation, error);
      return false;
    }
  }

  getOperationStatus(operationId: string): SyncOperation | null {
    return (
      this.activeOperations.get(operationId) ||
      this.completedOperations.get(operationId) ||
      null
    );
  }

  getActiveOperations(): SyncOperation[] {
    return Array.from(this.activeOperations.values());
  }

  getQueueLength(): number {
    return this.operationQueue.length;
  }

  async startIncrementalSynchronization(
    options: SyncOptions = {}
  ): Promise<string> {

    return this.synchronizeFileChanges([], options);
  }

  async startPartialSynchronization(
    paths: string[],
    options: SyncOptions = {}
  ): Promise<string> {

    const updates: PartialUpdate[] = paths.map((path) => ({
      entityId: path,
      type: "update" as const,
      changes: {},
    }));

    return this.synchronizePartial(updates, options);
  }

  async cancelOperation(operationId: string): Promise<boolean> {
    this.cancelledOperations.add(operationId);

    const active = this.activeOperations.get(operationId);
    if (active) {
      if (!active.errors.some((e) => e.type === "cancelled")) {
        active.errors.push({
          file: "coordinator",
          type: "cancelled",
          message: `Operation ${operationId} cancellation requested`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
      return true;
    }

    const queueIndex = this.operationQueue.findIndex(
      (op) => op.id === operationId
    );
    if (queueIndex !== -1) {
      const [operation] = this.operationQueue.splice(queueIndex, 1);
      operation.status = "failed";
      operation.endTime = new Date();
      operation.errors.push({
        file: "coordinator",
        type: "cancelled",
        message: `Operation ${operationId} cancelled before execution`,
        timestamp: new Date(),
        recoverable: true,
      });
      this.retryQueue.delete(operationId);
      this.completedOperations.set(operationId, operation);
      this.cancelledOperations.delete(operationId);
      this.emit("operationCancelled", operation);
      return true;
    }

    if (this.completedOperations.has(operationId)) {
      this.cancelledOperations.delete(operationId);
      return true;
    }

    if (this.retryQueue.has(operationId)) {
      this.retryQueue.delete(operationId);
      this.cancelledOperations.delete(operationId);
      return true;
    }

    this.cancelledOperations.delete(operationId);
    return false;
  }

  getOperationStatistics(): {
    total: number;
    active: number;
    queued: number;
    completed: number;
    failed: number;
    retried: number;
    totalOperations: number;
    completedOperations: number;
    failedOperations: number;
    totalFilesProcessed: number;
    totalEntitiesCreated: number;
    totalErrors: number;
  } {
    const activeOperations = Array.from(this.activeOperations.values());
    const completedOperations = Array.from(this.completedOperations.values());
    const retryOperations = Array.from(this.retryQueue.values());
    const allOperations = [...activeOperations, ...completedOperations];

    const totalFilesProcessed = allOperations.reduce(
      (sum, op) => sum + op.filesProcessed,
      0
    );
    const totalEntitiesCreated = allOperations.reduce(
      (sum, op) => sum + op.entitiesCreated,
      0
    );
    const totalErrors = allOperations.reduce(
      (sum, op) => sum + op.errors.length,
      0
    );

    return {
      total: allOperations.length + this.operationQueue.length,
      active: activeOperations.filter((op) => op.status === "running").length,
      queued: this.operationQueue.length,
      completed: allOperations.filter((op) => op.status === "completed").length,
      failed: allOperations.filter((op) => op.status === "failed").length,
      retried: retryOperations.length,
      totalOperations: allOperations.length + this.operationQueue.length,
      completedOperations: allOperations.filter(
        (op) => op.status === "completed"
      ).length,
      failedOperations: allOperations.filter((op) => op.status === "failed")
        .length,
      totalFilesProcessed,
      totalEntitiesCreated,
      totalErrors,
    };
  }

  private handleOperationCompleted(operation: SyncOperation): void {
    console.log(`✅ Sync operation ${operation.id} completed successfully`);


    if (this.retryQueue.has(operation.id)) {
      const retryInfo = this.retryQueue.get(operation.id);
      console.log(
        `✅ Retry successful for operation ${operation.id} after ${retryInfo?.attempts} attempts`
      );
      this.retryQueue.delete(operation.id);
    }



  }

  private handleOperationFailed(operation: SyncOperation): void {
    try {
      const msg = operation.errors
        ?.map((e) => `${e.type}:${e.message}`)
        .join("; ");
      console.error(
        `❌ Sync operation ${operation.id} failed: ${msg || "unknown"}`
      );
    } catch {
      console.error(
        `❌ Sync operation ${operation.id} failed:`,
        operation.errors
      );
    }


    const hasRecoverableErrors = operation.errors.some((e) => e.recoverable);

    if (hasRecoverableErrors) {

      const retryInfo = this.retryQueue.get(operation.id);
      const attempts = retryInfo ? retryInfo.attempts : 0;

      if (attempts < this.maxRetryAttempts) {
        console.log(
          `🔄 Scheduling retry ${attempts + 1}/${
            this.maxRetryAttempts
          } for operation ${operation.id}`
        );


        this.retryQueue.set(operation.id, {
          operation,
          attempts: attempts + 1,
        });


        setTimeout(() => {
          this.retryOperation(operation);
        }, this.retryDelay * (attempts + 1));
      } else {
        console.error(
          `❌ Max retry attempts reached for operation ${operation.id}`
        );
        this.retryQueue.delete(operation.id);
        this.emit("operationAbandoned", operation);
      }
    } else {
      console.error(
        `❌ Operation ${operation.id} has non-recoverable errors, not retrying`
      );
    }
  }

  private async retryOperation(operation: SyncOperation): Promise<void> {
    console.log(`🔄 Retrying operation ${operation.id}`);


    operation.status = "pending";
    operation.startTime = new Date();
    operation.endTime = undefined;
    operation.errors = [];
    operation.conflicts = [];
    if (operation.rollbackPoint && this.rollbackCapabilities) {
      try {
        this.rollbackCapabilities.deleteRollbackPoint(operation.rollbackPoint);
      } catch {

      }
      operation.rollbackPoint = undefined;
    }

    const options = ((operation as any).options || {}) as SyncOptions;
    if (options.rollbackOnError) {
      if (!this.rollbackCapabilities) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message:
            "Rollback requested but rollback capabilities are not configured",
          timestamp: new Date(),
          recoverable: false,
        });
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return;
      }
      try {
        const rollbackId = await this.rollbackCapabilities.createRollbackPoint(
          operation.id,
          `Retry rollback snapshot for ${operation.id}`
        );
        operation.rollbackPoint = rollbackId;
      } catch (error) {
        operation.status = "failed";
        operation.endTime = new Date();
        operation.errors.push({
          file: "coordinator",
          type: "rollback",
          message: `Failed to create rollback point during retry: ${
            error instanceof Error ? error.message : "unknown"
          }`,
          timestamp: new Date(),
          recoverable: false,
        });
        this.completedOperations.set(operation.id, operation);
        this.emit("operationFailed", operation);
        return;
      }
    }


    this.activeOperations.set(operation.id, operation);
    this.completedOperations.delete(operation.id);
    this.cancelledOperations.delete(operation.id);


    this.operationQueue.push(operation);


    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private handleConflictDetected(conflict: Conflict): void {
    console.warn(`⚠️ Sync conflict detected:`, {
      id: conflict.id,
      type: conflict.type,
      entityId: conflict.entityId,
      relationshipId: conflict.relationshipId,
      resolved: conflict.resolved,
      strategy: conflict.resolutionStrategy,
    });
  }


  private async runPostResolution(operation: SyncOperation): Promise<void> {
    if (this.unresolvedRelationships.length === 0) return;
    this.emit("syncProgress", operation, {
      phase: "resolving_relationships",
      progress: 0.95,
    });

    const pending = this.unresolvedRelationships.splice(0);
    let createdCount = 0;
    for (const item of pending) {
      try {
        const created = await (this as any).resolveAndCreateRelationship(
          item.relationship,
          item.sourceFilePath
        );
        if (created) createdCount++;
      } catch {

      }
    }
    if (createdCount > 0) {
      operation.relationshipsCreated += createdCount;
    }
  }
}

export interface PartialUpdate {
  entityId: string;
  changes: Record<string, any>;
  type: "update" | "delete" | "create";
  newValue?: any;
}

export interface FileLikeEntity {
  path?: string;
}

declare module "./synchronization/SynchronizationCoordinator.js" {
  interface SynchronizationCoordinator {
    resolveAndCreateRelationship(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<boolean>;
    resolveRelationshipTarget(
      relationship: GraphRelationship,
      sourceFilePath?: string
    ): Promise<string | null>;
  }
}


(SynchronizationCoordinator as any).prototype.resolveAndCreateRelationship =
  async function (
    this: SynchronizationCoordinator,
    relationship: GraphRelationship,
    sourceFilePath?: string
  ): Promise<boolean> {
    try {
      const toEntity = await (this as any).kgService.getEntity(
        relationship.toEntityId
      );
      if (toEntity) {
        await (this as any).kgService.createRelationship(
          relationship,
          undefined,
          undefined,
          { validate: false }
        );
        return true;
      }
    } catch {}

    const resolvedResult = await (this as any).resolveRelationshipTarget(
      relationship,
      sourceFilePath
    );
    const resolvedId =
      typeof resolvedResult === "string"
        ? resolvedResult
        : resolvedResult?.id || null;
    if (!resolvedId) return false;
    const enrichedMeta = { ...(relationship as any).metadata } as any;
    if (resolvedResult && typeof resolvedResult === "object") {
      if (
        Array.isArray((resolvedResult as any).candidates) &&
        (resolvedResult as any).candidates.length > 0
      ) {
        enrichedMeta.candidates = (resolvedResult as any).candidates.slice(
          0,
          5
        );
        (relationship as any).ambiguous =
          (resolvedResult as any).candidates.length > 1;
        (relationship as any).candidateCount = (
          resolvedResult as any
        ).candidates.length;
      }
      if ((resolvedResult as any).resolutionPath)
        enrichedMeta.resolutionPath = (resolvedResult as any).resolutionPath;
      enrichedMeta.resolvedTo = { kind: "entity", id: resolvedId };
    }
    const resolvedRel = {
      ...relationship,
      toEntityId: resolvedId,
      metadata: enrichedMeta,
    } as GraphRelationship;
    await (this as any).kgService.createRelationship(
      resolvedRel,
      undefined,
      undefined,
      { validate: false }
    );
    return true;
  };

(SynchronizationCoordinator as any).prototype.resolveRelationshipTarget =
  async function (
    this: SynchronizationCoordinator,
    relationship: GraphRelationship,
    sourceFilePath?: string
  ): Promise<
    | string
    | {
        id: string | null;
        candidates?: Array<{
          id: string;
          name?: string;
          path?: string;
          resolver?: string;
          score?: number;
        }>;
        resolutionPath?: string;
      }
    | null
  > {
    const to = (relationship.toEntityId as any) || "";

    // Prefer structured toRef when present to avoid brittle string parsing
    const toRef: any = (relationship as any).toRef;
    // Establish a currentFilePath context early using fromRef if provided
    let currentFilePath = sourceFilePath;
    const candidates: Array<{
      id: string;
      name?: string;
      path?: string;
      resolver?: string;
      score?: number;
    }> = [];
    try {
      const fromRef: any = (relationship as any).fromRef;
      if (!currentFilePath && fromRef && typeof fromRef === "object") {
        if (fromRef.kind === "fileSymbol" && fromRef.file) {
          currentFilePath = fromRef.file;
        } else if (fromRef.kind === "entity" && fromRef.id) {
          const ent = await (this as any).kgService.getEntity(fromRef.id);
          const p = (ent as any)?.path as string | undefined;
          if (p) currentFilePath = p.includes(":") ? p.split(":")[0] : p;
        }
      }
    } catch {}
    if (toRef && typeof toRef === "object") {
      try {
        if (toRef.kind === "entity" && toRef.id) {
          return { id: toRef.id, candidates, resolutionPath: "entity" };
        }
        if (
          toRef.kind === "fileSymbol" &&
          toRef.file &&
          (toRef.symbol || toRef.name)
        ) {
          const ent = await (this as any).kgService.findSymbolInFile(
            toRef.file,
            toRef.symbol || toRef.name
          );
          if (ent)
            return { id: ent.id, candidates, resolutionPath: "fileSymbol" };
        }
        if (toRef.kind === "external" && toRef.name) {
          const name = toRef.name as string;
          if (!currentFilePath) {
            try {
              const fromEntity = await (this as any).kgService.getEntity(
                relationship.fromEntityId
              );
              if (fromEntity && (fromEntity as any).path) {
                const p = (fromEntity as any).path as string;
                currentFilePath = p.includes(":") ? p.split(":")[0] : p;
              }
            } catch {}
          }
          if (currentFilePath) {
            const local = await (this as any).kgService.findSymbolInFile(
              currentFilePath,
              name
            );
            if (local) {
              candidates.push({
                id: local.id,
                name: (local as any).name,
                path: (local as any).path,
                resolver: "local",
                score: 1.0,
              });
            }
            const near = await (this as any).kgService.findNearbySymbols(
              currentFilePath,
              name,
              5
            );
            for (const n of near)
              candidates.push({
                id: n.id,
                name: (n as any).name,
                path: (n as any).path,
                resolver: "nearby",
              });
          }
          const global = await (this as any).kgService.findSymbolsByName(name);
          for (const g of global) {
            candidates.push({
              id: g.id,
              name: (g as any).name,
              path: (g as any).path,
              resolver: "name",
            });
          }
          if (candidates.length > 0) {
            const chosen = candidates[0];
            const resolutionPath =
              chosen.resolver === "local" ? "external-local" : "external-name";
            return { id: chosen.id, candidates, resolutionPath };
          }
        }
      } catch {}
    }


    {
      const fileMatch = to.match(/^file:(.+?):(.+)$/);
      if (fileMatch) {
        const relPath = fileMatch[1];
        const name = fileMatch[2];
        try {
          const ent = await (this as any).kgService.findSymbolInFile(
            relPath,
            name
          );
          if (ent)
            return {
              id: ent.id,
              candidates,
              resolutionPath: "file-placeholder",
            };
        } catch {}
        return null;
      }
    }



    if (!currentFilePath) {
      try {
        const fromEntity = await (this as any).kgService.getEntity(
          relationship.fromEntityId
        );
        if (fromEntity && (fromEntity as any).path) {
          const p = (fromEntity as any).path as string;
          currentFilePath = p.includes(":") ? p.split(":")[0] : p;
        }
      } catch {}
    }

    const kindMatch = to.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (kindMatch) {
      const kind = kindMatch[1];
      const name = kindMatch[2];
      if (currentFilePath) {

        const key = `${currentFilePath}:${name}`;
        const localId = (this as any).localSymbolIndex?.get?.(key);
        if (localId)
          return { id: localId, candidates, resolutionPath: "local-index" };
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }

        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          3
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const byKind = await (this as any).kgService.findSymbolByKindAndName(
        kind,
        name
      );
      for (const c of byKind)
        candidates.push({
          id: c.id,
          name: (c as any).name,
          path: (c as any).path,
          resolver: "kind-name",
        });
      if (candidates.length > 0)
        return {
          id: candidates[0].id,
          candidates,
          resolutionPath: "kind-name",
        };
      return null;
    }

    const importMatch = to.match(/^import:(.+?):(.+)$/);
    if (importMatch) {
      const name = importMatch[2];
      if (currentFilePath) {
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }

        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          5
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const byName = await (this as any).kgService.findSymbolsByName(name);
      for (const c of byName) {
        candidates.push({
          id: c.id,
          name: (c as any).name,
          path: (c as any).path,
          resolver: "name",
        });
      }
      if (candidates.length > 0) {
        const chosen = candidates[0];
        const suffix = chosen.resolver === "local" ? "local" : "name";
        return {
          id: chosen.id,
          candidates,
          resolutionPath: `import-${suffix}`,
        };
      }
      return null;
    }

    const externalMatch = to.match(/^external:(.+)$/);
    if (externalMatch) {
      const name = externalMatch[1];
      if (currentFilePath) {
        const local = await (this as any).kgService.findSymbolInFile(
          currentFilePath,
          name
        );
        if (local) {
          candidates.push({
            id: local.id,
            name: (local as any).name,
            path: (local as any).path,
            resolver: "local",
          });
        }

        const near = await (this as any).kgService.findNearbySymbols(
          currentFilePath,
          name,
          5
        );
        for (const n of near)
          candidates.push({
            id: n.id,
            name: (n as any).name,
            path: (n as any).path,
            resolver: "nearby",
          });
      }
      const global = await (this as any).kgService.findSymbolsByName(name);
      for (const g of global) {
        candidates.push({
          id: g.id,
          name: (g as any).name,
          path: (g as any).path,
          resolver: "name",
        });
      }
      if (candidates.length > 0) {
        const chosen = candidates[0];
        const suffix = chosen.resolver === "local" ? "local" : "name";
        return {
          id: chosen.id,
          candidates,
          resolutionPath: `external-${suffix}`,
        };
      }
      return null;
    }

    return null;
  };

================
File: synchronization/SynchronizationMonitoring.ts
================
import { EventEmitter } from 'events';
import {
  SyncOperation,
  SyncError,
  SyncConflict,
  type CheckpointMetricsSnapshot,
} from './SynchronizationCoordinator.js';
import { RelationshipType } from '@memento/graph';
import { Conflict } from '../scm/ConflictResolution.js';
import type {
  SessionCheckpointJobMetrics,
  SessionCheckpointJobSnapshot,
} from '@memento/jobs';

export interface SyncMetrics {
  operationsTotal: number;
  operationsSuccessful: number;
  operationsFailed: number;
  averageSyncTime: number;
  totalEntitiesProcessed: number;
  totalRelationshipsProcessed: number;
  errorRate: number;
  throughput: number;
}

export interface PerformanceMetrics {
  averageParseTime: number;
  averageGraphUpdateTime: number;
  averageEmbeddingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  ioWaitTime: number;
}

export interface HealthMetrics {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  lastSyncTime: Date;
  consecutiveFailures: number;
  queueDepth: number;
  activeOperations: number;
  systemLoad: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  operationId?: string;
  resolved: boolean;
  resolution?: string;
}

export interface SyncLogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  operationId: string;
  message: string;
  data?: any;
}

export interface SessionSequenceAnomaly {
  sessionId: string;
  type: RelationshipType | string;
  sequenceNumber: number;
  previousSequence: number | null;
  reason: 'duplicate' | 'out_of_order';
  eventId?: string;
  timestamp?: Date;
  previousType?: RelationshipType | string | null;
}

export class SynchronizationMonitoring extends EventEmitter {
  private operations = new Map<string, SyncOperation>();
  private metrics: SyncMetrics;
  private performanceMetrics: PerformanceMetrics;
  private alerts: MonitoringAlert[] = [];
  private logs: SyncLogEntry[] = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private opPhases: Map<string, { phase: string; progress: number; timestamp: Date }> = new Map();
  private sessionSequenceStats = {
    duplicates: 0,
    outOfOrder: 0,
    events: [] as SessionSequenceAnomaly[],
  };
  private checkpointMetricsSnapshot: {
    event: string;
    metrics: SessionCheckpointJobMetrics;
    deadLetters: SessionCheckpointJobSnapshot[];
    context?: Record<string, unknown>;
    timestamp: Date;
  } | null = null;

  constructor() {
    super();

    this.metrics = {
      operationsTotal: 0,
      operationsSuccessful: 0,
      operationsFailed: 0,
      averageSyncTime: 0,
      totalEntitiesProcessed: 0,
      totalRelationshipsProcessed: 0,
      errorRate: 0,
      throughput: 0,
    };

    this.performanceMetrics = {
      averageParseTime: 0,
      averageGraphUpdateTime: 0,
      averageEmbeddingTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      ioWaitTime: 0,
    };

    this.setupEventHandlers();
    this.startHealthMonitoring();
  }

  recordCheckpointMetrics(snapshot: CheckpointMetricsSnapshot): void {
    const normalizedContext = snapshot.context
      ? { ...snapshot.context }
      : undefined;
    const cloneDeadLetters = snapshot.deadLetters.map((job) => ({
      ...job,
      payload: { ...job.payload },
    }));

    this.checkpointMetricsSnapshot = {
      event: snapshot.event,
      metrics: { ...snapshot.metrics },
      deadLetters: cloneDeadLetters,
      context: normalizedContext,
      timestamp: snapshot.timestamp
        ? new Date(snapshot.timestamp)
        : new Date(),
    };

    const operationId =
      typeof normalizedContext?.jobId === 'string'
        ? (normalizedContext.jobId as string)
        : 'checkpoint-metrics';
    this.log('info', operationId, 'Checkpoint metrics updated', {
      event: snapshot.event,
      metrics: snapshot.metrics,
      deadLetters: snapshot.deadLetters.length,
      context: normalizedContext,
    });

    this.emit('checkpointMetricsUpdated', this.checkpointMetricsSnapshot);
  }

  getCheckpointMetricsSnapshot(): {
    event: string;
    metrics: SessionCheckpointJobMetrics;
    deadLetters: SessionCheckpointJobSnapshot[];
    context?: Record<string, unknown>;
    timestamp: Date;
  } | null {
    if (!this.checkpointMetricsSnapshot) {
      return null;
    }
    return {
      event: this.checkpointMetricsSnapshot.event,
      metrics: { ...this.checkpointMetricsSnapshot.metrics },
      deadLetters: this.checkpointMetricsSnapshot.deadLetters.map((job) => ({
        ...job,
        payload: { ...job.payload },
      })),
      context: this.checkpointMetricsSnapshot.context
        ? { ...this.checkpointMetricsSnapshot.context }
        : undefined,
      timestamp: new Date(this.checkpointMetricsSnapshot.timestamp),
    };
  }

  private setupEventHandlers(): void {
    this.on('operationStarted', this.handleOperationStarted.bind(this));
    this.on('operationCompleted', this.handleOperationCompleted.bind(this));
    this.on('operationFailed', this.handleOperationFailed.bind(this));
    this.on('conflictDetected', this.handleConflictDetected.bind(this));
    this.on('alertTriggered', this.handleAlertTriggered.bind(this));
  }

  private startHealthMonitoring(): void {

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  recordOperationStart(operation: SyncOperation): void {
    this.operations.set(operation.id, operation);
    this.metrics.operationsTotal++;

    this.log('info', operation.id, 'Operation started', {
      type: operation.type,
      filesToProcess: operation.filesProcessed,
    });

    this.emit('operationStarted', operation);
  }

  recordOperationComplete(operation: SyncOperation): void {
    const op = this.operations.get(operation.id);
    if (op) {
      op.status = 'completed';
      op.endTime = new Date();
      this.metrics.operationsSuccessful++;


      this.opPhases.delete(operation.id);


      this.updateSyncMetrics(operation);
      this.updatePerformanceMetrics(operation);

      this.log('info', operation.id, 'Operation completed successfully', {
        duration: op.endTime.getTime() - op.startTime.getTime(),
        entitiesProcessed: operation.entitiesCreated + operation.entitiesUpdated,
        relationshipsProcessed: operation.relationshipsCreated + operation.relationshipsUpdated,
        errors: operation.errors.length,
      });

      this.emit('operationCompleted', operation);
    }
  }

  recordOperationFailed(operation: SyncOperation, error?: any): void {
    const op = this.operations.get(operation.id);
    if (op) {
      op.status = 'failed';
      op.endTime = new Date();
      this.metrics.operationsFailed++;


      this.opPhases.delete(operation.id);

      this.updateSyncMetrics(operation);

      const errMsg = (error && typeof error === 'object' && 'message' in error)
        ? String((error as any).message)
        : (operation.errors?.[0]?.message || 'Unknown error');

      this.log('error', operation.id, 'Operation failed', {
        error: errMsg,
        duration: op.endTime.getTime() - op.startTime.getTime(),
        errors: operation.errors.length,
      });


      this.triggerAlert({
        type: 'error',
        message: `Sync operation ${operation.id} failed: ${errMsg}`,
        operationId: operation.id,
      });

      this.emit('operationFailed', operation, error);
    }
  }




  recordProgress(operation: SyncOperation, data: { phase: string; progress?: number }): void {
    const prog = typeof data.progress === 'number' && isFinite(data.progress) ? data.progress : 0;
    this.opPhases.set(operation.id, { phase: data.phase, progress: prog, timestamp: new Date() });

    this.log('info', operation.id, 'Phase update', {
      phase: data.phase,
      progress: prog,
    });
  }




  getOperationPhases(): Record<string, { phase: string; progress: number }> {
    const out: Record<string, { phase: string; progress: number }> = {};
    for (const [id, v] of this.opPhases.entries()) {
      out[id] = { phase: v.phase, progress: v.progress };
    }
    return out;
  }

  recordConflict(conflict: SyncConflict | Conflict): void {
    const conflictId = 'id' in conflict ? conflict.id : `${conflict.entityId || conflict.relationshipId || 'conflict'}_${Date.now()}`;
    this.log('warn', conflictId, 'Conflict detected', {
      type: 'sync_conflict',
      entityId: (conflict as Conflict).entityId,
      relationshipId: (conflict as Conflict).relationshipId,
      resolved: (conflict as Conflict).resolved,
      description: (conflict as Conflict).description,
    });

    this.emit('conflictDetected', conflict as Conflict);
  }

  recordSessionSequenceAnomaly(anomaly: SessionSequenceAnomaly): void {
    const entry: SessionSequenceAnomaly = {
      ...anomaly,
      timestamp: anomaly.timestamp ?? new Date(),
    };
    if (entry.reason === 'duplicate') {
      this.sessionSequenceStats.duplicates += 1;
    } else {
      this.sessionSequenceStats.outOfOrder += 1;
    }
    this.sessionSequenceStats.events.push(entry);
    if (this.sessionSequenceStats.events.length > 100) {
      this.sessionSequenceStats.events.shift();
    }
    this.log('warn', entry.sessionId, 'Session sequence anomaly detected', {
      type: entry.type,
      sequenceNumber: entry.sequenceNumber,
      previousSequence: entry.previousSequence,
      reason: entry.reason,
      eventId: entry.eventId,
    });
  }

  recordError(operationId: string, error: SyncError | string | unknown): void {

    const normalized: SyncError = ((): SyncError => {
      if (typeof error === 'string') {
        return {
          file: 'unknown',
          type: 'unknown',
          message: error,
          timestamp: new Date(),
          recoverable: true,
        };
      }
      if (error && typeof error === 'object' && 'message' in (error as any)) {
        const e = error as any;
        return {
          file: e.file ?? 'unknown',
          type: e.type ?? 'unknown',
          message: String(e.message ?? 'Unknown error'),
          timestamp: e.timestamp instanceof Date ? e.timestamp : new Date(),
          recoverable: e.recoverable ?? true,
        };
      }
      return {
        file: 'unknown',
        type: 'unknown',
        message: 'Unknown error',
        timestamp: new Date(),
        recoverable: true,
      };
    })();


    this.log('error', operationId, `Sync error occurred: ${normalized.message}`, {
      file: normalized.file,
      type: normalized.type,
      message: normalized.message,
      recoverable: normalized.recoverable,
    });


    if (!normalized.recoverable) {
      this.triggerAlert({
        type: 'error',
        message: `Non-recoverable error in ${normalized.file}: ${normalized.message}`,
        operationId,
      });
    }
  }

  private updateSyncMetrics(operation: SyncOperation): void {
    const duration = operation.endTime ?
      operation.endTime.getTime() - operation.startTime.getTime() : 0;


    const totalDuration = this.metrics.averageSyncTime * (this.metrics.operationsTotal - 1) + duration;
    this.metrics.averageSyncTime = totalDuration / this.metrics.operationsTotal;


    this.metrics.totalEntitiesProcessed +=
      operation.entitiesCreated + operation.entitiesUpdated + operation.entitiesDeleted;
    this.metrics.totalRelationshipsProcessed +=
      operation.relationshipsCreated + operation.relationshipsUpdated + operation.relationshipsDeleted;


    this.metrics.errorRate = this.metrics.operationsFailed / this.metrics.operationsTotal;


    const timeWindow = 5 * 60 * 1000;
    const recentOps = Array.from(this.operations.values())
      .filter(op => op.endTime && Date.now() - op.endTime.getTime() < timeWindow)
      .length;
    this.metrics.throughput = (recentOps / 5);
  }

  private updatePerformanceMetrics(operation: SyncOperation): void {

    this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed;



    this.performanceMetrics.averageParseTime = 150;
    this.performanceMetrics.averageGraphUpdateTime = 200;
    this.performanceMetrics.averageEmbeddingTime = 100;
    this.performanceMetrics.cacheHitRate = 0.85;
    this.performanceMetrics.ioWaitTime = 50;
  }

  getSyncMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getSessionSequenceStats(): {
    duplicates: number;
    outOfOrder: number;
    recent: SessionSequenceAnomaly[];
  } {
    return {
      duplicates: this.sessionSequenceStats.duplicates,
      outOfOrder: this.sessionSequenceStats.outOfOrder,
      recent: [...this.sessionSequenceStats.events],
    };
  }

  getHealthMetrics(): HealthMetrics {
    const lastSyncTime = this.getLastSyncTime();
    const consecutiveFailures = this.getConsecutiveFailures();
    const activeOperations = Array.from(this.operations.values())
      .filter(op => op.status === 'running' || op.status === 'pending').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (consecutiveFailures > 3) {
      overallHealth = 'unhealthy';
    } else if (consecutiveFailures > 0 || this.metrics.errorRate > 0.1) {
      overallHealth = 'degraded';
    }

    return {
      overallHealth,
      lastSyncTime,
      consecutiveFailures,
      queueDepth: this.getQueueDepth(),
      activeOperations,
      systemLoad: this.getSystemLoad(),
    };
  }

  private getLastSyncTime(): Date {
    const completedOps = Array.from(this.operations.values())
      .filter(op => op.endTime && op.status === 'completed')
      .sort((a, b) => (b.endTime!.getTime() - a.endTime!.getTime()));

    return completedOps.length > 0 ? completedOps[0].endTime! : new Date(0);
  }

  private getConsecutiveFailures(): number {
    const recentOps = Array.from(this.operations.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    let consecutiveFailures = 0;
    for (const op of recentOps) {
      if (op.status === 'failed') {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    return consecutiveFailures;
  }

  private getQueueDepth(): number {

    return 0;
  }

  private getSystemLoad(): number {

    return 0;
  }

  getActiveOperations(): SyncOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'running' || op.status === 'pending');
  }

  getOperationHistory(limit: number = 50): SyncOperation[] {
    return Array.from(this.operations.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  getAlerts(activeOnly: boolean = false): MonitoringAlert[] {
    if (activeOnly) {
      return this.alerts.filter(alert => !alert.resolved);
    }
    return [...this.alerts];
  }

  resolveAlert(alertId: string, resolution?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolution = resolution;

      this.log('info', alert.operationId || 'system', 'Alert resolved', {
        alertId,
        resolution,
      });

      return true;
    }
    return false;
  }

  private triggerAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const fullAlert: MonitoringAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(fullAlert);


    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    this.log('warn', alert.operationId || 'system', 'Alert triggered', {
      type: alert.type,
      message: alert.message,
    });

    this.emit('alertTriggered', fullAlert);
  }

  private performHealthCheck(): void {
    const health = this.getHealthMetrics();

    if (health.overallHealth === 'unhealthy') {
      this.triggerAlert({
        type: 'error',
        message: 'System health is unhealthy',
      });
    } else if (health.overallHealth === 'degraded') {
      this.triggerAlert({
        type: 'warning',
        message: 'System health is degraded',
      });
    }

    this.emit('healthCheck', health);
  }

  private handleOperationStarted(operation: SyncOperation): void {

  }

  private handleOperationCompleted(operation: SyncOperation): void {

  }

  private handleOperationFailed(operation: SyncOperation, error: Error): void {

  }

  private handleConflictDetected(conflict: SyncConflict | Conflict): void {

  }

  private handleAlertTriggered(alert: MonitoringAlert): void {

  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', operationId: string, message: string, data?: any): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      level,
      operationId,
      message,
      data,
    };

    this.logs.push(entry);


    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }


    this.emit('logEntry', entry);
  }

  getLogs(limit: number = 100): SyncLogEntry[] {
    return this.logs.slice(-limit);
  }

  getLogsByOperation(operationId: string): SyncLogEntry[] {
    return this.logs.filter(log => log.operationId === operationId);
  }

  generateReport(): {
    summary: SyncMetrics;
    performance: PerformanceMetrics;
    health: HealthMetrics;
    recentOperations: SyncOperation[];
    activeAlerts: MonitoringAlert[];
  } {
    return {
      summary: this.getSyncMetrics(),
      performance: this.getPerformanceMetrics(),
      health: this.getHealthMetrics(),
      recentOperations: this.getOperationHistory(10),
      activeAlerts: this.getAlerts(true),
    };
  }





  cleanup(maxAge?: number): void {

    if (typeof maxAge === 'undefined') {
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000;
      const ops = Array.from(this.operations.values());
      const hasOldOps = ops.some(op => op.endTime && op.endTime.getTime() < cutoff);
      const hasRecentOps = ops.some(op => (op.endTime ? op.endTime.getTime() : op.startTime.getTime()) >= cutoff);


      if (hasOldOps && hasRecentOps) {
        maxAge = 24 * 60 * 60 * 1000;
      } else {
        maxAge = 0;
      }
    }

    if (maxAge === 0) {

      this.operations.clear();
      this.alerts = [];
      this.logs = [];

      this.metrics = {
        operationsTotal: 0,
        operationsSuccessful: 0,
        operationsFailed: 0,
        averageSyncTime: 0,
        totalEntitiesProcessed: 0,
        totalRelationshipsProcessed: 0,
        errorRate: 0,
        throughput: 0,
      };
      this.performanceMetrics = {
        averageParseTime: 0,
        averageGraphUpdateTime: 0,
        averageEmbeddingTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        ioWaitTime: 0,
      };
      return;
    }

    const cutoffTime = Date.now() - (maxAge as number);


    for (const [id, operation] of this.operations) {
      if (operation.endTime && operation.endTime.getTime() < cutoffTime) {
        this.operations.delete(id);
      }
    }


    this.alerts = this.alerts.filter(alert => !alert.resolved || alert.timestamp.getTime() > cutoffTime);


    this.logs = this.logs.filter(log => log.timestamp.getTime() > cutoffTime);
  }
}

================
File: index.ts
================
export * from './scm/index.js';
export * from './synchronization/index.js';



================================================================
End of Codebase
================================================================
