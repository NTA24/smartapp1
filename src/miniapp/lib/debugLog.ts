/**
 * Log hiển thị trên UI (WebView không có F12).
 * Gọi addLog() → panel DebugLogPanel sẽ hiển thị.
 */

const MAX_LINES = 80;
const STORAGE_KEY = "miniapp_debug_lines";
let lines: string[] = [];

function hydrateFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) lines = arr.slice(-MAX_LINES).map((x) => String(x));
  } catch {
    // ignore
  }
}

function persistToStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(-MAX_LINES)));
  } catch {
    // ignore
  }
}

function serialize(x: unknown): string {
  if (x === null) return "null";
  if (x === undefined) return "undefined";
  if (typeof x === "object") try { return JSON.stringify(x); } catch { return String(x); }
  return String(x);
}

export function addLog(...args: unknown[]): void {
  if (typeof window !== "undefined" && lines.length === 0) hydrateFromStorage();
  const line = args.map(serialize).join(" ");
  const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  lines.push(`[${time}] ${line}`);
  if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES);
  persistToStorage();
  try {
    window.dispatchEvent(new CustomEvent("miniapp-debug-log", { detail: [...lines] }));
  } catch {
    // ignore
  }
  console.log("[MiniApp]", ...args);
}

export function getLogs(): string[] {
  if (typeof window !== "undefined" && lines.length === 0) hydrateFromStorage();
  return [...lines];
}

export function clearLogs(): void {
  lines = [];
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
