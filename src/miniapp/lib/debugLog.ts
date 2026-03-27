/**
 * Log hiển thị trên UI (WebView không có F12).
 * Gọi addLog() → panel DebugLogPanel sẽ hiển thị.
 */

const MAX_LINES = 80;
const STORAGE_KEY = "miniapp_debug_lines";

function serialize(x: unknown): string {
  if (x === null) return "null";
  if (x === undefined) return "undefined";
  if (typeof x === "object") try { return JSON.stringify(x); } catch { return String(x); }
  return String(x);
}

class MiniAppDebugLogStore {
  private lines: string[] = [];
  private hydrated = false;

  private ensureHydrated(): void {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) this.lines = arr.slice(-MAX_LINES).map((x) => String(x));
    } catch {
      // ignore
    }
  }

  private persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines.slice(-MAX_LINES)));
    } catch {
      // ignore
    }
  }

  add(...args: unknown[]): void {
    this.ensureHydrated();
    const line = args.map(serialize).join(" ");
    const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    this.lines.push(`[${time}] ${line}`);
    if (this.lines.length > MAX_LINES) this.lines = this.lines.slice(-MAX_LINES);
    this.persist();
    try {
      window.dispatchEvent(new CustomEvent("miniapp-debug-log", { detail: [...this.lines] }));
    } catch {
      // ignore
    }
    console.log("[MiniApp]", ...args);
  }

  list(): string[] {
    this.ensureHydrated();
    return [...this.lines];
  }

  clear(): void {
    this.lines = [];
    this.hydrated = true;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent("miniapp-debug-log", { detail: [] }));
    } catch {
      // ignore
    }
  }
}

const debugLogStore = new MiniAppDebugLogStore();

export function addLog(...args: unknown[]): void {
  debugLogStore.add(...args);
}

export function getLogs(): string[] {
  return debugLogStore.list();
}

export function clearLogs(): void {
  debugLogStore.clear();
}
