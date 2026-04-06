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
  } catch {}

  const p = parseQueryFromLocation();
  if (p.get("devtools") === "1") return true;

  return false;
}

export function isMiniAppLogUiEnabled(): boolean {
  if (typeof window === "undefined") return false;

  if (import.meta.env.DEV) return true;

  if (String(import.meta.env?.VITE_ENABLE_MINIAPP_LOG_UI ?? "").toLowerCase() === "true") return true;

  try {
    if (window.localStorage.getItem("miniapp_log_ui") === "1") return true;
  } catch {}

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

export async function initMiniAppVConsole(): Promise<void> {
  if (typeof window === "undefined" || !isMiniAppDevtoolsEnabled()) return;
  const isCameraRoute = () => {
    const h = String(window.location.hash ?? "").toLowerCase();
    return (
      h.includes("zyapp/camera/") ||
      h.includes("zyapp/multi-view") ||
      h === "#/zyapp" ||
      h.startsWith("#/zyapp/")
    );
  };

  const hideVConsoleUi = () => {
    if (!isCameraRoute()) return;

    try {
      const byId = ["vconsole", "vConsole", "miniapp-vconsole", "miniapp-vconsole-root"];
      for (const id of byId) {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      }

      document.querySelectorAll("button,div,span").forEach((el) => {
        const t = (el.textContent ?? "").trim();
        if (!t) return;
        if (t === "vConsole" || t.includes("vConsole")) {
          (el as HTMLElement).style.display = "none";
        }
      });
    } catch {}
  };

  window.addEventListener("hashchange", hideVConsoleUi);
  window.addEventListener("popstate", hideVConsoleUi);
  hideVConsoleUi();

  if (vconsoleInitDone) return;

  if (window.vConsole || window.__miniapp_vconsole__) {
    vconsoleInitDone = true;
    hideVConsoleUi();
    return;
  }

  if (isCameraRoute()) {
    vconsoleInitDone = true;
    hideVConsoleUi();
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
    hideVConsoleUi();
  } catch (e) {
    console.warn("[MiniApp devtools] vConsole init failed", e);
  }
}

export function initMiniAppTracing(): void {
  if (typeof window === "undefined" || tracingInitDone) return;
  if (!isMiniAppLogUiEnabled() && !isMiniAppDevtoolsEnabled()) return;
  tracingInitDone = true;

  if (!window.__miniapp_fetch_wrapped__ && typeof window.fetch === "function") {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await origFetch(input, init);
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
      return origCall(
        className,
        method,
        params,
        (res: TSuccess) => {
          ok?.(res);
        },
        (e: TError) => {
          err?.(e);
        },
      );
    };
    window.__miniapp_wv_wrapped__ = true;
  }
}
