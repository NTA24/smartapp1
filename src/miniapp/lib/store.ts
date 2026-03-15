/**
 * Safe storage wrapper for Mini App.
 * Some WebViews block or isolate localStorage — use in-memory fallback on exception.
 */
const _mem: Record<string, string> = {};

export function storeGet(key: string, def?: string | null): string | null {
  try {
    const v = window.localStorage.getItem(key);
    return v !== null && v !== undefined ? v : (_mem[key] ?? def ?? null);
  } catch {
    return _mem[key] ?? def ?? null;
  }
}

export function storeSet(key: string, value: string): void {
  _mem[key] = String(value);
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export const Store = { get: storeGet, set: storeSet };
