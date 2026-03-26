/**
 * Dev / trace trên Mini App (WebView trong Super App — không có F12).
 *
 * Hai lớp riêng:
 * 1) Panel log trong app (addLog) — nên dùng trên iPhone, không cần tải script ngoài.
 *    → VITE_ENABLE_MINIAPP_LOG_UI=true hoặc ?logui=1 hoặc localStorage miniapp_log_ui=1
 *    → npm run dev: mặc định bật panel log (import.meta.env.DEV)
 *
 * 2) Eruda (console giả trên màn hình) — có thể bị Super App chặn CDN.
 *    → VITE_ENABLE_DEVTOOLS=true hoặc ?devtools=1 hoặc localStorage miniapp_devtools=1
 */

let erudaInitDone = false;

function parseQueryFromLocation(): URLSearchParams {
  const search = new URLSearchParams(window.location.search);
  if ([...search.keys()].length > 0) return search;
  const hash = window.location.hash;
  const q = hash.indexOf("?");
  if (q >= 0) return new URLSearchParams(hash.slice(q + 1));
  return search;
}

export function isMiniAppDevtoolsEnabled(): boolean {
  if (typeof window === "undefined") return false;

  if (String(import.meta.env?.VITE_ENABLE_DEVTOOLS ?? "").toLowerCase() === "true") return true;

  try {
    if (window.localStorage.getItem("miniapp_devtools") === "1") return true;
  } catch {
    /* ignore */
  }

  const p = parseQueryFromLocation();
  if (p.get("devtools") === "1") return true;

  return false;
}

/** Panel “MiniApp log” (addLog): hiện trên màn hình, phù hợp iPhone / Super App. */
export function isMiniAppLogUiEnabled(): boolean {
  if (typeof window === "undefined") return false;

  if (import.meta.env.DEV) return true;

  if (String(import.meta.env?.VITE_ENABLE_MINIAPP_LOG_UI ?? "").toLowerCase() === "true") return true;

  try {
    if (window.localStorage.getItem("miniapp_log_ui") === "1") return true;
  } catch {
    /* ignore */
  }

  const p = parseQueryFromLocation();
  if (p.get("logui") === "1") return true;

  if (isMiniAppDevtoolsEnabled()) return true;

  return false;
}

export async function initMiniAppDevtools(): Promise<void> {
  if (typeof window === "undefined" || !isMiniAppDevtoolsEnabled()) return;
  if (erudaInitDone) return;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load eruda.js"));
    document.head.appendChild(s);
  }).catch((e) => {
    console.warn("[MiniApp devtools]", e);
  });

  try {
    const eruda = (window as unknown as { eruda?: { init: (opts?: Record<string, unknown>) => void } }).eruda;
    eruda?.init({ tool: ["console", "elements", "network", "resources", "info"] });
    erudaInitDone = true;
    console.info("[MiniApp] Eruda devtools enabled — trace JSAPI / console.log here.");
  } catch (e) {
    console.warn("[MiniApp devtools] eruda.init failed", e);
  }
}
