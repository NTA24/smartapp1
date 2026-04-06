import {
  getNewgenCustomerDevicesUrl,
  getNewgenDeviceAttributeValuesUrl,
  getNewgenDeviceClientScopeTelemetryUrl,
  getNewgenDeviceSharedScopeTelemetryUrl,
  getNewgenDeviceTimeseriesUrl,
  getNewgenSampleDevicesApiKey,
  getNewgenWsJwt,
  NEWGEN_SAMPLE_CUSTOMER_ID,
  NEWGEN_DEVICE_WITH_CREDENTIALS_URL,
  SMART_BUILDING_BASE_URL,
} from "../lib/config";

/** GET timeseries TB: ưu tiên ApiKey mẫu; không có thì dùng JWT (cùng lúc với WS). */
function getNewgenTelemetryReadHeaders(): Record<string, string> | null {
  const apiKey = getNewgenSampleDevicesApiKey();
  if (apiKey) {
    return {
      Accept: "application/json",
      "X-Authorization": `ApiKey ${apiKey}`,
    };
  }
  const jwt = getNewgenWsJwt();
  if (jwt) {
    return {
      Accept: "application/json",
      "X-Authorization": `Bearer ${jwt}`,
    };
  }
  return null;
}

const JSON_POST_HEADERS_BASE = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

/**
 * POST SHARED_SCOPE (bật/tắt) — ApiKey mẫu hoặc Bearer JWT (giống GET timeseries).
 * Mini-app gọi các hàm POST công khai qua `deviceControlHttp.ts` (tách biệt với WS chỉ đọc).
 */
function getNewgenSharedScopeWriteHeaders(): Record<string, string> | null {
  const apiKey = getNewgenSampleDevicesApiKey();
  if (apiKey) {
    return { ...JSON_POST_HEADERS_BASE, "X-Authorization": `ApiKey ${apiKey}` };
  }
  const jwt = getNewgenWsJwt();
  if (jwt) {
    return { ...JSON_POST_HEADERS_BASE, "X-Authorization": `Bearer ${jwt}` };
  }
  return null;
}

export interface TbEntityId {
  id: string;
  entityType: string;
}

export interface TbDevice {
  id: TbEntityId;
  createdTime?: number;
  tenantId?: TbEntityId;
  customerId?: TbEntityId;
  name?: string;
  type?: string;
  label?: string;
  deviceProfileId?: TbEntityId;
  firmwareId?: TbEntityId;
  softwareId?: TbEntityId;
  version?: number;
  additionalInfo?: Record<string, unknown>;
  deviceData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SmartBuildingDeviceRecord {
  createdTime?: number;
  device?: TbDevice;
  deviceEntityType?: string;
  deviceId?: string;
  deviceType?: string;
  label?: string;
  name?: string;
  storedAt?: string;
  username?: string;
  [key: string]: unknown;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function readMessage(data: unknown): string {
  const record = asRecord(data);
  if (!record) return "";
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  return "";
}

function parseTbDevice(data: unknown): TbDevice | null {
  const record = asRecord(data);
  if (!record) return null;
  const id = asRecord(record.id);
  if (!id || typeof id.id !== "string" || typeof id.entityType !== "string") return null;
  return {
    ...(record as TbDevice),
    id: { id: id.id, entityType: id.entityType },
  };
}

function parseSmartBuildingDeviceRecord(data: unknown): SmartBuildingDeviceRecord | null {
  const record = asRecord(data);
  if (!record) return null;
  return record as SmartBuildingDeviceRecord;
}

function getNewGenApiKey(): string {
  const env = typeof import.meta !== "undefined"
    ? (import.meta.env as Record<string, unknown>).VITE_NEWGEN_API_KEY
    : undefined;
  return String(env ?? "").trim();
}

export async function createDeviceInNewGen(body: Record<string, unknown>): Promise<TbDevice> {
  const apiKey = getNewGenApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_NEWGEN_API_KEY");
  }

  const res = await fetch(NEWGEN_DEVICE_WITH_CREDENTIALS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ThingsBoard/NewGen usually accepts Bearer token in X-Authorization
      "X-Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `NewGen HTTP ${res.status}`);
  }
  const parsed = parseTbDevice(data);
  if (!parsed) throw new Error("Invalid NewGen device response");
  return parsed;
}

export async function saveDeviceToSmartBuilding(username: string, device: TbDevice): Promise<SmartBuildingDeviceRecord> {
  const res = await fetch(`${SMART_BUILDING_BASE_URL}/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, device }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Save device HTTP ${res.status}`);
  }
  const parsed = parseSmartBuildingDeviceRecord(data);
  if (!parsed) throw new Error("Invalid SmartBuilding save response");
  return parsed;
}

