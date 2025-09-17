import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FileWatcher as FileWatcherType } from '../../../src/services/FileWatcher';

type Listener = (...args: any[]) => void;

class MockWatcher {
  listeners = new Map<string, Listener[]>();
  on = vi.fn((event: string, handler: Listener) => {
    const list = this.listeners.get(event) ?? [];
    list.push(handler);
    this.listeners.set(event, list);
    return this;
  });
  close = vi.fn(async () => {
    this.listeners.clear();
  });
  emit(event: string, ...args: any[]) {
    const list = this.listeners.get(event) ?? [];
    for (const handler of list) {
      handler(...args);
    }
  }
}

const createdWatchers: MockWatcher[] = [];
const watchSpy = vi.fn((paths: string[], options: Record<string, unknown>) => {
  const watcher = new MockWatcher();
  createdWatchers.push(watcher);
  return watcher as any;
});

vi.mock('chokidar', () => ({
  __esModule: true,
  default: {
    watch: watchSpy,
  },
}));

describe('FileWatcher (core behavior)', () => {
  let FileWatcher: typeof FileWatcherType;

  beforeEach(async () => {
    createdWatchers.length = 0;
    watchSpy.mockClear();
    const module = await import('../../../src/services/FileWatcher');
    FileWatcher = module.FileWatcher;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts chokidar watcher with provided paths', async () => {
    const watcher = new FileWatcher({ watchPaths: ['src'], debounceMs: 10 });

    await watcher.start();

    expect(watchSpy).toHaveBeenCalledTimes(1);
    expect(watchSpy).toHaveBeenCalledWith(
      ['src'],
      expect.objectContaining({
        persistent: true,
        awaitWriteFinish: expect.any(Object),
      })
    );
    expect(createdWatchers).toHaveLength(1);

    await watcher.stop();
  });

  it('registers change handlers when starting', async () => {
    const watcher = new FileWatcher({ watchPaths: ['src'] });

    await watcher.start();

    const mockWatcher = createdWatchers[0];
    const registeredEvents = mockWatcher.on.mock.calls.map(([event]) => event);
    expect(registeredEvents).toEqual(
      expect.arrayContaining(['add', 'change', 'unlink'])
    );

    await watcher.stop();
    expect(mockWatcher.close).toHaveBeenCalledTimes(1);
  });

  it('supports idempotent stop calls', async () => {
    const watcher = new FileWatcher({ watchPaths: ['src'], debounceMs: 5 });

    await watcher.start();
    const mockWatcher = createdWatchers[0];

    await watcher.stop();
    await watcher.stop();

    expect(mockWatcher.close).toHaveBeenCalledTimes(1);
  });
});
