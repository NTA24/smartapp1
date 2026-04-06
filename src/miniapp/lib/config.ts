import { storeGet, storeSet } from "./store";

const STORAGE_KEY_APP_ID = "miniapp_app_id";
export const DEFAULT_MINIAPP_APP_ID = "1512032299590111735808";
const DEFAULT_SMARTAPP_HOSTNAME = "smartapp-ten.vercel.app";
const DEFAULT_PUBLIC_API_BASE = "https://smartapp-ten.vercel.app/api";
/** Mini-app API (user-info, SmartBuilding devices/by-username, …) — campus host. */
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

/** Customer ID cố định — danh sách thiết bị mẫu (GET /api/customer/{id}/devices). */
export const NEWGEN_SAMPLE_CUSTOMER_ID = "e08bac50-2dd5-11f1-818c-272cb13706a3";

export function getNewgenSampleDevicesApiKey(): string {
  const raw = (import.meta.env as Record<string, unknown>).VITE_NEWGEN_SAMPLE_DEVICES_API_KEY;
  return String(raw ?? "").trim();
}

/**
 * JWT ThingsBoard (POST `…/api/auth/login`) — **bắt buộc** để mở `wss://…/api/ws` (ThingsBoard không chấp nhận ApiKey làm token WS).
 * Có thể dán cả `Bearer eyJ...` hoặc chỉ `eyJ...`. Hết hạn → đóng `1011 Invalid JWT` → cần token mới.
 */
export function getNewgenWsJwt(): string {
  let raw = String((import.meta.env as Record<string, unknown>).VITE_NEWGEN_WS_JWT ?? "").trim();
  if (/^bearer\s+/i.test(raw)) raw = raw.replace(/^bearer\s+/i, "").trim();
  return raw;
}

/** Query giống spec ThingsBoard: pageSize, page, type, textSearch, sortProperty, sortOrder. */
export function getNewgenCustomerDevicesUrl(
  customerId: string,
  opts: { pageSize?: number; page?: number } = {},
): string {
  const pageSize = opts.pageSize ?? 5;
  const page = opts.page ?? 0;
  const q = new URLSearchParams({
    pageSize: String(pageSize),
    page: String(page),
    type: "",
    textSearch: "",
    sortProperty: "",
    sortOrder: "",
  });
  return `${NEWGEN_API_BASE}/customer/${encodeURIComponent(customerId)}/devices?${q.toString()}`;
}

/** POST telemetry SHARED_SCOPE — `{ "power"|"cmd-sw1"…: "on"|"off" }` tùy thiết bị. */
export function getNewgenDeviceSharedScopeTelemetryUrl(deviceId: string): string {
  return `${NEWGEN_API_BASE}/plugins/telemetry/DEVICE/${encodeURIComponent(deviceId)}/SHARED_SCOPE`;
}

/** POST CLIENT_SCOPE — `{ "state-plug": "on"|"off" }` (tùy chọn / tích hợp khác). */
export function getNewgenDeviceClientScopeTelemetryUrl(deviceId: string): string {
  return `${NEWGEN_API_BASE}/plugins/telemetry/DEVICE/${encodeURIComponent(deviceId)}/CLIENT_SCOPE`;
}

/**
 * GET attribute values — ThingsBoard:
 * `/plugins/telemetry/DEVICE/{id}/values/attributes/{scope}?keys=state-sw1,…`
 */
export function getNewgenDeviceAttributeValuesUrl(
  deviceId: string,
  scope: "SHARED_SCOPE" | "SERVER_SCOPE" | "CLIENT_SCOPE",
  keys: string[],
): string {
  const q = new URLSearchParams({ keys: keys.join(",") });
  return `${NEWGEN_API_BASE}/plugins/telemetry/DEVICE/${encodeURIComponent(deviceId)}/values/attributes/${scope}?${q.toString()}`;
}

/**
 * GET timeseries — widget dashboard dùng `GET_TIME_SERIES` + key `smokeDetected`.
 * ThingsBoard: `interval=0`, `agg=NONE`, lấy mẫu mới nhất trong [startTs, endTs].
 */
export function getNewgenDeviceTimeseriesUrl(
  deviceId: string,
  keys: string[],
  opts: { startTs: number; endTs: number; limit?: number },
): string {
  const q = new URLSearchParams({
    keys: keys.join(","),
    startTs: String(opts.startTs),
    endTs: String(opts.endTs),
    interval: "0",
    agg: "NONE",
    limit: String(Math.max(1, opts.limit ?? 100)),
  });
  return `${NEWGEN_API_BASE}/plugins/telemetry/DEVICE/${encodeURIComponent(deviceId)}/values/timeseries?${q.toString()}`;
}

/**
 * WebSocket NewGen — `wss://…/api/ws` (không dùng `/ws/plugins/telemetry`).
 * Auth: `?token=` + `authCmd` — ưu tiên JWT (`VITE_NEWGEN_WS_JWT`), không có thì ApiKey mẫu (`VITE_NEWGEN_SAMPLE_DEVICES_API_KEY`).
 */
export function getNewgenWsTelemetryUrl(): string {
  return NEWGEN_API_BASE.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws")) + "/ws";
}

/**
 * `true` (mặc định): gửi subscribe dạng `{ "cmds": [ { type, entityType, entityId, scope, keys, cmdId } ] }`
 * như gateway NewGen/TB. `false`: dùng `tsSubCmds` / `attrSubCmds` (ThingsBoard UI cũ).
 */
export function getNewgenWsUseCmdsFormat(): boolean {
  const raw = String((import.meta.env as Record<string, unknown>).VITE_NEWGEN_WS_USE_CMDS_FORMAT ?? "")
    .trim()
    .toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

/** ThingsBoard login — giống demo HTML `login()` → `/api/auth/login`. */
export function getNewgenTbUsername(): string {
  return String((import.meta.env as Record<string, unknown>).VITE_NEWGEN_TB_USERNAME ?? "").trim();
}

export function getNewgenTbPassword(): string {
  return String((import.meta.env as Record<string, unknown>).VITE_NEWGEN_TB_PASSWORD ?? "").trim();
}

/** Base URL cho ThingsBoard REST (dùng cho login, attribute, …). */
export function getNewgenApiBase(): string {
  return NEWGEN_API_BASE;
}

export { STORAGE_KEY_APP_ID };
