/**
 * Log hiển thị trên UI (WebView không có F12).
 * Gọi addLog() → panel DebugLogPanel sẽ hiển thị.
 */

const MAX_LINES = 80;
let lines: string[] = [];

function serialize(x: unknown): string {
  if (x === null) return "null";
  if (x === undefined) return "undefined";
  if (typeof x === "object") try { return JSON.stringify(x); } catch { return String(x); }
  return String(x);
}

export function addLog(...args: unknown[]): void {
  const line = args.map(serialize).join(" ");
  const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  lines.push(`[${time}] ${line}`);
  if (lines.length > MAX_LINES) lines = lines.slice(-MAX_LINES);
  try {
    window.dispatchEvent(new CustomEvent("miniapp-debug-log", { detail: [...lines] }));
  } catch {
    // ignore
  }
  console.log("[MiniApp]", ...args);
}

export function getLogs(): string[] {
  return [...lines];
}

export function clearLogs(): void {
  lines = [];
  try {
    window.dispatchEvent(new CustomEvent("miniapp-debug-log", { detail: [] }));
  } catch {
    // ignore
  }
}
