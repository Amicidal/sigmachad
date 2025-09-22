import { RelationshipType, type StructuralImportType } from "../../models/relationships.js";
export interface StructuralPersistenceFields {
    importAlias: string | null;
    importType: StructuralImportType | null;
    isNamespace: boolean | null;
    isReExport: boolean | null;
    reExportTarget: string | null;
    language: string | null;
    symbolKind: string | null;
    modulePath: string | null;
    resolutionState: string | null;
    importDepth: number | null;
    confidence: number | null;
    scope: string | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
}
export declare const extractStructuralPersistenceFields: (topLevel: Record<string, any>, metadata: Record<string, any>) => StructuralPersistenceFields;
export declare const stableStringifyMetadata: (value: Record<string, any>) => string;
export interface StructuralRelationshipSnapshot {
    id: string;
    type: RelationshipType | string;
    fromId: string;
    toId: string;
    created?: string | Date | null;
    lastModified?: string | Date | null;
    version?: number | null;
    importAlias?: unknown;
    importType?: unknown;
    isNamespace?: unknown;
    isReExport?: unknown;
    reExportTarget?: unknown;
    language?: unknown;
    symbolKind?: unknown;
    modulePath?: unknown;
    resolutionState?: unknown;
    importDepth?: unknown;
    confidence?: unknown;
    scope?: unknown;
    firstSeenAt?: unknown;
    lastSeenAt?: unknown;
    metadata?: unknown;
}
export interface StructuralBackfillUpdate {
    payload: {
        id: string;
        importAlias: string | null;
        importType: StructuralImportType | null;
        isNamespace: boolean | null;
        isReExport: boolean | null;
        reExportTarget: string | null;
        language: string | null;
        symbolKind: string | null;
        modulePath: string | null;
        resolutionState: string | null;
        importDepth: number | null;
        confidence: number | null;
        scope: string | null;
        firstSeenAt: string | null;
        lastSeenAt: string | null;
        metadata: string;
    };
    changedFields: string[];
}
export declare const computeStructuralBackfillUpdate: (snapshot: StructuralRelationshipSnapshot) => StructuralBackfillUpdate | null;
//# sourceMappingURL=structuralPersistence.d.ts.map