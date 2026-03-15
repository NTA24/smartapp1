import { storeGet, storeSet } from "./store";

const STORAGE_KEY_APP_ID = "miniapp_app_id";
export const DEFAULT_MINIAPP_APP_ID = "1512032299590111735808";
const VERCEL_API_BASE = "https://smartapp-ten.vercel.app/api";

function getAppIdFromUrl(): string {
  if (typeof window === "undefined" || !window.location.search) return "";
  const m = window.location.search.match(/[?&]appId=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export function getMiniAppAppId(): string {
  const fromWindow =
    (typeof window !== "undefined" && (window.MINIAPP_APP_ID ?? window.APP_ID)) || "";
  const fromStorage =
    (typeof window !== "undefined" && storeGet(STORAGE_KEY_APP_ID)) || "";
  const fromUrl = getAppIdFromUrl();
  return (
    String(fromWindow || fromStorage || fromUrl || DEFAULT_MINIAPP_APP_ID || "").trim()
  );
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
    window.location?.hostname === "smartapp-ten.vercel.app";
  return isSameOrigin ? "/api" : VERCEL_API_BASE;
}

export const DEFAULT_SCOPES = ["USER_NAME", "USER_PHONE_NUMBER"] as const;
export { STORAGE_KEY_APP_ID };