/** Smart Home: 5 thiết bị / trang; dùng `page` (0-based) + `hasNext` để phân trang. */
export const NEWGEN_SAMPLE_PAGE_SIZE = 5;

export interface NewgenCustomerDevicesPageResult {
  devices: SmartBuildingDeviceRecord[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

/** Danh sách thiết bị theo customer (Newgen / ThingsBoard) — header ApiKey. */
export async function fetchNewgenCustomerDevices(
  customerId: string,
  opts: { pageSize?: number; page?: number } = {},
): Promise<NewgenCustomerDevicesPageResult> {
  const apiKey = getNewgenSampleDevicesApiKey();
  if (!apiKey) {
    throw new Error("Thiếu VITE_NEWGEN_SAMPLE_DEVICES_API_KEY trong .env");
  }
  const pageSize = opts.pageSize ?? NEWGEN_SAMPLE_PAGE_SIZE;
  const page = opts.page ?? 0;
  const url = getNewgenCustomerDevicesUrl(customerId, { pageSize, page });
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Authorization": `ApiKey ${apiKey}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `NewGen customer devices HTTP ${res.status}`);
  }
  const record = asRecord(data);
  const arr = record?.data;
  const devices = !Array.isArray(arr)
    ? []
    : arr
        .map((item) => {
          const dev = parseTbDevice(item);
          if (!dev) return null;
          const rec: SmartBuildingDeviceRecord = {
            device: dev,
            deviceId: dev.id.id,
            deviceType: dev.type,
            label: dev.label,
            name: dev.name,
          };
          return rec;
        })
        .filter((item): item is SmartBuildingDeviceRecord => item !== null);

  const totalPages = typeof record?.totalPages === "number" ? record.totalPages : 0;
  const totalElements = typeof record?.totalElements === "number" ? record.totalElements : 0;
  const hasNext = record?.hasNext === true;

  return {
    devices,
    page,
    pageSize,
    totalPages,
    totalElements,
    hasNext,
  };
}

/** Thiết bị mẫu cho Smart Home — customer ID cố định; `page` 0-based. */
export async function fetchNewgenCustomerSampleDevices(page = 0): Promise<NewgenCustomerDevicesPageResult> {
  return fetchNewgenCustomerDevices(NEWGEN_SAMPLE_CUSTOMER_ID, {
    pageSize: NEWGEN_SAMPLE_PAGE_SIZE,
    page,
  });
}

function parseEnvDeviceIdList(envKey: string): string[] {
  return String(
    (typeof import.meta !== "undefined" ? (import.meta.env as Record<string, unknown>)[envKey] : "") ?? "",
  )
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const envDeviceIdSetCache = new Map<string, Set<string>>();

function getCachedEnvDeviceIdSet(envKey: string): Set<string> {
  const cached = envDeviceIdSetCache.get(envKey);
  if (cached) return cached;
  const parsed = parseEnvDeviceIdList(envKey);
  const parsedSet = new Set(parsed);
  envDeviceIdSetCache.set(envKey, parsedSet);
  return parsedSet;
}

function getDeviceId(d: SmartBuildingDeviceRecord): string {
  return String(d.deviceId ?? d.device?.id?.id ?? "").trim();
}

const deviceSearchTextCache = new WeakMap<SmartBuildingDeviceRecord, string>();

function getDeviceSearchText(d: SmartBuildingDeviceRecord): string {
  const cached = deviceSearchTextCache.get(d);
  if (cached !== undefined) return cached;
  const t = [
    d.label,
    d.name,
    d.device?.label,
    d.device?.name,
    d.deviceType,
    d.device?.type,
  ]
    .map((x) => String(x ?? "").toLowerCase())
    .join(" ");
  deviceSearchTextCache.set(d, t);
  return t;
}

/** Nhận diện công tắc (Smart Switch) để gửi telemetry `power` lên Newgen. */
export function isSmartSwitchTelemetryDevice(d: SmartBuildingDeviceRecord): boolean {
  const id = getDeviceId(d);
  const gatewayIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_GATEWAY_SOCKET_DEVICE_IDS");
  if (id && gatewayIds.size > 0 && gatewayIds.has(id)) return false;

  const envIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_SMART_SWITCH_DEVICE_IDS");
  if (id && envIds.size > 0 && envIds.has(id)) return true;

  const t = getDeviceSearchText(d);
  return (
    t.includes("switch") ||
    t.includes("công tắc") ||
    t.includes("cong tac")
  );
}

/**
 * Gateway / Home Assistant plug (dashboard: GET `state-plug`, SET SHARED `cmd-socket`).
 * Nếu thiết bị không khớp tên (ví dụ chỉ là "Đèn X") — thêm UUID vào `VITE_NEWGEN_GATEWAY_SOCKET_DEVICE_IDS`.
 */
export function isGatewaySocketTelemetryDevice(d: SmartBuildingDeviceRecord): boolean {
  const id = getDeviceId(d);
  const envIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_GATEWAY_SOCKET_DEVICE_IDS");
  if (id && envIds.size > 0 && envIds.has(id)) return true;

  const t = getDeviceSearchText(d);
  if (
    /\b(gateway|hub|bridge|coordinator|zigbee|mqtt broker|điều khiển trung tâm)\b/.test(t)
  ) {
    return true;
  }
  if (/^home assistant$/i.test(String(d.label ?? d.device?.label ?? "").trim())) {
    return true;
  }
  // Đèn hành lang / ổ cắm / plug — nếu không gắn nhãn "gateway" vẫn cần WS `state-plug`
  if (
    /hành\s*lang|hanh\s*lang|hallway|hall\s+plug|đèn\s+hành|den\s+hanh/.test(t) ||
    /ổ\s*cắm|o\s*cam|smart\s*plug|wall\s*socket|ổ\s*điện|o\s*dien/.test(t)
  ) {
    return true;
  }
  // Dashboard TB: "Đèn chiếu sáng hành lang" — widget Power → POST `cmd-socket`
  if (
    (/chiếu\s*sáng|chieu\s+sang/.test(t) || /đèn\s+chiếu|den\s+chieu/.test(t)) &&
    /hành\s*lang|hanh\s*lang|hallway/.test(t)
  ) {
    return true;
  }
  return false;
}

/** LED strip / đèn dải — WS `state-light` + `color-temp-light`; POST SHARED `cmd-light` + `cmd-color-temp-light`. */
export function isLedStripTelemetryDevice(d: SmartBuildingDeviceRecord): boolean {
  if (isSmartSwitchTelemetryDevice(d)) return false;
  const id = getDeviceId(d);
  const envIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_LED_STRIP_DEVICE_IDS");
  if (id && envIds.size > 0 && envIds.has(id)) return true;

  const t = getDeviceSearchText(d);
  return (
    /led\s*strip|strip\s*led|dải\s*led|dai\s*led|rgb\s*strip|đèn\s*dải|den\s*dai|dây\s*led|day\s*led/.test(t) ||
    (/color[\s-]*temp|nhiệt\s*độ\s*màu|nhiet\s*do\s*mau/.test(t) && /\bled\b|đèn|den/.test(t))
  );
}

/** Cảm biến khói — timeseries `smokeDetected` (status_widget). */
export function isSmokeSensorTelemetryDevice(d: SmartBuildingDeviceRecord): boolean {
  const id = getDeviceId(d);
  const envIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_SMOKE_SENSOR_DEVICE_IDS");
  if (id && envIds.size > 0 && envIds.has(id)) return true;

  const t = getDeviceSearchText(d);
  return /\bsmoke\b|\bkhói\b|\bkhoi\b|cảm biến khói|cam bien khoi|smoke sensor|báo khói|bao khoi/.test(t);
}

/** Cảm biến người (PIR/human presence) — timeseries `human_sensor`. */
export function isHumanSensorTelemetryDevice(d: SmartBuildingDeviceRecord): boolean {
  const id = getDeviceId(d);
  const envIds = getCachedEnvDeviceIdSet("VITE_NEWGEN_HUMAN_SENSOR_DEVICE_IDS");
  if (id && envIds.size > 0 && envIds.has(id)) return true;

  const t = getDeviceSearchText(d);
  return /\bhuman\b|\bpir\b|\bpresence\b|\bngười\b|\bperson\b|human sensor|cảm biến người|cam bien nguoi/.test(t);
}

/** Key timeseries — khớp với `smoke_sensor` trong WS và dashboard widget. */
export const SMOKE_DETECTED_TELEMETRY_KEY = "smoke_sensor";

/** Alias dashboard cũ / rule TB — cùng ý nghĩa với `smoke_sensor`. */
export const SMOKE_DETECTED_TELEMETRY_KEY_ALT = "smokeDetected";

/** Key timeseries — cảm biến người. */
export const HUMAN_SENSOR_TELEMETRY_KEY = "human_sensor";

/** Alias — cùng ý nghĩa với `human_sensor`. */
export const HUMAN_SENSOR_TELEMETRY_KEY_ALT = "humanDetected";

/**
 * Cùng logic `dataToValueFunction` trong dashboard (boolean / chuỗi alarm).
 */
/**
 * Parse giá trị `smoke_sensor` / `smokeDetected` từ WS hoặc HTTP timeseries.
 * Nhận biết: `"detected"` → true, `"cleared"` → false + các dạng boolean/chuỗi khác.
 */
export function parseSmokeDetectedValue(data: unknown): boolean {
  if (data === true || data === 1) return true;
  if (data === false || data === 0) return false;
  if (typeof data === "string") {
    const v = data.toLowerCase().trim();
    if (v === "cleared" || v === "clear" || v === "normal" || v === "off" || v === "false" || v === "0") {
      return false;
    }
    return (
      v === "detected" ||
      v === "alarm" ||
      v === "fire" ||
      v === "on" ||
      v === "true" ||
      v === "1" ||
      v === "smoke"
    );
  }
  return false;
}

function latestTimeseriesValue(
  payload: unknown,
  key: string,
): unknown {
  if (!payload || typeof payload !== "object") return undefined;
  const root = payload as Record<string, unknown>;
  let series: unknown = root[key];
  if (series === undefined && root.data !== null && typeof root.data === "object") {
    series = (root.data as Record<string, unknown>)[key];
  }
  if (!Array.isArray(series) || series.length === 0) return undefined;

  const first = series[0];
  if (Array.isArray(first) && first.length >= 2 && typeof first[0] === "number") {
    let maxTs = Number.NEGATIVE_INFINITY;
    let latest: unknown = undefined;
    for (const row of series) {
      if (!Array.isArray(row) || row.length < 2 || typeof row[0] !== "number") continue;
      if (row[0] > maxTs) {
        maxTs = row[0];
        latest = row[1];
      }
    }
    return latest;
  }

  let maxTs = Number.NEGATIVE_INFINITY;
  let latest: unknown = undefined;
  for (const point of series) {
    if (point === null || typeof point !== "object" || Array.isArray(point) || !("value" in point)) continue;
    const typed = point as { ts?: number; value?: unknown };
    const ts = typeof typed.ts === "number" ? typed.ts : 0;
    if (ts > maxTs) {
      maxTs = ts;
      latest = typed.value;
    }
  }
  return latest;
}

/**
 * Đọc giá trị mới nhất của `smokeDetected` (GET timeseries).
 */
export async function fetchDeviceSmokeDetectedLatest(deviceId: string): Promise<boolean | null> {
  const headers = getNewgenTelemetryReadHeaders();
  if (!headers) return null;
  const endTs = Date.now();
  const startTs = endTs - 90 * 24 * 60 * 60 * 1000;
  const url = getNewgenDeviceTimeseriesUrl(
    deviceId,
    [SMOKE_DETECTED_TELEMETRY_KEY, SMOKE_DETECTED_TELEMETRY_KEY_ALT],
    {
      startTs,
      endTs,
      limit: 500,
    },
  );
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    let raw = latestTimeseriesValue(data, SMOKE_DETECTED_TELEMETRY_KEY);
    if (raw === undefined || raw === null) {
      raw = latestTimeseriesValue(data, SMOKE_DETECTED_TELEMETRY_KEY_ALT);
    }
    if (raw === undefined || raw === null) return null;
    return parseSmokeDetectedValue(raw);
  } catch {
    return null;
  }
}

/** Đọc giá trị mới nhất của `human_sensor` (GET timeseries). */
export async function fetchDeviceHumanSensorLatest(deviceId: string): Promise<boolean | null> {
  const headers = getNewgenTelemetryReadHeaders();
  if (!headers) return null;
  const endTs = Date.now();
  const startTs = endTs - 90 * 24 * 60 * 60 * 1000;
  const url = getNewgenDeviceTimeseriesUrl(deviceId, [HUMAN_SENSOR_TELEMETRY_KEY, HUMAN_SENSOR_TELEMETRY_KEY_ALT], {
    startTs,
    endTs,
    limit: 500,
  });
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    let raw = latestTimeseriesValue(data, HUMAN_SENSOR_TELEMETRY_KEY);
    if (raw === undefined || raw === null) {
      raw = latestTimeseriesValue(data, HUMAN_SENSOR_TELEMETRY_KEY_ALT);
    }
    if (raw === undefined || raw === null) return null;
    return parseSmokeDetectedValue(raw);
  } catch {
    return null;
  }
}

