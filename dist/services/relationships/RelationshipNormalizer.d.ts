import { GraphRelationship } from "../../models/relationships.js";
export type StructuralLanguageAdapter = (relationship: GraphRelationship & {
    metadata?: Record<string, any>;
}) => void;
export declare function registerStructuralAdapter(adapter: StructuralLanguageAdapter): void;
export declare function normalizeStructuralRelationship(relIn: GraphRelationship): GraphRelationship;
//# sourceMappingURL=RelationshipNormalizer.d.ts.map