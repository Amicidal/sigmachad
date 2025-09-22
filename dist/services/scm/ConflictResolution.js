/**
 * Conflict Resolution Service
 * Handles conflicts during graph synchronization operations
 */
import crypto from "crypto";
export class ConflictResolution {
    constructor(kgService) {
        this.kgService = kgService;
        this.conflicts = new Map();
        this.mergeStrategies = [];
        this.conflictListeners = new Set();
        this.manualOverrides = new Map();
        this.initializeDefaultStrategies();
    }
    initializeDefaultStrategies() {
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
                const current = conflict.conflictingValues.current;
                const incoming = conflict.conflictingValues.incoming;
                const merged = { ...current };
                if (incoming.hash) {
                    merged.hash = incoming.hash;
                }
                if (incoming.metadata && current.metadata) {
                    merged.metadata = { ...current.metadata, ...incoming.metadata };
                }
                else if (incoming.metadata) {
                    merged.metadata = incoming.metadata;
                }
                if (incoming.lastModified &&
                    current.lastModified &&
                    incoming.lastModified > current.lastModified) {
                    merged.lastModified = incoming.lastModified;
                }
                else if (incoming.lastModified) {
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
    addMergeStrategy(strategy) {
        this.mergeStrategies.push(strategy);
        this.mergeStrategies.sort((a, b) => b.priority - a.priority);
    }
    async detectConflicts(incomingEntities, incomingRelationships) {
        const detected = [];
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
            const conflictId = this.generateConflictId("entity_version", incomingEntity.id, diffResult.signature);
            const conflict = this.upsertConflict(conflictId, {
                type: "entity_version",
                entityId: incomingEntity.id,
                description: this.describeDiff("Entity", incomingEntity.id, diffResult.diff),
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
            const existingRelationship = await this.kgService.getRelationshipById(normalizedIncoming.id);
            if (!existingRelationship) {
                continue; // New relationship; no divergence to report
            }
            const diffResult = this.computeRelationshipDiff(existingRelationship, normalizedIncoming);
            if (!diffResult) {
                continue;
            }
            if (this.manualOverrides.has(diffResult.signature)) {
                continue;
            }
            const conflictId = this.generateConflictId("relationship_conflict", normalizedIncoming.id, diffResult.signature);
            const conflict = this.upsertConflict(conflictId, {
                type: "relationship_conflict",
                relationshipId: normalizedIncoming.id,
                description: this.describeDiff("Relationship", normalizedIncoming.id, diffResult.diff),
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
    async resolveConflict(conflictId, resolution) {
        const conflict = this.conflicts.get(conflictId);
        if (!conflict || conflict.resolved) {
            return false;
        }
        const resolutionResult = {
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
    async resolveConflictsAuto(conflicts) {
        const resolutions = [];
        for (const conflict of conflicts) {
            const resolution = await this.resolveConflictAuto(conflict);
            if (resolution) {
                resolutions.push(resolution);
            }
        }
        return resolutions;
    }
    async resolveConflictAuto(conflict) {
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
            }
            catch (error) {
                console.warn(`Strategy ${strategy.name} failed for conflict ${conflict.id}:`, error);
            }
        }
        return null;
    }
    getUnresolvedConflicts() {
        return Array.from(this.conflicts.values()).filter((c) => !c.resolved);
    }
    getResolvedConflicts() {
        return Array.from(this.conflicts.values()).filter((c) => c.resolved);
    }
    getConflict(conflictId) {
        return this.conflicts.get(conflictId) || null;
    }
    getConflictsForEntity(entityId) {
        return Array.from(this.conflicts.values()).filter((c) => c.entityId === entityId && !c.resolved);
    }
    addConflictListener(listener) {
        this.conflictListeners.add(listener);
    }
    removeConflictListener(listener) {
        this.conflictListeners.delete(listener);
    }
    notifyConflictListeners(conflict) {
        for (const listener of this.conflictListeners) {
            try {
                listener(conflict);
            }
            catch (error) {
                console.error("Error in conflict listener:", error);
            }
        }
    }
    clearResolvedConflicts() {
        for (const [id, conflict] of this.conflicts) {
            if (conflict.resolved) {
                this.conflicts.delete(id);
            }
        }
    }
    getConflictStatistics() {
        const allConflicts = Array.from(this.conflicts.values());
        const resolved = allConflicts.filter((c) => c.resolved);
        const unresolved = allConflicts.filter((c) => !c.resolved);
        const byType = {};
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
    computeEntityDiff(current, incoming) {
        const normalizedCurrent = this.prepareForDiff(current, ConflictResolution.ENTITY_DIFF_IGNORES);
        const normalizedIncoming = this.prepareForDiff(incoming, ConflictResolution.ENTITY_DIFF_IGNORES);
        const diff = this.computeObjectDiff(normalizedCurrent, normalizedIncoming);
        if (Object.keys(diff).length === 0) {
            return null;
        }
        const signature = this.generateSignature("entity_version", incoming.id, diff);
        return { diff, signature };
    }
    computeRelationshipDiff(current, incoming) {
        const normalizedCurrent = this.prepareForDiff(current, ConflictResolution.RELATIONSHIP_DIFF_IGNORES);
        const normalizedIncoming = this.prepareForDiff(incoming, ConflictResolution.RELATIONSHIP_DIFF_IGNORES);
        const diff = this.computeObjectDiff(normalizedCurrent, normalizedIncoming);
        if (Object.keys(diff).length === 0) {
            return null;
        }
        const signature = this.generateSignature("relationship_conflict", incoming.id || current.id || "", diff);
        return { diff, signature };
    }
    prepareForDiff(source, ignoreKeys) {
        const prepared = {};
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
    prepareValue(value, ignoreKeys) {
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
            const obj = {};
            for (const [k, v] of value.entries()) {
                obj[k] = this.prepareValue(v, ignoreKeys);
            }
            return obj;
        }
        if (typeof value === "object") {
            const entries = Object.entries(value)
                .filter(([k]) => !ignoreKeys.has(k))
                .sort(([a], [b]) => a.localeCompare(b));
            const obj = {};
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
    computeObjectDiff(current, incoming, path = []) {
        const diff = {};
        const keys = new Set([
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
            if (currentValue &&
                incomingValue &&
                typeof currentValue === "object" &&
                typeof incomingValue === "object" &&
                !Array.isArray(currentValue) &&
                !Array.isArray(incomingValue)) {
                Object.assign(diff, this.computeObjectDiff(currentValue, incomingValue, currentPath));
            }
            else {
                diff[currentPath.join(".")] = {
                    current: currentValue,
                    incoming: incomingValue,
                };
            }
        }
        return diff;
    }
    deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (typeof a === "object" && typeof b === "object") {
            return JSON.stringify(a) === JSON.stringify(b);
        }
        return false;
    }
    generateSignature(type, targetId, diff) {
        const serializedDiff = Object.keys(diff)
            .sort()
            .map((key) => `${key}:${JSON.stringify(diff[key])}`)
            .join("|");
        return crypto
            .createHash("sha256")
            .update(`${type}|${targetId}|${serializedDiff}`)
            .digest("hex");
    }
    generateConflictId(type, targetId, signature) {
        const hash = crypto
            .createHash("sha1")
            .update(`${type}|${targetId}|${signature}`)
            .digest("hex");
        return `conflict_${type}_${hash}`;
    }
    upsertConflict(conflictId, data) {
        const existing = this.conflicts.get(conflictId);
        const now = new Date();
        if (existing &&
            !existing.resolved &&
            this.diffEquals(existing.diff, data.diff)) {
            existing.timestamp = now;
            existing.conflictingValues = data.conflictingValues;
            existing.description = data.description;
            existing.diff = data.diff;
            existing.signature = data.signature;
            return existing;
        }
        const conflict = {
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
    diffEquals(a, b) {
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
    describeDiff(prefix, identifier, diff) {
        const fields = Object.keys(diff).join(", ");
        return `${prefix} ${identifier} has divergence in: ${fields || "values"}`;
    }
    async applyResolution(conflict, resolution) {
        var _a, _b;
        try {
            switch (resolution.strategy) {
                case "overwrite":
                case "merge": {
                    if (conflict.entityId) {
                        const payload = (_a = resolution.resolvedValue) !== null && _a !== void 0 ? _a : conflict.conflictingValues.incoming;
                        if (!payload) {
                            throw new Error(`No resolved value provided for conflict ${conflict.id}`);
                        }
                        await this.kgService.updateEntity(conflict.entityId, payload);
                    }
                    else if (conflict.relationshipId) {
                        const payload = (_b = resolution.resolvedValue) !== null && _b !== void 0 ? _b : conflict.conflictingValues.incoming;
                        if (!payload) {
                            throw new Error(`No relationship payload provided for conflict ${conflict.id}`);
                        }
                        await this.kgService.upsertRelationship(this.normalizeRelationshipInput(payload));
                    }
                    break;
                }
                case "skip":
                    // Intentionally skip applying the incoming change
                    break;
                case "manual": {
                    if (resolution.resolvedValue) {
                        if (conflict.entityId) {
                            await this.kgService.updateEntity(conflict.entityId, resolution.resolvedValue);
                        }
                        else if (conflict.relationshipId) {
                            await this.kgService.upsertRelationship(this.normalizeRelationshipInput(resolution.resolvedValue));
                        }
                    }
                    break;
                }
                default:
                    throw new Error(`Unsupported resolution strategy: ${resolution.strategy}`);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to apply conflict resolution for ${conflict.id}:`, error);
            return false;
        }
    }
    recordManualOverride(conflict, resolution) {
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
    normalizeRelationshipInput(relationship) {
        var _a, _b;
        const rel = { ...relationship };
        rel.fromEntityId = (_a = rel.fromEntityId) !== null && _a !== void 0 ? _a : rel.sourceId;
        rel.toEntityId = (_b = rel.toEntityId) !== null && _b !== void 0 ? _b : rel.targetId;
        delete rel.sourceId;
        delete rel.targetId;
        if (rel.fromEntityId && rel.toEntityId && rel.type) {
            return this.kgService.canonicalizeRelationship(rel);
        }
        return rel;
    }
}
ConflictResolution.ENTITY_DIFF_IGNORES = new Set([
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
ConflictResolution.RELATIONSHIP_DIFF_IGNORES = new Set([
    "created",
    "firstSeenAt",
    "lastSeenAt",
    "version",
    "occurrencesScan",
    "occurrencesTotal",
]);
//# sourceMappingURL=ConflictResolution.js.map