const SHARED_SCOPE_CMD_KEYS = ["cmd-sw1", "cmd-sw2", "cmd-sw3", "cmd-sw4"] as const;

/** Trạng thái đọc từ attribute (dashboard power_button — GET_ATTRIBUTE `state-sw1`…). */
export const SMART_SWITCH_STATE_KEYS = ["state-sw1", "state-sw2", "state-sw3", "state-sw4"] as const;

export type SmartSwitchChannel = 1 | 2 | 3 | 4;

function parseSwitchStateValue(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "on" || s === "true" || s === "1";
}

function parseAttributesToSwitchTuple(data: unknown): [boolean, boolean, boolean, boolean] | null {
  const map: Record<string, unknown> = {};
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object" && "key" in row && "value" in row) {
        const r = row as { key: string; value: unknown };
        map[String(r.key)] = r.value;
      }
    }
  } else if (data && typeof data === "object") {
    for (const k of SMART_SWITCH_STATE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        map[k] = (data as Record<string, unknown>)[k];
      }
    }
  }
  const anyPresent = SMART_SWITCH_STATE_KEYS.some((k) => map[k] !== undefined);
  if (!anyPresent) return null;
  return [
    parseSwitchStateValue(map["state-sw1"]),
    parseSwitchStateValue(map["state-sw2"]),
    parseSwitchStateValue(map["state-sw3"]),
    parseSwitchStateValue(map["state-sw4"]),
  ];
}

