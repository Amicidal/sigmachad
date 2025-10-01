import path from "path";
import type {
  ConnectionSubscription,
  NormalizedSubscriptionFilter,
  WebSocketEvent,
  WebSocketFilter,
} from "@memento/shared-types";

type Collectable = string | string[] | undefined;

const collectStrings = (...values: Collectable[]): string[] => {
  const results: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const inner of value) {
        if (inner) {
          results.push(inner);
        }
      }
    } else {
      results.push(value);
    }
  }
  return results;
};

const normalizeExtension = (ext: string): string => {
  const trimmed = ext.trim();
  if (!trimmed) return trimmed;
  const lowered = trimmed.toLowerCase();
  return lowered.startsWith(".") ? lowered : `.${lowered}`;
};

const toLower = (value: string) => value.toLowerCase();

export const normalizeFilter = (
  filter?: WebSocketFilter
): NormalizedSubscriptionFilter | undefined => {
  if (!filter) {
    return undefined;
  }

  const paths = collectStrings(filter.path, filter.paths);
  const absolutePaths = paths.map((p) => path.resolve(p));

  const extensions = collectStrings(filter.extensions).map(normalizeExtension);

  const types = collectStrings(
    filter.type,
    filter.types,
    filter.changeType,
    filter.changeTypes
  )
    .map((t) => t.trim())
    .filter(Boolean)
    .map(toLower);

  const eventTypes = collectStrings(filter.eventTypes)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(toLower);

  const entityTypes = collectStrings(filter.entityType, filter.entityTypes)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(toLower);

  const relationshipTypes = collectStrings(
    filter.relationshipType,
    filter.relationshipTypes
  )
    .map((t) => t.trim())
    .filter(Boolean)
    .map(toLower);

  const sessionIds = collectStrings(filter.sessionId, filter.sessionIds)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const operationIds = collectStrings(filter.operationId, filter.operationIds)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const sessionEvents = collectStrings(filter.sessionEvents)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const sessionEdgeTypes = collectStrings(filter.sessionEdgeTypes)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return {
    paths,
    absolutePaths,
    extensions,
    types,
    eventTypes,
    entityTypes,
    relationshipTypes,
    sessionIds,
    operationIds,
    sessionEvents,
    sessionEdgeTypes,
  };
};

const pathMatchesAbsolute = (prefixes: string[], candidate?: string): boolean => {
  if (!candidate) {
    return false;
  }

  const normalizedCandidate = path.resolve(candidate);
  for (const prefix of prefixes) {
    const normalizedPrefix = path.resolve(prefix);
    if (normalizedCandidate === normalizedPrefix) {
      return true;
    }
    if (
      normalizedCandidate.startsWith(
        normalizedPrefix.endsWith(path.sep)
          ? normalizedPrefix
          : `${normalizedPrefix}${path.sep}`
      )
    ) {
      return true;
    }
  }
  return false;
};

const matchesFileChange = (
  filter: NormalizedSubscriptionFilter,
  event: WebSocketEvent
): boolean => {
  const change = event.data || {};
  const changeType: string = (change.type || change.changeType || "")
    .toString()
    .toLowerCase();

  if (filter.types.length > 0 && !filter.types.includes(changeType)) {
    return false;
  }

  const candidatePath: string | undefined =
    typeof change.absolutePath === "string"
      ? change.absolutePath
      : typeof change.path === "string"
      ? path.resolve(process.cwd(), change.path)
      : undefined;

  if (
    filter.absolutePaths.length > 0 &&
    !pathMatchesAbsolute(filter.absolutePaths, candidatePath)
  ) {
    return false;
  }

  if (filter.extensions.length > 0) {
    const target =
      typeof change.path === "string"
        ? change.path
        : typeof change.absolutePath === "string"
        ? change.absolutePath
        : undefined;
    if (!target) {
      return false;
    }
    const extension = path.extname(target).toLowerCase();
    if (!filter.extensions.includes(extension)) {
      return false;
    }
  }

  return true;
};

const matchesEntityEvent = (
  filter: NormalizedSubscriptionFilter,
  event: WebSocketEvent
): boolean => {
  if (filter.entityTypes.length === 0) {
    return true;
  }

  const candidate =
    (event.data?.type || event.data?.entityType || "")
      .toString()
      .toLowerCase();

  if (!candidate) {
    return false;
  }

  return filter.entityTypes.includes(candidate);
};

const matchesRelationshipEvent = (
  filter: NormalizedSubscriptionFilter,
  event: WebSocketEvent
): boolean => {
  if (filter.relationshipTypes.length === 0) {
    return true;
  }

  const candidate =
    (event.data?.type || event.data?.relationshipType || "")
      .toString()
      .toLowerCase();

  if (!candidate) {
    return false;
  }

  return filter.relationshipTypes.includes(candidate);
};

const matchesSessionEvent = (
  filter: NormalizedSubscriptionFilter,
  event: WebSocketEvent
): boolean => {
  const payload = (event.data ?? {}) as Record<string, unknown>;
  const rawSessionId =
    typeof payload.sessionId === "string"
      ? payload.sessionId
      : typeof (payload as any).session_id === "string"
      ? (payload as any).session_id
      : undefined;

  const normalizedSessionId = rawSessionId?.toLowerCase();
  if (filter.sessionIds.length > 0) {
    if (!normalizedSessionId || !filter.sessionIds.includes(normalizedSessionId)) {
      return false;
    }
  }

  const rawOperationId =
    typeof payload.operationId === "string"
      ? payload.operationId
      : typeof (payload as any).operation_id === "string"
      ? (payload as any).operation_id
      : undefined;
  const normalizedOperationId = rawOperationId?.toLowerCase();
  if (filter.operationIds.length > 0) {
    if (!normalizedOperationId || !filter.operationIds.includes(normalizedOperationId)) {
      return false;
    }
  }

  const eventName =
    typeof payload.event === "string"
      ? payload.event.toLowerCase()
      : undefined;
  if (filter.sessionEvents.length > 0) {
    if (!eventName || !filter.sessionEvents.includes(eventName)) {
      return false;
    }
  }

  if (filter.sessionEdgeTypes.length > 0) {
    const relationships = Array.isArray((payload as any).relationships)
      ? ((payload as any).relationships as any[])
      : [];
    const matchesEdge = relationships.some((rel) => {
      const relType =
        typeof rel?.type === "string"
          ? String(rel.type).toLowerCase()
          : typeof rel?.relationshipType === "string"
          ? String(rel.relationshipType).toLowerCase()
          : undefined;
      return !!relType && filter.sessionEdgeTypes.includes(relType);
    });
    if (!matchesEdge) {
      return false;
    }
  }

  return true;
};

export const matchesEvent = (
  subscription: ConnectionSubscription,
  event: WebSocketEvent
): boolean => {
  const normalized = subscription.normalizedFilter;
  if (!normalized) {
    return true;
  }

  const eventType = event.type?.toLowerCase?.() ?? "";
  if (normalized.eventTypes.length > 0 && !normalized.eventTypes.includes(eventType)) {
    return false;
  }

  if (event.type === "file_change") {
    return matchesFileChange(normalized, event);
  }

  if (event.type.startsWith("entity_")) {
    return matchesEntityEvent(normalized, event);
  }

  if (event.type.startsWith("relationship_")) {
    return matchesRelationshipEvent(normalized, event);
  }

  if (event.type === "session_event") {
    return matchesSessionEvent(normalized, event);
  }

  return true;
};
