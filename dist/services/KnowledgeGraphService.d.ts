/**
 * Knowledge Graph Service for Memento
 * Manages graph operations, vector embeddings, and entity relationships
 */
import { DatabaseService } from "./DatabaseService.js";
import { Entity } from "../models/entities.js";
import { GraphRelationship, RelationshipType, RelationshipQuery, PathQuery, TraversalQuery, DocumentationQuality } from "../models/relationships.js";
import { GraphSearchRequest, GraphExamples, DependencyAnalysis, TimeRangeParams } from "../models/types.js";
import { EventEmitter } from "events";
export declare class KnowledgeGraphService extends EventEmitter {
    private db;
    private searchCache;
    private entityCache;
    private _lastPruneSummary;
    constructor(db: DatabaseService);
    private dualWriteAuxiliaryForEdge;
    /**
     * Phase 3: Compute and store lightweight materialized edge stats for an entity.
     */
    computeAndStoreEdgeStats(entityId: string): Promise<void>;
    private dedupeBy;
    private mergeEvidenceArrays;
    private mergeLocationsArrays;
    private unifyResolvedEdgePlaceholders;
    private normalizeRelationship;
    private normalizeDocumentationEdge;
    private normalizeDocSource;
    private normalizeDocIntent;
    private normalizeCoverageScope;
    private normalizeDocumentationQuality;
    private normalizePolicyType;
    private normalizeDomainRelationship;
    private normalizeSectionAnchor;
    private normalizeDomainPath;
    private normalizeSummary;
    private normalizeStringArray;
    private normalizeString;
    private normalizeLocale;
    private clamp01;
    private clampRange;
    private toDate;
    private harmonizeRefFields;
    private inferRefKindFromId;
    private parseFileSymbolFromId;
    private canonicalRelationshipId;
    private directoryDistance;
    private isHistoryEnabled;
    /**
     * Append a compact version snapshot for an entity when its content changes.
     * Stub: returns a generated version id without writing to the graph.
     */
    appendVersion(entity: Entity, opts?: {
        changeSetId?: string;
        timestamp?: Date;
    }): Promise<string>;
    /**
     * Open (or create) a relationship with a validity interval starting at ts.
     * Stub: logs intent; no-op.
     */
    openEdge(fromId: string, toId: string, type: RelationshipType, ts?: Date, changeSetId?: string): Promise<void>;
    /**
     * Close a relationship's validity interval at ts.
     * Stub: logs intent; no-op.
     */
    closeEdge(fromId: string, toId: string, type: RelationshipType, ts?: Date): Promise<void>;
    /**
     * Create a checkpoint subgraph descriptor and (in full impl) link members.
     * Stub: returns a generated checkpointId.
     */
    createCheckpoint(seedEntities: string[], reason: "daily" | "incident" | "manual", hops: number, window?: TimeRangeParams): Promise<{
        checkpointId: string;
    }>;
    /**
     * Prune history artifacts older than the retention window.
     * Stub: returns zeros.
     */
    pruneHistory(retentionDays: number, opts?: {
        dryRun?: boolean;
    }): Promise<{
        versionsDeleted: number;
        edgesClosed: number;
        checkpointsDeleted: number;
    }>;
    /** Aggregate history-related metrics for admin */
    getHistoryMetrics(): Promise<{
        versions: number;
        checkpoints: number;
        checkpointMembers: {
            avg: number;
            min: number;
            max: number;
        };
        temporalEdges: {
            open: number;
            closed: number;
        };
        lastPrune?: {
            retentionDays: number;
            cutoff: string;
            versions: number;
            closedEdges: number;
            checkpoints: number;
            dryRun?: boolean;
        } | null;
        totals: {
            nodes: number;
            relationships: number;
        };
    }>;
    /** Inspect database indexes and evaluate expected coverage. */
    getIndexHealth(): Promise<{
        supported: boolean;
        indexes?: any[];
        expected: {
            file_path: boolean;
            symbol_path: boolean;
            version_entity: boolean;
            checkpoint_id: boolean;
            rel_validFrom: boolean;
            rel_validTo: boolean;
        };
        notes?: string[];
    }>;
    /** Run quick, non-destructive micro-benchmarks for common queries. */
    runBenchmarks(options?: {
        mode?: 'quick' | 'full';
    }): Promise<{
        mode: 'quick' | 'full';
        totals: {
            nodes: number;
            edges: number;
        };
        timings: Record<string, number>;
        samples: Record<string, any>;
    }>;
    /** Ensure graph indexes for common queries (best-effort across dialects). */
    ensureGraphIndexes(): Promise<void>;
    /**
     * List checkpoints with optional filters and pagination.
     * Returns an array of checkpoint entities and the total count matching filters.
     */
    listCheckpoints(options?: {
        reason?: string;
        since?: Date | string;
        until?: Date | string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: any[];
        total: number;
    }>;
    /** Get a checkpoint node by id. */
    getCheckpoint(id: string): Promise<Entity | null>;
    /** Get members of a checkpoint with pagination. */
    getCheckpointMembers(id: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<{
        items: Entity[];
        total: number;
    }>;
    /**
     * Time-scoped traversal starting from a node, filtering relationships by validFrom/validTo.
     * atTime: edges active at a specific moment.
     * since/until: edges overlapping a time window.
     */
    timeTravelTraversal(query: {
        startId: string;
        atTime?: Date | string;
        since?: Date | string;
        until?: Date | string;
        maxDepth?: number;
        types?: string[];
    }): Promise<{
        entities: Entity[];
        relationships: GraphRelationship[];
    }>;
    /** Delete a checkpoint node and its include edges. */
    deleteCheckpoint(id: string): Promise<boolean>;
    /** Compute summary statistics for a checkpoint. */
    getCheckpointSummary(id: string): Promise<{
        totalMembers: number;
        entityTypeCounts: Array<{
            type: string;
            count: number;
        }>;
        relationshipTypeCounts: Array<{
            type: string;
            count: number;
        }>;
    } | null>;
    /** Find recently modified entities (by lastModified property) */
    findRecentEntityIds(since: Date, limit?: number): Promise<string[]>;
    /** Export a checkpoint to a portable JSON structure. */
    exportCheckpoint(id: string, options?: {
        includeRelationships?: boolean;
    }): Promise<{
        checkpoint: any;
        members: Entity[];
        relationships?: GraphRelationship[];
    } | null>;
    /** Import a checkpoint JSON; returns new checkpoint id and stats. */
    importCheckpoint(data: {
        checkpoint: any;
        members: Array<Entity | {
            id: string;
        }>;
        relationships?: Array<GraphRelationship>;
    }, options?: {
        useOriginalId?: boolean;
    }): Promise<{
        checkpointId: string;
        linked: number;
        missing: number;
    }>;
    initialize(): Promise<void>;
    private hasCodebaseProperties;
    createEntity(entity: Entity, options?: {
        skipEmbedding?: boolean;
    }): Promise<void>;
    /**
     * Create many entities in a small number of graph queries.
     * Groups by primary label (entity.type) and uses UNWIND + SET n += row.
     */
    createEntitiesBulk(entities: Entity[], options?: {
        skipEmbedding?: boolean;
    }): Promise<void>;
    private getEntityLabel;
    getEntity(entityId: string): Promise<Entity | null>;
    updateEntity(entityId: string, updates: Partial<Entity>, options?: {
        skipEmbedding?: boolean;
    }): Promise<void>;
    createOrUpdateEntity(entity: Entity): Promise<void>;
    deleteEntity(entityId: string): Promise<void>;
    deleteRelationship(relationshipId: string): Promise<void>;
    createRelationship(relationship: GraphRelationship | string, toEntityId?: string, type?: RelationshipType, options?: {
        validate?: boolean;
    }): Promise<void>;
    /**
     * Mark code relationships as inactive if not seen since the provided cutoff.
     * Optionally restrict by file path (to_ref_file) to limit scope after parsing a file.
     */
    markInactiveEdgesNotSeenSince(cutoff: Date, opts?: {
        toRefFile?: string;
    }): Promise<number>;
    updateDocumentationFreshness(docId: string, opts: {
        lastValidated: Date;
        documentationQuality?: DocumentationQuality;
        updatedFromDocAt?: Date;
    }): Promise<number>;
    markDocumentationAsStale(cutoff: Date, excludeDocIds?: string[]): Promise<number>;
    markEntityDocumentationOutdated(entityId: string, opts?: {
        reason?: string;
        staleSince?: Date;
    }): Promise<number>;
    /**
     * Best-effort index creation to accelerate common queries.
     * Guarded to avoid failures on engines that do not support these syntaxes.
     */
    ensureIndices(): Promise<void>;
    /**
     * Upsert evidence and lightweight fields for existing relationships by id.
     * Intended for incremental sync to keep occurrences, evidence, locations, and lastSeenAt updated.
     */
    upsertEdgeEvidenceBulk(rels: Array<GraphRelationship & {
        toEntityId?: string;
    }>): Promise<void>;
    getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    /**
     * Finalize a scan by deactivating code edges not observed during this scan window.
     * Edges with lastSeenAt < scanStartedAt are set active=false. When history is enabled,
     * also set validTo for those edges if not already closed.
     */
    finalizeScan(scanStartedAt: Date): Promise<{
        deactivated: number;
    }>;
    queryRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
    getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
    /**
     * Create many relationships in one round-trip per relationship type.
     * Validation is optional (defaults to false for performance in sync paths).
     */
    createRelationshipsBulk(relationships: GraphRelationship[], options?: {
        validate?: boolean;
    }): Promise<void>;
    private unifyResolvedEdgesBatch;
    getEdgeEvidenceNodes(edgeId: string, limit?: number): Promise<Array<{
        id: string;
        edgeId: string;
        source?: string;
        confidence?: number;
        path?: string;
        line?: number;
        column?: number;
        note?: string;
        extractorVersion?: string;
        createdAt?: string;
        updatedAt?: string;
    }>>;
    getEdgeSites(edgeId: string, limit?: number): Promise<Array<{
        id: string;
        edgeId: string;
        siteId?: string;
        path?: string;
        line?: number;
        column?: number;
        accessPath?: string;
        updatedAt?: string;
    }>>;
    getEdgeCandidates(edgeId: string, limit?: number): Promise<Array<{
        id: string;
        edgeId: string;
        candidateId?: string;
        name?: string;
        path?: string;
        resolver?: string;
        score?: number;
        rank?: number;
        updatedAt?: string;
    }>>;
    search(request: GraphSearchRequest): Promise<Entity[]>;
    private entityMatchesRequestedTypes;
    /**
     * Clear search cache
     */
    private clearSearchCache;
    /**
     * Invalidate cache entries related to an entity
     */
    private invalidateEntityCache;
    /**
     * Find entities by type
     */
    findEntitiesByType(entityType: string): Promise<Entity[]>;
    /**
     * Find symbol entities by exact name
     */
    findSymbolsByName(name: string, limit?: number): Promise<Entity[]>;
    /**
     * Find symbol by kind and name (e.g., class/interface/function)
     */
    findSymbolByKindAndName(kind: string, name: string, limit?: number): Promise<Entity[]>;
    /**
     * Find a symbol defined in a specific file by name
     */
    findSymbolInFile(filePath: string, name: string): Promise<Entity | null>;
    /**
     * Find symbols by name that are "nearby" a given file, using directory prefix.
     * This helps resolve placeholders by preferring local modules over global matches.
     */
    findNearbySymbols(filePath: string, name: string, limit?: number): Promise<Entity[]>;
    /**
     * Get a file entity by path
     */
    getFileByPath(path: string): Promise<Entity | null>;
    private semanticSearch;
    private structuralSearch;
    getEntityExamples(entityId: string): Promise<GraphExamples | null>;
    getEntityDependencies(entityId: string): Promise<DependencyAnalysis | null>;
    findPaths(query: PathQuery): Promise<any[]>;
    traverseGraph(query: TraversalQuery): Promise<Entity[]>;
    createEmbeddingsBatch(entities: Entity[], options?: {
        checkpointId?: string;
    }): Promise<void>;
    private createEmbedding;
    private updateEmbedding;
    private deleteEmbedding;
    private generateEmbedding;
    private getEntityLabels;
    private sanitizeProperties;
    private parseEntityFromGraph;
    private parseRelationshipFromGraph;
    private getEntityContentForEmbedding;
    private getEmbeddingCollection;
    private getEntitySignature;
    listEntities(options?: {
        type?: string;
        language?: string;
        path?: string;
        tags?: string[];
        limit?: number;
        offset?: number;
    }): Promise<{
        entities: Entity[];
        total: number;
    }>;
    getEntitiesByFile(filePath: string, options?: {
        includeSymbols?: boolean;
    }): Promise<Entity[]>;
    listRelationships(options?: {
        fromEntity?: string;
        toEntity?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        relationships: GraphRelationship[];
        total: number;
    }>;
    private stringToNumericId;
    private sanitizeParameterName;
}
//# sourceMappingURL=KnowledgeGraphService.d.ts.map