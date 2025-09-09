/**
 * Test helpers to generate FalkorDB-like graph rows
 */
export declare function makeNodeRow(props: Record<string, any>): {
    n: any[];
};
export declare function makeRelationshipRow(rel: {
    id: string;
    type: string;
    fromId: string;
    toId: string;
    created?: string;
    lastModified?: string;
    version?: number;
    metadata?: any;
}): {
    r: any[];
    fromId: string;
    toId: string;
};
//# sourceMappingURL=graph-fixtures.d.ts.map