/**
 * Đồng bộ trạng thái 4 kênh từ ThingsBoard attributes `state-sw1`…`state-sw4`
 * (cùng logic widget dashboard: GET_ATTRIBUTE).
 * Thử SERVER_SCOPE → SHARED_SCOPE → CLIENT_SCOPE.
 */
export async function fetchDeviceSwitchChannelStates(
  deviceId: string,
): Promise<[boolean, boolean, boolean, boolean] | null> {
  const apiKey = getNewgenSampleDevicesApiKey();
  if (!apiKey) return null;
  const keys = [...SMART_SWITCH_STATE_KEYS];
  const scopes = ["SERVER_SCOPE", "SHARED_SCOPE", "CLIENT_SCOPE"] as const;
  for (const scope of scopes) {
    const url = getNewgenDeviceAttributeValuesUrl(deviceId, scope, keys);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Authorization": `ApiKey ${apiKey}`,
        },
      });
      if (!res.ok) continue;
      const data: unknown = await res.json().catch(() => null);
      const tuple = parseAttributesToSwitchTuple(data);
      if (tuple) {
        return tuple;
      }
    } catch {
      /* thử scope khác */
    }
  }
  return null;
}

/** Attribute trạng thái ổ cắm / gateway (widget power_button). */
export const GATEWAY_PLUG_STATE_KEY = "state-plug";

