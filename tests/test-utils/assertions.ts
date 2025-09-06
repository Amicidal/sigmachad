import { expect } from 'vitest';

export function expectSuccess<T extends Record<string, any>>(body: any, shape?: Record<string, any>) {
  expect(body).toEqual(expect.objectContaining({ success: true }));
  if (shape) {
    expect(body.data).toEqual(expect.objectContaining(shape));
  } else {
    expect(body).toHaveProperty('data');
  }
}

export function expectError(body: any, code?: string) {
  expect(body).toEqual(expect.objectContaining({ success: false }));
  expect(body).toHaveProperty('error');
  if (code) {
    expect(body.error.code).toBe(code);
  }
}

export function expectArray<T = any>(value: any) {
  // Prefer structure over boolean checks
  expect(value).toEqual(expect.any(Array));
}

