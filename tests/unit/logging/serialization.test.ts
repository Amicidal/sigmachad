import { describe, it, expect } from 'vitest';
import { sanitizeData, serializeLogEntry } from '../../../src/services/logging/serialization.js';
import type { LogEntry } from '../../../src/services/core/LoggingService.js';

describe('logging serialization', () => {
  it('coerces bigint primitives into JSON-safe strings', () => {
    const result = sanitizeData(12345678901234567890n);
    expect(result).toBe('12345678901234567890n');
  });

  it('sanitizes bigint values within nested structures', () => {
    const data = {
      stats: {
        duration: 42n,
      },
    };

    const sanitized = sanitizeData(data) as any;

    expect(sanitized.stats.duration).toBe('42n');
  });

  it('serializes log entries containing bigint data without throwing', () => {
    const entry: LogEntry = {
      timestamp: new Date('2024-01-01T00:00:00Z'),
      level: 'info',
      component: 'test-suite',
      message: 'captured timing',
      data: {
        hrtime: 987654321n,
      },
    };

    const serialized = serializeLogEntry(entry);
    const parsed = JSON.parse(serialized);

    expect(parsed.data.hrtime).toBe('987654321n');
  });
});
