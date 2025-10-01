import { describe, it, expect } from 'vitest';
import { detectLanguage } from '@memento/knowledge';

describe('detectLanguage', () => {
  it('maps known extensions', () => {
    expect(detectLanguage('/tmp/file.ts')).toBe('typescript');
    expect(detectLanguage('/tmp/file.js')).toBe('javascript');
  });

  it('falls back to unknown for others', () => {
    expect(detectLanguage('/tmp/file.unknownext')).toBe('unknown');
  });
});

