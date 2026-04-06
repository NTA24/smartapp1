
const _mem: Record<string, string> = {};

export function storeGet(key: string, def?: string | null): string | null {
  try {
    const v = window.localStorage.getItem(key);
    if (v !== null && v !== undefined) return v;
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
    delete _mem[key];
  } catch {
    _mem[key] = normalized;
  }
}

export const Store = { get: storeGet, set: storeSet };
