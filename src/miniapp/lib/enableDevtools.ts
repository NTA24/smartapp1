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

import { addLog } from "./debugLog";

let erudaInitDone = false;
let tracingInitDone = false;
let vconsoleInitDone = false;
const ERUDA_CDN_URL =
  String((import.meta.env as Record<string, unknown>).VITE_ERUDA_CDN_URL ?? "").trim() ||
  "https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.js";
const VCONSOLE_CDN_URL =
  String((import.meta.env as Record<string, unknown>).VITE_VCONSOLE_CDN_URL ?? "").trim() ||
  "https://unpkg.com/vconsole@3.15.1/dist/vconsole.min.js";

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
    s.src = ERUDA_CDN_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load eruda.js"));
    document.head.appendChild(s);
  }).catch((e) => {
    console.warn("[MiniApp devtools]", e);
  });

  try {
    window.eruda?.init({ tool: ["console", "elements", "network", "resources", "info"] });
    erudaInitDone = true;
    console.info("[MiniApp] Eruda devtools enabled — trace JSAPI / console.log here.");
  } catch (e) {
    console.warn("[MiniApp devtools] eruda.init failed", e);
  }
}

/**
 * vConsole cho mobile WebView (UI giống ảnh bạn gửi).
 * Ưu tiên vConsole vì tương thích mini app tốt hơn; có guard tránh "already exists".
 */
export async function initMiniAppVConsole(): Promise<void> {
  if (typeof window === "undefined" || !isMiniAppDevtoolsEnabled()) return;
  if (vconsoleInitDone) return;

  // Nếu host app/SDK đã cài sẵn vConsole thì không khởi tạo lại.
  if (window.vConsole || window.__miniapp_vconsole__) {
    vconsoleInitDone = true;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existed = document.getElementById("miniapp-vconsole-script");
    if (existed) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "miniapp-vconsole-script";
    s.src = VCONSOLE_CDN_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load vconsole.min.js"));
    document.head.appendChild(s);
  }).catch((e) => {
    console.warn("[MiniApp devtools] vConsole load failed", e);
  });

  try {
    const VC = window.VConsole;
    if (VC && !window.vConsole && !window.__miniapp_vconsole__) {
      window.__miniapp_vconsole__ = new VC({ maxLogNumber: 1000 });
      console.info("[MiniApp] vConsole enabled.");
    }
    vconsoleInitDone = true;
  } catch (e) {
    console.warn("[MiniApp devtools] vConsole init failed", e);
  }
}

/** Trace fetch + WindVane.call để bắt lỗi 401 / JSAPI khi Mini App nhảy màn. */
export function initMiniAppTracing(): void {
  if (typeof window === "undefined" || tracingInitDone) return;
  if (!isMiniAppLogUiEnabled() && !isMiniAppDevtoolsEnabled()) return;
  tracingInitDone = true;

  addLog("Tracing enabled: fetch + WindVane.call");

  if (!window.__miniapp_fetch_wrapped__ && typeof window.fetch === "function") {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = String(init?.method ?? "GET").toUpperCase();
      addLog("[TRACE fetch req]", method, url);
      const res = await origFetch(input, init);
      addLog("[TRACE fetch res]", method, url, "status=", res.status);
      if (res.status === 401) {
        try {
          const text = await res.clone().text();
          addLog("[TRACE fetch 401 body]", text.slice(0, 600));
        } catch {
          addLog("[TRACE fetch 401 body] <unreadable>");
        }
      }
      return res;
    };
    window.__miniapp_fetch_wrapped__ = true;
  }

  if (!window.__miniapp_wv_wrapped__ && typeof window.WindVane?.call === "function") {
    const origCall = window.WindVane.call.bind(window.WindVane);
    window.WindVane.call = <TSuccess = unknown, TError = unknown>(
      className: string,
      method: string,
      params: unknown,
      ok?: (res: TSuccess) => void,
      err?: (e: TError) => void
    ) => {
      addLog("[TRACE WV req]", `${className}.${method}`, params ?? {});
      return origCall(
        className,
        method,
        params,
        (res: TSuccess) => {
          addLog("[TRACE WV ok]", `${className}.${method}`, res ?? {});
          ok?.(res);
        },
        (e: TError) => {
          addLog("[TRACE WV err]", `${className}.${method}`, e ?? {});
          err?.(e);
        },
      );
    };
    window.__miniapp_wv_wrapped__ = true;
  }
}
