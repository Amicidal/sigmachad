import { expect } from 'vitest';
export function expectSuccess(body, shape) {
    expect(body).toEqual(expect.objectContaining({ success: true }));
    if (shape) {
        expect(body.data).toEqual(expect.objectContaining(shape));
    }
    else {
        expect(body).toHaveProperty('data');
    }
}
export function expectError(body, code) {
    expect(body).toEqual(expect.objectContaining({ success: false }));
    expect(body).toHaveProperty('error');
    if (code) {
        expect(body.error.code).toBe(code);
    }
}
export function expectArray(value) {
    // Prefer structure over boolean checks
    expect(value).toEqual(expect.any(Array));
}
//# sourceMappingURL=assertions.js.map