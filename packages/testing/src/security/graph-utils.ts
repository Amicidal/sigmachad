export type GraphCapableDatabase = {
  graphQuery?: (query: string, params?: Record<string, unknown>) => Promise<any>;
  graphCommand?: (command: string, ...args: unknown[]) => Promise<any>;
  falkordbQuery?: (query: string, params?: Record<string, unknown>) => Promise<any>;
  falkordbCommand?: (command: string, ...args: unknown[]) => Promise<any>;
  getConfig?: () => any;
};

export async function graphQuery(
  db: GraphCapableDatabase,
  query: string,
  params?: Record<string, unknown>
): Promise<any> {
  if (typeof db?.graphQuery === 'function') {
    const result = await db.graphQuery(query, params);
    if (
      result &&
      typeof result === 'object' &&
      ('data' in result || 'headers' in result)
    ) {
      const headers = Array.isArray((result as any).headers)
        ? ((result as any).headers as string[])
        : undefined;
      const rows = Array.isArray((result as any).data)
        ? (result as any).data
        : [];
      if (headers && headers.length > 0) {
        return rows.map((row: unknown[]) =>
          headers.reduce((acc: Record<string, unknown>, header, index) => {
            acc[header] = Array.isArray(row) ? row[index] : undefined;
            return acc;
          }, {} as Record<string, unknown>)
        );
      }
      return rows;
    }
    return result;
  }
  if (typeof db?.falkordbQuery === 'function') {
    return db.falkordbQuery(query, params);
  }
  throw new Error('Database does not implement graphQuery');
}

export async function graphCommand(
  db: GraphCapableDatabase,
  command: string,
  ...args: unknown[]
): Promise<any> {
  if (typeof db?.graphCommand === 'function') {
    return db.graphCommand(command, ...args);
  }
  if (typeof db?.falkordbCommand === 'function') {
    return db.falkordbCommand(command, ...args);
  }
  throw new Error('Database does not implement graphCommand');
}

export function getGraphNamespace(
  db: GraphCapableDatabase,
  fallback = 'memento'
): string {
  const config = typeof db?.getConfig === 'function' ? db.getConfig() : undefined;
  return (
    config?.neo4j?.graphKey ??
    config?.neo4j?.database ??
    config?.falkordb?.graphKey ??
    fallback
  );
}
