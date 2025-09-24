import { GraphRelationship, RelationshipType, CodeEdgeSource, EdgeEvidence } from "../models/relationships.js";
export declare function mergeEdgeEvidence(a?: EdgeEvidence[], b?: EdgeEvidence[], limit?: number): EdgeEvidence[];
export declare function mergeEdgeLocations(a?: Array<{
    path?: string;
    line?: number;
    column?: number;
}>, b?: Array<{
    path?: string;
    line?: number;
    column?: number;
}>, limit?: number): Array<{
    path?: string;
    line?: number;
    column?: number;
}>;
export declare function isCodeRelationship(type: RelationshipType): boolean;
export declare function normalizeSource(s?: string): CodeEdgeSource | undefined;
export declare function canonicalTargetKeyFor(rel: GraphRelationship): string;
export declare function normalizeCodeEdge<T extends GraphRelationship>(relIn: T): T;
export declare function canonicalRelationshipId(fromId: string, rel: GraphRelationship): string;
export declare function legacyStructuralRelationshipId(canonicalId: string, rel: GraphRelationship): string | null;
export declare function normalizeMetricIdForId(value: any): string;
//# sourceMappingURL=codeEdges.d.ts.map