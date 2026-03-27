import { storeGet, storeSet } from "./store";

const STORAGE_KEY_APP_ID = "miniapp_app_id";
export const DEFAULT_MINIAPP_APP_ID = "1512032299590111735808";
const DEFAULT_SMARTAPP_HOSTNAME = "smartapp-ten.vercel.app";
const DEFAULT_PUBLIC_API_BASE = "https://smartapp-ten.vercel.app/api";
const DEFAULT_CAMPUS_API_BASE = "https://campus.iot-platform.io.vn/api/v1/mini-app";
const DEFAULT_NEWGEN_API_BASE = "https://newgen.iot-platform.io.vn/api";

function envString(key: string, fallback: string): string {
  const raw = (import.meta.env as Record<string, unknown>)[key];
  const value = String(raw ?? "").trim();
  return value || fallback;
}

const SMARTAPP_HOSTNAME = envString("VITE_SMARTAPP_HOSTNAME", DEFAULT_SMARTAPP_HOSTNAME);
const PUBLIC_API_BASE = envString("VITE_PUBLIC_API_BASE", DEFAULT_PUBLIC_API_BASE);
const CAMPUS_API_BASE = envString("VITE_CAMPUS_API_BASE", DEFAULT_CAMPUS_API_BASE);
const NEWGEN_API_BASE = envString("VITE_NEWGEN_API_BASE", DEFAULT_NEWGEN_API_BASE);

function getAppIdFromUrl(): string {
  if (typeof window === "undefined" || !window.location.search) return "";
  const m = window.location.search.match(/[?&]appId=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export function getMiniAppAppId(): string {
  // Priority rationale:
  // 1) window.*: host Super App/runtime injection is the most authoritative at runtime.
  // 2) storage: last user/app override persisted on this device.
  // 3) url appId=: one-off debug/manual override link.
  // 4) default: safe fallback for local/dev and missing host context.
  const fromWindow = typeof window !== "undefined" ? (window.MINIAPP_APP_ID ?? window.APP_ID ?? "") : "";
  const fromStorage = typeof window !== "undefined" ? (storeGet(STORAGE_KEY_APP_ID) ?? "") : "";
  const fromUrl = getAppIdFromUrl();
  return String(fromWindow || fromStorage || fromUrl || DEFAULT_MINIAPP_APP_ID).trim();
}

export function saveAppId(appId: string): void {
  if (appId.trim()) storeSet(STORAGE_KEY_APP_ID, appId.trim());
  else try { window.localStorage.removeItem(STORAGE_KEY_APP_ID); } catch { /* ignore */ }
}

export function getApiBase(): string {
  if (typeof window !== "undefined" && window.APP_API_BASE_URL) {
    return window.APP_API_BASE_URL;
  }
  const isSameOrigin =
    typeof window !== "undefined" &&
    window.location?.hostname === SMARTAPP_HOSTNAME;
  return isSameOrigin ? "/api" : PUBLIC_API_BASE;
}

export const DEFAULT_SCOPES = ["USER_NAME", "USER_PHONE_NUMBER"] as const;
export const SMART_BUILDING_BASE_URL = CAMPUS_API_BASE;
export const NEWGEN_DEVICE_WITH_CREDENTIALS_URL = `${NEWGEN_API_BASE}/device-with-credentials`;
export const USER_INFO_URL = `${CAMPUS_API_BASE}/oauth/user-info`;
export { STORAGE_KEY_APP_ID };
