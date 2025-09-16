import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SynchronizationCoordinator } from '@/services/SynchronizationCoordinator';
import { RelationshipType } from '@/models/relationships';

describe('SynchronizationCoordinator.resolveRelationshipTarget with toRef/fromRef', () => {
  let kgService: any;
  let astParser: any;
  let dbService: any;
  let coord: any;

  beforeEach(() => {
    kgService = {
      findSymbolInFile: vi.fn(),
      findNearbySymbols: vi.fn(),
      findSymbolsByName: vi.fn(),
      getEntity: vi.fn(),
      createRelationship: vi.fn(),
    };
    astParser = {};
    dbService = {};
    coord = new SynchronizationCoordinator(kgService, astParser, dbService) as any;
  });

  it('returns id directly when toRef.kind=entity', async () => {
    const rel: any = {
      id: 'r1', fromEntityId: 'from1', toEntityId: 'sym:abc',
      type: RelationshipType.REFERENCES,
      created: new Date(), lastModified: new Date(), version: 1,
      toRef: { kind: 'entity', id: 'sym:abc' }
    };

    const id = await coord.resolveRelationshipTarget(rel);
    expect(id).toBe('sym:abc');
    expect(kgService.findSymbolInFile).not.toHaveBeenCalled();
  });

  it('resolves via findSymbolInFile when toRef.kind=fileSymbol', async () => {
    kgService.findSymbolInFile.mockResolvedValue({ id: 'sym:fileFoo' });
    const rel: any = {
      id: 'r2', fromEntityId: 'from2', toEntityId: 'file:src/a.ts:Foo',
      type: RelationshipType.REFERENCES,
      created: new Date(), lastModified: new Date(), version: 1,
      toRef: { kind: 'fileSymbol', file: 'src/a.ts', symbol: 'Foo', name: 'Foo' }
    };

    const id = await coord.resolveRelationshipTarget(rel);
    expect(id).toBe('sym:fileFoo');
    expect(kgService.findSymbolInFile).toHaveBeenCalledWith('src/a.ts', 'Foo');
  });

  it('uses fromRef.file as current file context for external toRef', async () => {
    kgService.findSymbolInFile.mockResolvedValue({ id: 'sym:localBar' });
    const rel: any = {
      id: 'r3', fromEntityId: 'from3', toEntityId: 'external:Bar',
      type: RelationshipType.REFERENCES,
      created: new Date(), lastModified: new Date(), version: 1,
      toRef: { kind: 'external', name: 'Bar' },
      fromRef: { kind: 'fileSymbol', file: 'src/x.ts', symbol: 'From' }
    };

    const id = await coord.resolveRelationshipTarget(rel);
    expect(kgService.findSymbolInFile).toHaveBeenCalledWith('src/x.ts', 'Bar');
    expect(id).toBe('sym:localBar');
  });

  it('derives current file from fromRef.entity when resolving external toRef', async () => {
    kgService.getEntity.mockResolvedValue({ id: 'sym:from', path: 'src/y.ts:FromName' });
    kgService.findSymbolInFile.mockResolvedValue(null);
    kgService.findNearbySymbols.mockResolvedValue([{ id: 'sym:nearBaz' }]);
    const rel: any = {
      id: 'r4', fromEntityId: 'from4', toEntityId: 'external:Baz',
      type: RelationshipType.REFERENCES,
      created: new Date(), lastModified: new Date(), version: 1,
      toRef: { kind: 'external', name: 'Baz' },
      fromRef: { kind: 'entity', id: 'sym:from' }
    };

    const id = await coord.resolveRelationshipTarget(rel);
    expect(kgService.getEntity).toHaveBeenCalledWith('sym:from');
    expect(kgService.findNearbySymbols).toHaveBeenCalled();
    expect(id).toBe('sym:nearBaz');
  });
});

