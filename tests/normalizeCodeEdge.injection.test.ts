import { describe, it, expect } from 'vitest';
import { normalizeCodeEdge } from '@memento/core';
import { RelationshipType } from '@memento/core/models/relationships';

describe('normalizeCodeEdge - metadata hoisting hardening', () => {
  it('hoists only allowed keys and maps legacy param->paramName', () => {
    const relIn: any = {
      type: RelationshipType.CALLS,
      fromEntityId: 'a',
      toEntityId: 'b',
      metadata: {
        kind: 'call',
        param: 'arg0',
        resolution: 'static',
        // Attempt to smuggle arbitrary fields that should NOT be hoisted
        evil: 'should-not-appear',
      },
    };

    const rel = normalizeCodeEdge(relIn);

    expect(rel.kind).toBe('call');
    expect(rel.paramName).toBe('arg0');
    expect((rel as any).evil).toBeUndefined();
  });
});

