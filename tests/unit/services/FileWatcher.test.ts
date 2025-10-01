/**
 * Focused unit tests for FileWatcher without touching the real filesystem.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import type { FileChange } from '@memento/core/services/FileWatcher';

const {
  watchSpy,
  watcherCloseSpy,
  createHashMock,
  hashUpdateMock,
  hashDigestMock,
  fsMocks,
} = vi.hoisted(() => {
  const hashUpdate = vi.fn().mockReturnThis();
  const hashDigest = vi.fn().mockReturnValue('hash-1');
  const fsMocks = {
    stat: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn().mockResolvedValue([] as string[]),
    access: vi.fn().mockResolvedValue(undefined),
    lstat: vi.fn().mockResolvedValue({ isDirectory: () => false }),
  };
  return {
    watchSpy: vi.fn(),
    watcherCloseSpy: vi.fn(),
    createHashMock: vi.fn(() => ({ update: hashUpdate, digest: hashDigest })),
    hashUpdateMock: hashUpdate,
    hashDigestMock: hashDigest,
    fsMocks,
  };
});

const fakeWatcherFactory = () => ({
  on: vi.fn().mockReturnThis(),
  close: watcherCloseSpy,
});

vi.mock('chokidar', () => ({
  default: {
    watch: watchSpy.mockImplementation(() => fakeWatcherFactory()),
  },
  FSWatcher: class {},
}));

vi.mock('fs', () => ({ promises: fsMocks }));

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    createHash: createHashMock,
  };
});

import { FileWatcher } from '@memento/core/services/FileWatcher';

describe('FileWatcher (unit)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    watcherCloseSpy.mockResolvedValue(undefined);
    watchSpy.mockImplementation(() => fakeWatcherFactory());
    fsMocks.stat.mockResolvedValue({
      size: 42,
      mtime: new Date('2024-01-01T00:00:00.000Z'),
      isDirectory: () => false,
    });
    fsMocks.readFile.mockResolvedValue(Buffer.from('contents'));
    hashDigestMock.mockReturnValue('hash-1');
    hashUpdateMock.mockReturnThis();
    createHashMock.mockImplementation(() => ({
      update: hashUpdateMock,
      digest: hashDigestMock,
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts watcher with merged configuration and polling in tests', async () => {
    const watcher = new FileWatcher({ watchPaths: ['foo'], debounceMs: 12 });
    const initSpy = vi
      .spyOn(watcher as any, 'initializeFileHashes')
      .mockResolvedValue(undefined);

    await watcher.start();

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(watchSpy).toHaveBeenCalledWith(['foo'], expect.objectContaining({
      usePolling: true,
      ignored: expect.any(Function),
    }));

    const ignoredFn = watchSpy.mock.calls.at(-1)?.[1]?.ignored as (p: string) => boolean;
    expect(ignoredFn(path.join('foo', 'node_modules', 'x.js'))).toBe(true);

    await watcher.stop();
    expect(watcherCloseSpy).toHaveBeenCalled();
  });

  it('emits debounced change events with enriched metadata', async () => {
    const watcher = new FileWatcher({ debounceMs: 5, maxConcurrent: 2 });
    const changeEvents: FileChange[] = [];
    const batchEvents: FileChange[][] = [];

    watcher.on('change', (change) => changeEvents.push(change));
    watcher.on('fileCreated', (change) => changeEvents.push(change));
    watcher.on('batchComplete', (batch) => batchEvents.push(batch));

    await (watcher as any).handleFileChange('src/demo.ts', 'create');

    await vi.runAllTimersAsync();

    expect(changeEvents).toHaveLength(2); // `change` + typed event
    const emitted = changeEvents[0];
    expect(emitted.type).toBe('create');
    expect(emitted.path).toBe('src/demo.ts');
    expect(emitted.hash).toBe('hash-1');
    expect(emitted.stats).toEqual(
      expect.objectContaining({ size: 42, isDirectory: false })
    );
    expect(batchEvents).toHaveLength(1);
    expect(batchEvents[0]).toHaveLength(1);
  });

  it('skips duplicate modify events when file hash is unchanged', async () => {
    const watcher = new FileWatcher({ debounceMs: 5 });
    const changeSpy = vi.fn();
    watcher.on('change', changeSpy);

    await (watcher as any).handleFileChange('src/demo.ts', 'modify');
    await vi.runAllTimersAsync();
    expect(changeSpy).toHaveBeenCalledTimes(1);

    // Same hash -> deduplicated
    await (watcher as any).handleFileChange('src/demo.ts', 'modify');
    await vi.runAllTimersAsync();
    expect(changeSpy).toHaveBeenCalledTimes(1);

    // New hash -> emitted again
    hashDigestMock.mockReturnValueOnce('hash-2');
    await (watcher as any).handleFileChange('src/demo.ts', 'modify');
    await vi.runAllTimersAsync();
    expect(changeSpy).toHaveBeenCalledTimes(2);
  });

  it('processes directory events without reading file contents', async () => {
    const watcher = new FileWatcher({ debounceMs: 5 });
    const changeSpy = vi.fn();
    watcher.on('fileDeleted', changeSpy);

    await (watcher as any).handleDirectoryChange('src/features', 'delete');
    await vi.runAllTimersAsync();

    expect(changeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'delete',
        path: 'src/features',
        stats: expect.objectContaining({ isDirectory: true }),
      })
    );
    expect(fsMocks.readFile).not.toHaveBeenCalled();
  });
});
