import { describe, it, expect } from 'vitest';
import { DirectoryHandler } from '@memento/knowledge';
import { RelationshipType } from '@memento/shared-types';

describe('DirectoryHandler.createDirectoryHierarchy', () => {
  it('creates dir entities and CONTAINS relationships without dynamic indexing', () => {
    const handler = new DirectoryHandler();
    const fileRelPath = 'src/foo/bar/baz.ts';
    const fileEntityId = 'file:baz';

    const { dirEntities, dirRelationships } = handler.createDirectoryHierarchy(
      fileRelPath,
      fileEntityId
    );

    // Expect directories for src, src/foo, src/foo/bar
    const dirIds = dirEntities.map((e) => e.id);
    expect(dirIds).toContain('dir:src');
    expect(dirIds).toContain('dir:src/foo');
    expect(dirIds).toContain('dir:src/foo/bar');

    // Expect parent->child relationships and last dir -> file
    const tuples = dirRelationships.map((r) => [r.fromEntityId, r.toEntityId, r.type] as const);
    expect(tuples).toContainEqual(['dir:src', 'dir:src/foo', RelationshipType.CONTAINS]);
    expect(tuples).toContainEqual(['dir:src/foo', 'dir:src/foo/bar', RelationshipType.CONTAINS]);
    expect(tuples).toContainEqual(['dir:src/foo/bar', 'file:baz', RelationshipType.CONTAINS]);
  });
});

