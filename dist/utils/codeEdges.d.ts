import { GraphRelationship, RelationshipType, CodeEdgeSource } from '../models/relationships.js';
export declare function isCodeRelationship(type: RelationshipType): boolean;
export declare function normalizeSource(s?: string): CodeEdgeSource | undefined;
export declare function canonicalTargetKeyFor(rel: GraphRelationship): string;
export declare function normalizeCodeEdge<T extends GraphRelationship>(relIn: T): T;
export declare function canonicalRelationshipId(fromId: string, rel: GraphRelationship): string;
//# sourceMappingURL=codeEdges.d.ts.map