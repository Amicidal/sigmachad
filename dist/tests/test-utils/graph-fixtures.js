/**
 * Test helpers to generate FalkorDB-like graph rows
 */
export function makeNodeRow(props) {
    const entries = [];
    // Basic props
    for (const [k, v] of Object.entries(props)) {
        entries.push([k, v]);
    }
    return { n: entries };
}
export function makeRelationshipRow(rel) {
    const relEntries = [
        ['id', rel.id],
        ['type', rel.type],
    ];
    if (rel.created)
        relEntries.push(['created', rel.created]);
    if (rel.lastModified)
        relEntries.push(['lastModified', rel.lastModified]);
    if (typeof rel.version === 'number')
        relEntries.push(['version', rel.version]);
    if (rel.metadata !== undefined)
        relEntries.push(['metadata', JSON.stringify(rel.metadata)]);
    return {
        r: relEntries,
        fromId: rel.fromId,
        toId: rel.toId,
    };
}
//# sourceMappingURL=graph-fixtures.js.map