function extractAttributeValue(data: unknown, key: string): unknown {
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object" && "key" in row) {
        const r = row as { key: string; value: unknown };
        if (String(r.key) === key) return r.value;
      }
    }
  } else if (data && typeof data === "object" && Object.prototype.hasOwnProperty.call(data, key)) {
    return (data as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Đọc `state-plug` (GET_ATTRIBUTE như dashboard HA gateway / đèn hành lang).
 */
export async function fetchDeviceGatewayPlugState(deviceId: string): Promise<boolean | null> {
  const headers = getNewgenTelemetryReadHeaders();
  if (!headers) return null;
  const keys = [GATEWAY_PLUG_STATE_KEY];
  const scopes = ["SERVER_SCOPE", "SHARED_SCOPE", "CLIENT_SCOPE"] as const;
  for (const scope of scopes) {
    const url = getNewgenDeviceAttributeValuesUrl(deviceId, scope, keys);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
      });
      if (!res.ok) continue;
      const data: unknown = await res.json().catch(() => null);
      const v = extractAttributeValue(data, GATEWAY_PLUG_STATE_KEY);
      if (v !== undefined && v !== null) {
        return parseSwitchStateValue(v);
      }
    } catch {
      /* scope khác */
    }
  }
  return null;
}

/**
 * POST `/api/plugins/telemetry/DEVICE/{id}/SHARED_SCOPE` — body `{ power: "on" | "off" }`.
 * (Legacy / thiết bị một kênh `power`.)
 */
