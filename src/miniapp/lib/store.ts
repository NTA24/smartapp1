/**
 * Safe storage wrapper for Mini App.
 * Some WebViews block or isolate localStorage — use in-memory fallback on exception.
 */
const _mem: Record<string, string> = {};

export function storeGet(key: string, def?: string | null): string | null {
  try {
    const v = window.localStorage.getItem(key);
    if (v !== null && v !== undefined) return v;
    // Keep memory fallback in sync with persistent storage state.
    delete _mem[key];
    return def ?? null;
  } catch {
    return _mem[key] ?? def ?? null;
  }
}

export function storeSet(key: string, value: string): void {
  const normalized = String(value);
  try {
    window.localStorage.setItem(key, normalized);
    // Persistent storage is available; avoid stale dual-source data.
    delete _mem[key];
  } catch {
    _mem[key] = normalized;
  }
}

export const Store = { get: storeGet, set: storeSet };
