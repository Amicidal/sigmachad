import { describe, it, expect, beforeEach } from 'vitest';
import { scoreInferredEdge } from '@/utils/confidence';
import { RelationshipType } from '@/models/relationships';
import { noiseConfig } from '@/config/noise';

describe('scoreInferredEdge', () => {
  const save = { ...noiseConfig } as any;

  beforeEach(() => {
    // Reset to defaults each test
    Object.assign(noiseConfig, save);
  });

  it('assigns base buckets for external/file/concrete', () => {
    noiseConfig.AST_CONF_EXTERNAL = 0.41;
    noiseConfig.AST_CONF_FILE = 0.61;
    noiseConfig.AST_CONF_CONCRETE = 0.91;

    const ext = scoreInferredEdge({ relationType: RelationshipType.REFERENCES, toId: 'external:Foo' });
    const file = scoreInferredEdge({ relationType: RelationshipType.DEPENDS_ON, toId: 'file:src/a.ts:Foo' });
    const concrete = scoreInferredEdge({ relationType: RelationshipType.REFERENCES, toId: 'entity-123' });

    expect(ext).toBe(0.41);
    expect(file).toBe(0.61);
    expect(concrete).toBe(0.91);
  });

  it('applies boosts and penalties from config', () => {
    noiseConfig.AST_CONF_FILE = 0.6;
    noiseConfig.AST_BOOST_TYPECHECK = 0.1;
    noiseConfig.AST_BOOST_EXPORTED = 0.05;
    noiseConfig.AST_BOOST_SAME_FILE = 0.02;
    noiseConfig.AST_STEP_NAME_LEN = 0.01; // per char above 3, capped
    noiseConfig.AST_PENALTY_IMPORT_DEPTH = 0.03; // per hop

    const score = scoreInferredEdge({
      relationType: RelationshipType.REFERENCES,
      toId: 'file:src/a.ts:FooBar',
      fromFileRel: 'src/a.ts',
      usedTypeChecker: true,
      isExported: true,
      nameLength: 7, // over by 4 -> +0.04
      importDepth: 2, // -0.06
    });

    // 0.6 + 0.1 + 0.05 + 0.02 + 0.04 - 0.06 = 0.75
    expect(Number(score.toFixed(5))).toBe(0.75);
  });
});

