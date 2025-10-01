/**
 * Test helpers to generate Neo4j graph rows compatible with legacy FalkorDB command wrappers
 */

export function makeNodeRow(props: Record<string, any>) {
  const entries: any[] = [];
  // Basic props
  for (const [k, v] of Object.entries(props)) {
    entries.push([k, v]);
  }
  return { n: entries };
}

export function makeRelationshipRow(rel: {
  id: string;
  type: string;
  fromId: string;
  toId: string;
  created?: string;
  lastModified?: string;
  version?: number;
  metadata?: any;
}) {
  const relEntries: any[] = [
    ['id', rel.id],
    ['type', rel.type],
  ];
  if (rel.created) relEntries.push(['created', rel.created]);
  if (rel.lastModified) relEntries.push(['lastModified', rel.lastModified]);
  if (typeof rel.version === 'number') relEntries.push(['version', rel.version]);
  if (rel.metadata !== undefined) relEntries.push(['metadata', JSON.stringify(rel.metadata)]);

  return {
    r: relEntries,
    fromId: rel.fromId,
    toId: rel.toId,
  };
}
