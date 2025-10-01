import { describe, it, expect } from 'vitest';

import { sanitizeEnvironment } from '@memento/core/utils/environment';

describe('sanitizeEnvironment', () => {
  it('preserves production shard suffixes', () => {
    expect(sanitizeEnvironment('prod-us-east-1')).toBe('prod-us-east-1');
    expect(sanitizeEnvironment(' prod-eu ')).toBe('prod-eu');
  });

  it('canonicalizes production alias without suffix', () => {
    expect(sanitizeEnvironment('production')).toBe('prod');
    expect(sanitizeEnvironment('Prod')).toBe('prod');
  });

  it('normalizes mixed casing and punctuation', () => {
    expect(sanitizeEnvironment(' QA_env ')).toBe('qa');
    expect(sanitizeEnvironment('local dev')).toBe('local-dev');
  });
});
