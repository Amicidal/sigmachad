/**
 * Conflict Resolution Service
 * Handles conflicts during graph synchronization operations
 */

import crypto from "crypto";
import { Entity } from "../models/entities.js";
import { GraphRelationship } from "../models/relationships.js";
import { KnowledgeGraphService } from "./KnowledgeGraphService.js";

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
    // Strategy 1: Last Write Wins (highest priority)
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

    // Strategy 2: Merge properties (for entity conflicts)
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

    // Strategy 3: Skip on deletion conflicts
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
        continue; // New relationship; no divergence to report
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
          // Intentionally skip applying the incoming change
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