export async function postDeviceSharedScopePower(deviceId: string, powerOn: boolean): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển thiết bị.");
  }
  const url = getNewgenDeviceSharedScopeTelemetryUrl(deviceId);
  const body = { power: powerOn ? "on" : "off" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Telemetry SHARED_SCOPE HTTP ${res.status}`);
  }
}

/**
 * Smart Switch 4 kênh — giống widget ThingsBoard (Power từng kênh):
 * `POST {NEWGEN_API_BASE}/plugins/telemetry/DEVICE/{deviceId}/SHARED_SCOPE`
 * với JSON **một key mỗi lần**: `{ "cmd-sw1": "on" | "off" }` … `{ "cmd-sw4": "on" | "off" }`.
 * Đọc trạng thái: attribute `state-sw1`…`state-sw4` (WS trong app).
 */
export async function postDeviceSharedScopeSwitchChannel(
  deviceId: string,
  channel: SmartSwitchChannel,
  on: boolean,
): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển thiết bị.");
  }
  const url = getNewgenDeviceSharedScopeTelemetryUrl(deviceId);
  const key = SHARED_SCOPE_CMD_KEYS[channel - 1];
  const body: Record<string, string> = { [key]: on ? "on" : "off" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Telemetry SHARED_SCOPE HTTP ${res.status}`);
  }
}

/**
 * POST CLIENT_SCOPE `{ "state-plug": "on"|"off" }` — tùy chọn (app đèn hành lang dùng SHARED `cmd-socket`).
 */
export async function postDeviceClientScopeStatePlug(deviceId: string, on: boolean): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển đèn hành lang.");
  }
  const url = getNewgenDeviceClientScopeTelemetryUrl(deviceId);
  const body: Record<string, string> = { [GATEWAY_PLUG_STATE_KEY]: on ? "on" : "off" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `CLIENT_SCOPE state-plug HTTP ${res.status}`);
  }
}

/**
 * HTTP SHARED_SCOPE `{ "cmd-socket": "on" | "off" }` — đường chính cho đèn hành lang NewGen (`sendGatewayPlugHallwayControl`).
 */
