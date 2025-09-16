import { RelationshipType } from "../models/relationships.js";
export interface InferredEdgeFeatures {
    relationType: RelationshipType;
    toId: string;
    fromFileRel?: string;
    usedTypeChecker?: boolean;
    isExported?: boolean;
    nameLength?: number;
    importDepth?: number;
}
/**
 * Compute a confidence score (0..1) for an inferred relationship using simple, configurable weights.
 * Defaults are chosen to match prior constants so existing tests remain stable.
 */
export declare function scoreInferredEdge(features: InferredEdgeFeatures): number;
//# sourceMappingURL=confidence.d.ts.map