export async function postDeviceSharedScopeSocketPower(deviceId: string, on: boolean): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển gateway / đèn hành lang.");
  }
  const url = getNewgenDeviceSharedScopeTelemetryUrl(deviceId);
  const body = { "cmd-socket": on ? "on" : "off" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Telemetry SHARED_SCOPE HTTP ${res.status}`);
  }
}

/**
 * LED strip — POST SHARED_SCOPE `{ "cmd-light": "on" | "off" }`.
 */
export async function postDeviceSharedScopeLedLight(deviceId: string, on: boolean): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển LED.");
  }
  const url = getNewgenDeviceSharedScopeTelemetryUrl(deviceId);
  const body = { "cmd-light": on ? "on" : "off" };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Telemetry SHARED_SCOPE cmd-light HTTP ${res.status}`);
  }
}

/**
 * LED strip — POST SHARED_SCOPE `{ "cmd-color-temp-light": <0…100> }` (số nguyên).
 */
export async function postDeviceSharedScopeLedColorTemp(deviceId: string, value: number): Promise<void> {
  const headers = getNewgenSharedScopeWriteHeaders();
  if (!headers) {
    throw new Error("Cần VITE_NEWGEN_SAMPLE_DEVICES_API_KEY hoặc VITE_NEWGEN_WS_JWT để điều khiển LED.");
  }
  const v = Math.max(0, Math.min(100, Math.round(Number(value))));
  const url = getNewgenDeviceSharedScopeTelemetryUrl(deviceId);
  const body = { "cmd-color-temp-light": v };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Telemetry SHARED_SCOPE cmd-color-temp-light HTTP ${res.status}`);
  }
}

/** Fetch tất cả các trang thiết bị từ Newgen customer. Trả về [] nếu thiếu API key hoặc lỗi. */
async function fetchAllNewgenDevices(): Promise<SmartBuildingDeviceRecord[]> {
  const apiKey = getNewgenSampleDevicesApiKey();
  if (!apiKey) return [];
  const all: SmartBuildingDeviceRecord[] = [];
  let page = 0;
  try {
    while (true) {
      const result = await fetchNewgenCustomerDevices(NEWGEN_SAMPLE_CUSTOMER_ID, {
        pageSize: 100,
        page,
      });
      all.push(...result.devices);
      if (!result.hasNext) break;
      page++;
    }
  } catch {
    /* bỏ qua */
  }
  return all;
}

/** Chỉ NewGen — dùng cho trang Smart Home (không gọi campus `by-username`). */
export async function fetchSmartHomeDevicesFromNewgen(): Promise<SmartBuildingDeviceRecord[]> {
  return fetchAllNewgenDevices();
}

export async function getDevicesByUsername(username: string): Promise<SmartBuildingDeviceRecord[]> {
  const url = `${SMART_BUILDING_BASE_URL}/devices/by-username?username=${encodeURIComponent(username)}`;

  const [campusResult, newgenDevices] = await Promise.allSettled([
    fetch(url, { method: "GET", headers: { Accept: "application/json" } }).then(async (res) => {
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(`Get devices HTTP ${res.status}`);
      if (!Array.isArray(data)) return [];
      return data
        .map((item) => parseSmartBuildingDeviceRecord(item))
        .filter((item): item is SmartBuildingDeviceRecord => item !== null);
    }),
    fetchAllNewgenDevices(),
  ]);

  const campusDevices = campusResult.status === "fulfilled" ? campusResult.value : [];

  const newgen = newgenDevices.status === "fulfilled" ? newgenDevices.value : [];

  // Merge: campus takes priority; newgen fills in devices not already in campus (dedup by deviceId).
  const seenIds = new Set(campusDevices.map((d) => d.deviceId).filter(Boolean));
  const merged = [
    ...campusDevices,
    ...newgen.filter((d) => d.deviceId && !seenIds.has(d.deviceId)),
  ];
  return merged;
}

// Step 6 + Step 7 helper: create in NewGen then persist to SmartBuilding.
export async function createAndStoreDevice(
  username: string,
  newGenRequestBody: Record<string, unknown>,
): Promise<SmartBuildingDeviceRecord> {
  const created = await createDeviceInNewGen(newGenRequestBody);
  return saveDeviceToSmartBuilding(username, created);
}
