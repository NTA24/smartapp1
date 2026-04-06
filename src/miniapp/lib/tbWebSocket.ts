/**
 * NewGen WebSocket — đọc trạng thái (subscribe telemetry/attributes). Base URL `…/api/ws` (xem getNewgenWsTelemetryUrl).
 *
 * **Ổ cắm / đèn hành lang:** đọc qua WS `state-plug`; bật/tắt: HTTP `sendGatewayPlugHallwayControl` (mặc định SHARED_SCOPE `cmd-socket`).
 * Công tắc 4 kênh: subscribe hai lệnh ATTRIBUTES giống demo HTML + `processAttrs` trên mọi `onmessage`.
 *
 * Message: { subscriptionId, errorCode, data: { key: [[ts, value], ...] }, latestValues } — `latestValues` chỉ là ts/key, không merge vào giá trị attribute.
 * NewGen: lần đầu mở socket gửi **một** bản `{ authCmd, cmds }` (giống demo HTML); chỉ mở `wss://` không gửi `cmds` thì server không bơm dữ liệu.
 * LED strip: đọc `state-light`, `color-temp-light`; điều khiển HTTP SHARED `cmd-light`, `cmd-color-temp-light`.
 * smoke_sensor / human_sensor: `cleared` = bình thường, `detected` = cảnh báo (đỏ).
 * Auth: giống demo HTML — `login()` → JWT mới → `?token=` + `authCmd`.
 * Ưu tiên: JWT cứng chưa hết hạn → JWT cache (login trước đó) → auto-login → API key fallback.
 */
import { useEffect, useRef, useState } from "react";
import {
  getNewgenApiBase,
  getNewgenSampleDevicesApiKey,
  getNewgenTbPassword,
  getNewgenTbUsername,
  getNewgenWsJwt,
  getNewgenWsTelemetryUrl,
  getNewgenWsUseCmdsFormat,
} from "./config";
import { addLog } from "./debugLog";
import { fetchDeviceSwitchChannelStates } from "../services/deviceSync";
import { layersForProcessAttrs, mergeLayersIntoFlatAttrMap } from "./tbWsProcessAttrs";

/* ── Tracked keys — giống demo HTML switchKeys / commandKeys / trackedAttributeKeys ── */
const SWITCH_KEYS = ["state-sw1", "state-sw2", "state-sw3", "state-sw4"] as const;
const COMMAND_KEYS = ["cmd-sw1", "cmd-sw2", "cmd-sw3", "cmd-sw4"] as const;
const TRACKED_ATTR_KEYS = new Set<string>([...SWITCH_KEYS, ...COMMAND_KEYS]);

const SWITCH_KEY_TO_IDX: Record<string, 0 | 1 | 2 | 3> = {
  "state-sw1": 0, "state-sw2": 1, "state-sw3": 2, "state-sw4": 3,
  "cmd-sw1": 0, "cmd-sw2": 1, "cmd-sw3": 2, "cmd-sw4": 3,
};

/**
 * Giống demo `parseSwitchBool`: chuẩn hoá on/off.
 */
function parseSwitchBool(value: unknown): boolean {
  const n = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "t", "on", "yes"].includes(n);
}

/**
 * Giống demo `processAttrs(attrs)`:
 *   duyệt key → lọc trackedAttributeKeys → unwrap [[ts,val]] / {value} → gọi sink(key, value).
 */
function processAttrs(
  attrs: unknown,
  sink: (key: string, value: unknown) => void,
): void {
  if (!attrs || typeof attrs !== "object" || attrs === null) return;
  for (const [k, v] of Object.entries(attrs as Record<string, unknown>)) {
    if (!TRACKED_ATTR_KEYS.has(k)) continue;
    let value: unknown = v;
    if (Array.isArray(v) && v.length > 0) {
      const firstEntry = v[0];
      if (Array.isArray(firstEntry) && firstEntry.length >= 2) {
        value = firstEntry[1];
      }
    }
    if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
      value = (value as { value: unknown }).value;
    }
    sink(k, value);
  }
}

/** Listener nhận (key, parsedBool) sau mỗi WS message chứa switch data. */
type SmartSwitchWsListener = (key: string, on: boolean) => void;

const SMOKE_TS_KEY = "smoke_sensor";
/** Alias TB — log/push có thể dùng key này; subscribe thẻ chỉ dùng `smoke_sensor`. */
const SMOKE_TS_KEY_ALT = "smokeDetected";
const HUMAN_TS_KEY = "human_sensor";
/** Alias TB — giống `smokeDetected` cho khói. */
const HUMAN_TS_KEY_ALT = "humanDetected";
/** Attribute ổ cắm / đèn hành lang — chỉ subscribe đọc (CLIENT_SCOPE); điều khiển qua HTTP. */
const GATEWAY_PLUG_ATTR_KEY = "state-plug";

function unwrapTelemetryScalar(raw: unknown): unknown {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if ("value" in o) return o.value;
    if ("current" in o) return o.current;
  }
  return raw;
}

function isDetectedStateString(s: string): boolean {
  const t = s.replace(/\uFEFF/g, "").trim().toLowerCase();
  if (!t) return false;
  if (t === "not detected" || t === "undetected" || t === "no motion" || t === "no_presence") {
    return false;
  }
  if (t === "detected" || t === "motion" || t === "occupied" || t === "presence" || t === "active") {
    return true;
  }
  if (/\bdetected\b/.test(t)) return true;
  return false;
}

function mapPresenceWsPayloadToAlarmState(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;

  if (typeof raw === "string") {
    const q = raw.replace(/\uFEFF/g, "").trim().replace(/^["']+|["']+$/g, "").trim().toLowerCase();
    if (q === "detected") return true;
    if (q === "cleared" || q === "clear" || q === "normal") return false;
  }

  let cur: unknown = unwrapTelemetryScalar(raw);
  if (cur !== null && typeof cur === "object") {
    try {
      const j = JSON.stringify(cur).toLowerCase();
      if (/\bdetected\b/.test(j) && !/not\s+detected|undetected/.test(j)) return true;
      if (j.includes("cleared") || j.includes('"clear"')) return false;
    } catch {
      /* ignore */
    }
    cur = unwrapTelemetryScalar(cur);
  }

  if (cur === undefined || cur === null) return undefined;
  if (typeof cur === "boolean") return cur;
  if (typeof cur === "number") {
    if (cur === 0) return false;
    if (cur === 1) return true;
  }

  let s = String(cur).toLowerCase().trim();
  s = s.replace(/^["']|["']$/g, "").trim();
  if (!s) return undefined;

  if (s === "cleared" || s === "clear" || s === "normal" || s === "off" || s === "false" || s === "0") {
    return false;
  }
  if (isDetectedStateString(s)) return true;
  if (s.includes("cleared") || s.includes("clear")) return false;
  if (s === "alarm" || s === "fire" || s === "smoke" || s === "on" || s === "1" || s === "true") {
    return true;
  }

  try {
    const dump = JSON.stringify(raw).toLowerCase();
    if (dump.includes('"detected"') && !dump.includes("not detected") && !dump.includes("undetected")) {
      return true;
    }
  } catch {
    /* ignore */
  }

  return undefined;
}

function humanSensorValPreview(raw: unknown): string {
  try {
    const s = JSON.stringify(raw);
    return s.length > 120 ? s.slice(0, 120) + "…" : s;
  } catch {
    return String(raw).slice(0, 120);
  }
}

/** Luôn ghi 1 dòng mỗi khi có bản tin human (panel + console). */
function logHumanSensorWsLine(deviceId: string, raw: unknown): void {
  const id = deviceId.trim() || "?";
  const alarm = mapPresenceWsPayloadToAlarmState(raw);
  if (alarm === true) {
    addLog("[human_sensor]", id, "detected");
    return;
  }
  if (alarm === false) {
    addLog("[human_sensor]", id, "cleared");
    return;
  }
  addLog("[human_sensor]", id, "unparsed", humanSensorValPreview(raw));
}

/** WS đẩy attribute `state-plug` — chỉ đọc hiển thị realtime. */
function logGatewayPlugWsLine(deviceId: string, raw: unknown): void {
  const id = deviceId.trim() || "?";
  if (raw === undefined || raw === null) {
    addLog("[hallway_plug]", id, "unparsed", "null");
    return;
  }
  if (typeof raw === "boolean") {
    addLog("[hallway_plug]", id, raw ? "on" : "off");
    return;
  }
  const s = String(raw).toLowerCase().trim();
  if (s === "on" || s === "true" || s === "1") {
    addLog("[hallway_plug]", id, "on");
    return;
  }
  if (s === "off" || s === "false" || s === "0") {
    addLog("[hallway_plug]", id, "off");
    return;
  }
  addLog("[hallway_plug]", id, "unparsed", humanSensorValPreview(raw));
}

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

type ValueCb = (value: unknown) => void;
type BatchAttrCb = (attrKey: string, value: unknown) => void;

interface Sub {
  cmdId: number;
  deviceId: string;
  key: string;
  /**
   * Nếu có — gửi **một** lệnh ATTRIBUTES `keys: "k1,k2,…"` như demo HTML ThingsBoard (smart switch).
   */
  batchKeys?: readonly string[];
  batchAttrCb?: BatchAttrCb;
  /**
   * `client_attr` = CLIENT_SCOPE (demo TB: `state-sw*`, `state-plug`).
   * `shared_attr` = SHARED_SCOPE (demo: `cmd-sw*` sau POST điều khiển).
   * `attr` = SERVER_SCOPE; `ts` = timeseries hoặc ATTRIBUTES scope null (NewGen).
   */
  subType: "ts" | "attr" | "client_attr" | "shared_attr";
  cb: ValueCb;
}

interface TbWsMsg {
  subscriptionId?: number;
  errorCode?: number;
  errorMsg?: string | null;
  data?: Record<string, unknown>; // Cập nhật kiểu cho linh hoạt
  /** Map key → ts mới nhất (đôi khi kèm bản tin có `data`). */
  latestValues?: Record<string, unknown>;
  /** Một số bản TB kèm entity khi có nhiều thiết bị cùng key. */
  entityId?: string | { id?: string; entityType?: string };
  [key: string]: unknown;
}

/** TB đôi khi trả attributes dạng `[{ key, value }, …]` thay vì object phẳng. */
function mergeFlatIntoAcc(acc: Record<string, unknown>, o: unknown): void {
  if (o === undefined || o === null) return;
  if (Array.isArray(o)) {
    for (const row of o) {
      if (row && typeof row === "object" && row !== null && "key" in row) {
        const r = row as { key: string; value: unknown };
        acc[String(r.key)] = r.value;
      }
    }
    return;
  }
  if (typeof o === "object") {
    Object.assign(acc, o as Record<string, unknown>);
  }
}

function flattenAttributeData(data: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data === undefined || data === null) return out;
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object" && row !== null && "key" in row) {
        const r = row as { key: string; value: unknown };
        out[String(r.key)] = r.value;
      }
    }
    return out;
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    Object.assign(out, o);
    if ("data" in o && o.data !== undefined) {
      Object.assign(out, flattenAttributeData(o.data));
    }
    return out;
  }
  return out;
}

const SMART_SWITCH_LIKE_KEY_RE = /^state-sw[1-4]$|^cmd-sw[1-4]$/;

/** Quét cây JSON — một số bản TB lồng `state-sw*` sâu, không nằm phẳng trong `data`. */
function collectSmartSwitchLikeKeysDeep(node: unknown, acc: Record<string, unknown>): void {
  if (node === undefined || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const it of node) collectSmartSwitchLikeKeysDeep(it, acc);
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (SMART_SWITCH_LIKE_KEY_RE.test(k)) acc[k] = v;
    if (v !== undefined && v !== null && typeof v === "object") {
      collectSmartSwitchLikeKeysDeep(v, acc);
    }
  }
}

/**
 * Gộp payload phẳng cho vòng xử lý mặc định.
 * **`attrSubCmds` dạng mảng** không gộp vào đây — onmessage xử lý từng phần tử với **đúng `cmdId`** (ThingsBoard chuẩn).
 */
function mergeTbWsPayloadData(msg: TbWsMsg): Record<string, unknown> | null {
  const acc: Record<string, unknown> = {};

  /** `data` / `data.data` — không dùng `latestValues` (chỉ timestamp, sẽ ghi đè sai giá trị). */
  mergeLayersIntoFlatAttrMap(layersForProcessAttrs(msg as Record<string, unknown>), acc);

  mergeFlatIntoAcc(acc, msg.data);
  if (msg.data && typeof msg.data === "object" && msg.data !== null && !Array.isArray(msg.data)) {
    mergeFlatIntoAcc(acc, (msg.data as { data?: unknown }).data);
  }

  const ascRaw = (msg as { attrSubCmds?: unknown }).attrSubCmds;
  if (!Array.isArray(ascRaw) && ascRaw && typeof ascRaw === "object" && ascRaw !== null) {
    const o = ascRaw as Record<string, unknown>;
    if ("data" in o) mergeFlatIntoAcc(acc, o.data);
  }

  const msgAny = msg as Record<string, unknown>;
  mergeFlatIntoAcc(acc, msgAny.update);
  mergeFlatIntoAcc(acc, msgAny.result);

  /** `cmds[]` xử lý trong `onmessage` với đúng `cmdId` từng lệnh (NewGen) — không gộp phẳng ở đây. */

  const msgSansAttrArray = { ...(msg as Record<string, unknown>) };
  delete msgSansAttrArray.attrSubCmds;
  delete msgSansAttrArray.cmds;
  delete msgSansAttrArray.latestValues;
  collectSmartSwitchLikeKeysDeep(msgSansAttrArray, acc);

  return Object.keys(acc).length ? acc : null;
}

function tryReadEntityIdValue(x: unknown): string | undefined {
  if (typeof x === "string" && x.trim()) return x.trim();
  if (x && typeof x === "object" && x !== null && "id" in x && typeof (x as { id: unknown }).id === "string") {
    return String((x as { id: string }).id).trim();
  }
  return undefined;
}

function readMsgEntityId(msg: TbWsMsg): string | undefined {
  const fromRoot = tryReadEntityIdValue(msg.entityId);
  if (fromRoot) return fromRoot;
  /** Không đọc `entityId` trong `msg.data` — payload attribute có thể có key trùng / giá trị lạ. */
  const anyMsg = msg as Record<string, unknown>;
  const alt = tryReadEntityIdValue(anyMsg.deviceId) ?? tryReadEntityIdValue(anyMsg.originator);
  if (alt) return alt;
  return undefined;
}

function normalizeEntityIdForMatch(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

function entityIdsMatch(deviceId: string, msgEntityId: string | undefined): boolean {
  if (!msgEntityId?.trim()) return false;
  const a = normalizeEntityIdForMatch(deviceId.trim());
  const b = normalizeEntityIdForMatch(msgEntityId.trim());
  return a.length > 0 && a === b;
}

/**
 * Giống demo HTML `processAttrs` cho từng `v`:
 * `[[ts, val], …]` → lấy `v[0][1]`; object → `.value`.
 */
function extractTbWsAttributeValueLikeDemo(raw: unknown): unknown {
  let value: unknown = raw;

  if (Array.isArray(raw) && raw.length > 0) {
    const firstEntry = raw[0];
    if (Array.isArray(firstEntry) && firstEntry.length >= 2) {
      value = firstEntry[1];
    } else if (
      raw.length === 2 &&
      (typeof raw[0] === "number" || typeof raw[0] === "string")
    ) {
      value = raw[1];
    }
  }

  if (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "value")
  ) {
    value = (value as { value: unknown }).value;
  }

  return value;
}

/** TB đôi khi gửi `ts` dạng chuỗi số trong JSON — phải coerce kẻo `normalizeTelemetryPoints` trả null → không dispatch. */
function coerceTelemetryTs(ts: unknown): number {
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts === "string") {
    const n = Number(ts.trim().replace(/\uFEFF/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** TB có thể trả `[[ts, v], ...]`, `[ts, v]`, hoặc mảng object `[{ts: 123, value: v}]`. */
function normalizeTelemetryPoints(raw: unknown): [number, unknown][] | null {
  if (raw === undefined || raw === null) return null;

  // Xử lý trường hợp TB trả về mảng các object (VD: attributes hoặc TS format mới)
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "value" in raw[0]) {
    return raw.map((item) => {
      const row = item as { ts?: number; value?: unknown };
      return [coerceTelemetryTs(row.ts ?? Date.now()), row.value] as [number, unknown];
    });
  }

  if (!Array.isArray(raw) || raw.length === 0) return null;

  // Mảng 1 chiều [ts, value] — ts có thể là number hoặc string
  if (raw.length === 2 && (typeof raw[0] === "number" || typeof raw[0] === "string")) {
    return [[coerceTelemetryTs(raw[0]), raw[1]]];
  }

  // Mảng 2 chiều [[ts, value], ...] — ts từng dòng có thể là string
  const first = raw[0];
  if (Array.isArray(first) && first.length >= 2) {
    return (raw as unknown[][]).map((row) => {
      if (!Array.isArray(row) || row.length < 2) return [0, undefined] as [number, unknown];
      return [coerceTelemetryTs(row[0]), row[1]] as [number, unknown];
    });
  }

  return null;
}

function isJwtExpired(jwt: string): boolean {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 < Date.now() - 60_000;
  } catch {
    return false;
  }
}

/**
 * Giống demo HTML `login()`: POST `/api/auth/login` → lấy JWT mới.
 * Cache lại JWT + refreshToken trong memory.
 */
let _cachedLoginJwt = "";
let _loginInFlight: Promise<string | null> | null = null;

async function tbLogin(): Promise<string | null> {
  if (_loginInFlight) return _loginInFlight;
  _loginInFlight = (async () => {
    try {
      const baseUrl = getNewgenApiBase();
      const username = getNewgenTbUsername();
      const password = getNewgenTbPassword();
      if (!username || !password) return null;
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        addLog("[ws]", `TB login failed: HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { token?: string; refreshToken?: string };
      if (data.token) {
        _cachedLoginJwt = data.token;
        addLog("[ws]", "TB login OK — fresh JWT acquired");
        return data.token;
      }
      return null;
    } catch (e) {
      addLog("[ws]", `TB login error: ${String(e)}`);
      return null;
    } finally {
      _loginInFlight = null;
    }
  })();
  return _loginInFlight;
}

function getCachedLoginJwt(): string {
  return _cachedLoginJwt;
}

class TbWsManager {
  /** Gửi `v` tới đúng subscription(s) cho `key` — hỗ trợ nhiều thiết bị (entityId / subscriptionId) và trùng sub (StrictMode). */
  private dispatchTelemetryValue(
    key: string,
    v: unknown,
    sidNum: number,
    entityIdFromMsg: string | undefined,
  ): void {
    const matches = [...this.subs.values()].filter((s) =>
      s.batchKeys ? s.batchKeys.includes(key) : s.key === key,
    );
    if (matches.length === 0) return;

    const notify = (sub: Sub) => {
      if (sub.batchAttrCb) sub.batchAttrCb(key, v);
      else sub.cb(v);
    };

    if (matches.length === 1) {
      notify(matches[0]);
      return;
    }

    /**
     * Cùng thiết bị, nhiều lệnh WS cho `state-sw*` / `cmd-sw*` (CLIENT + SERVER + TS…): `subscriptionId` trong bản tin
     * chỉ khớp **một** `cmdId` — báo **tất cả** subscriber cùng `deviceId` để chắc `onState`/`onCmd` chạy (tránh lệch sid).
     */
    if (SMART_SWITCH_LIKE_KEY_RE.test(key)) {
      const d0 = matches[0].deviceId;
      if (matches.every((s) => s.deviceId === d0)) {
        matches.forEach(notify);
        return;
      }
    }

    /**
     * Giống `TelemetryWebsocketService.processOnMessage` (TB UI): ưu tiên **cmdId / subscriptionId**,
     * không `find` theo entity trước — tránh chỉ báo 1 subscription khi có nhiều lệnh cùng key (CLIENT + TIMESERIES).
     */
    if (!Number.isNaN(sidNum)) {
      const bySid = matches.filter((s) => s.cmdId === sidNum);
      if (bySid.length > 0) {
        bySid.forEach(notify);
        return;
      }
    }

    if (entityIdFromMsg) {
      const byEntity = matches.filter(
        (s) => s.deviceId === entityIdFromMsg || entityIdsMatch(s.deviceId, entityIdFromMsg),
      );
      if (byEntity.length > 0) {
        byEntity.forEach(notify);
        return;
      }
    }

    const d0 = matches[0].deviceId;
    if (matches.every((s) => s.deviceId === d0)) {
      matches.forEach(notify);
      return;
    }

    notify(matches[0]);
  }

  /** Một key attribute từ WS (đã là giá trị hoặc chuỗi TB telemetry) → unwrap → dispatch. */
  private dispatchWsAttrKey(
    k: string,
    rawPts: unknown,
    sidNum: number,
    entityId: string | undefined,
  ): void {
    const rows = normalizeTelemetryPoints(rawPts);
    const isHumanKey = k === HUMAN_TS_KEY || k === HUMAN_TS_KEY_ALT;
    const isGatewayPlugKey = k === GATEWAY_PLUG_ATTR_KEY;

    let v: unknown;
    if (rows && rows.length > 0) {
      const sorted = [...rows].sort((a, b) => Number(b[0]) - Number(a[0]));
      let cell: unknown = sorted[0][1];
      if (Array.isArray(cell) && cell.length === 1) cell = cell[0];
      v = unwrapTelemetryScalar(cell);
    } else {
      const demoUnwrapped = extractTbWsAttributeValueLikeDemo(rawPts);
      const candidate =
        demoUnwrapped !== undefined && demoUnwrapped !== null ? demoUnwrapped : rawPts;
      const flat = unwrapTelemetryScalar(candidate);
      if (flat === undefined || flat === null) {
        if (isHumanKey) {
          const matches = [...this.subs.values()].filter((s) =>
            s.batchKeys ? s.batchKeys.includes(k) : s.key === k,
          );
          const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
          addLog("[human_sensor]", dev || "?", "empty-or-bad-shape", humanSensorValPreview(rawPts));
        }
        if (isGatewayPlugKey) {
          const matches = [...this.subs.values()].filter((s) =>
            s.batchKeys ? s.batchKeys.includes(k) : s.key === k,
          );
          const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
          addLog("[hallway_plug]", dev || "?", "empty-or-bad-shape", humanSensorValPreview(rawPts));
        }
        return;
      }
      v = flat;
    }

    if (isHumanKey) {
      const matches = [...this.subs.values()].filter((s) =>
        s.batchKeys ? s.batchKeys.includes(k) : s.key === k,
      );
      const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
      logHumanSensorWsLine(dev || "?", v);
    }
    if (isGatewayPlugKey) {
      const matches = [...this.subs.values()].filter((s) =>
        s.batchKeys ? s.batchKeys.includes(k) : s.key === k,
      );
      const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
      logGatewayPlugWsLine(dev || "?", v);
    }

    this.dispatchTelemetryValue(k, v, sidNum, entityId);
  }

  private sendUnsubscribe(ws: WebSocket, sub: Sub): void {
    if (getNewgenWsUseCmdsFormat()) {
      ws.send(JSON.stringify({ cmds: [{ cmdId: sub.cmdId, unsubscribe: true }] }));
      return;
    }
    const unsubMsg =
      sub.subType === "ts"
        ? { tsSubCmds: [{ cmdId: sub.cmdId, unsubscribe: true }], attrSubCmds: [], historyCmds: [] }
        : {
            tsSubCmds: [],
            attrSubCmds: [{ cmdId: sub.cmdId, unsubscribe: true }],
            historyCmds: [],
          };
    ws.send(JSON.stringify(unsubMsg));
  }

  private ws: WebSocket | null = null;
  private nextId = 1;
  private subs = new Map<number, Sub>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_BASE_MS;
  private connecting = false;
  /** Server đóng WS với JWT không hợp lệ / hết hạn — không reconnect vô hạn với cùng token. */
  private wsAuthFatal = false;
  /** Đổi JWT / ApiKey trong .env → cho phép thử WS lại (không kẹt wsAuthFatal). */
  private lastWsTokenFingerprint = "";

  /**
   * Smart Switch listeners — giống demo HTML `ws.onmessage → processAttrs → updateAttributeState`.
   * Mỗi WS message: chạy `processAttrs(msg.data)` + `processAttrs(msg.data?.data)` + `processAttrs(msg.attrSubCmds?.data)`
   * → gọi listener với (key, parsedBool).
   */
  private smartSwitchListeners = new Set<SmartSwitchWsListener>();

  subscribeSmartSwitch(cb: SmartSwitchWsListener): () => void {
    this.smartSwitchListeners.add(cb);
    return () => { this.smartSwitchListeners.delete(cb); };
  }

  private deliverSmartSwitchFromMsg(msg: Record<string, unknown>): void {
    if (this.smartSwitchListeners.size === 0) return;
    const sink = (key: string, value: unknown) => {
      const on = parseSwitchBool(value);
      for (const cb of this.smartSwitchListeners) {
        try { cb(key, on); } catch { /* ignore */ }
      }
    };
    processAttrs(msg.data, sink);
    if (msg.data && typeof msg.data === "object" && "data" in (msg.data as object)) {
      processAttrs((msg.data as { data: unknown }).data, sink);
    }
    const asc = msg.attrSubCmds;
    if (asc && typeof asc === "object" && !Array.isArray(asc) && "data" in (asc as object)) {
      processAttrs((asc as { data: unknown }).data, sink);
    }
  }

  /**
   * Giống demo `runDemo()`: login → connectWs → subscribeLatestAttributes.
   * Ưu tiên: (1) JWT cứng chưa hết hạn, (2) JWT login cache, (3) auto-login, (4) API key fallback.
   */
  ensureConnected(): void {
    if (this.wsAuthFatal) return;
    if (this.connecting) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.connecting = true;

    void this.resolveTokenAndConnect();
  }

  private async resolveTokenAndConnect(): Promise<void> {
    const envJwt = getNewgenWsJwt();
    const cached = getCachedLoginJwt();
    const apiKey = getNewgenSampleDevicesApiKey();

    let token = "";
    if (envJwt && !isJwtExpired(envJwt)) {
      token = envJwt;
    } else if (cached && !isJwtExpired(cached)) {
      token = cached;
    } else {
      const fresh = await tbLogin();
      if (fresh) {
        token = fresh;
      } else if (apiKey) {
        token = apiKey;
      }
    }

    if (!token) {
      addLog("[ws]", "No valid token available — cannot connect WS");
      this.connecting = false;
      return;
    }

    if (token !== this.lastWsTokenFingerprint) {
      this.lastWsTokenFingerprint = token;
      this.wsAuthFatal = false;
    }

    this.connectWithToken(token);
  }

  private connectWithToken(token: string): void {
    const baseUrl = getNewgenWsTelemetryUrl();
    const urlWithToken = `${baseUrl}?token=${encodeURIComponent(token)}`;

    const ws = (this.ws = new WebSocket(urlWithToken));

    ws.onopen = () => {
      this.connecting = false;
      this.reconnectDelay = RECONNECT_BASE_MS;

      if (getNewgenWsUseCmdsFormat()) {
        const cmds = [...this.subs.values()].map((s) => this.buildNewgenCmd(s));
        const authCmd = { cmdId: 0, type: "AUTH" as const, token };
        if (cmds.length > 0) {
          ws.send(JSON.stringify({ authCmd, cmds }));
        } else {
          ws.send(JSON.stringify({ authCmd }));
        }
        return;
      }

      const authMsg = { authCmd: { cmdId: 0, token } };
      ws.send(JSON.stringify(authMsg));
      for (const sub of this.subs.values()) this.doSend(ws, sub);
    };

    ws.onmessage = ({ data }) => {
      try {
        const raw = String(data);
        const msg = JSON.parse(raw) as TbWsMsg;

        const err = msg.errorCode ?? 0;
        const msgEntity = readMsgEntityId(msg);

        this.deliverSmartSwitchFromMsg(msg as Record<string, unknown>);

        let hadAttrSubPartDispatch = false;
        const ascRaw = (msg as { attrSubCmds?: unknown }).attrSubCmds;
        if (Array.isArray(ascRaw)) {
          for (const part of ascRaw) {
            if (!part || typeof part !== "object") continue;
            const p = part as Record<string, unknown>;
            const partErr = typeof p.errorCode === "number" ? p.errorCode : 0;
            if (partErr !== 0) continue;

            const scmd = p.cmdId;
            const sidNum =
              typeof scmd === "number"
                ? scmd
                : scmd !== undefined && scmd !== null && String(scmd).trim() !== ""
                  ? Number(scmd)
                  : NaN;

            const flat = flattenAttributeData(p.data);
            for (const key of Object.keys(flat)) {
              this.dispatchWsAttrKey(key, flat[key], sidNum, msgEntity);
              hadAttrSubPartDispatch = true;
            }
          }
        }

        let hadCmdsPartDispatch = false;
        const cmdsRaw = (msg as { cmds?: unknown }).cmds;
        if (Array.isArray(cmdsRaw)) {
          for (const part of cmdsRaw) {
            if (!part || typeof part !== "object") continue;
            const p = part as Record<string, unknown>;
            if (p.type === "AUTH") continue;

            const scmd = p.cmdId;
            const sidNum =
              typeof scmd === "number"
                ? scmd
                : scmd !== undefined && scmd !== null && String(scmd).trim() !== ""
                  ? Number(scmd)
                  : NaN;
            if (sidNum === 0) continue;

            const partErr = typeof p.errorCode === "number" ? p.errorCode : 0;
            if (partErr !== 0) continue;

            let flat = flattenAttributeData(p.data);
            if (Object.keys(flat).length === 0 && p.update !== undefined) {
              flat = flattenAttributeData(p.update);
            }
            if (Object.keys(flat).length === 0 && p.result !== undefined) {
              flat = flattenAttributeData(p.result);
            }
            for (const key of Object.keys(flat)) {
              this.dispatchWsAttrKey(key, flat[key], sidNum, msgEntity);
              hadCmdsPartDispatch = true;
            }
          }
        }

        const dataObj = mergeTbWsPayloadData(msg);
        const mergedKeys = dataObj ? Object.keys(dataObj) : [];
        if (mergedKeys.length === 0 && !hadAttrSubPartDispatch && !hadCmdsPartDispatch) {
          if (err !== 0) return;
          return;
        }

        if (mergedKeys.length > 0) {
          const rawSid = msg.subscriptionId ?? (msg as { cmdId?: unknown }).cmdId;
          const sidNum =
            typeof rawSid === "number"
              ? rawSid
              : rawSid !== undefined && rawSid !== null && String(rawSid).trim() !== ""
                ? Number(rawSid)
                : NaN;

          for (const k of mergedKeys) {
            this.dispatchWsAttrKey(k, dataObj![k], sidNum, msgEntity);
          }
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = (ev) => {
      this.connecting = false;
      const reason = ev.reason || "";
      if (this.ws === ws) this.ws = null;

      const invalidJwt =
        /invalid\s+jwt|jwt\s+token|token\s+expired|unauthori[sz]ed/i.test(reason) ||
        (ev.code === 1011 && /jwt|token/i.test(reason));
      if (invalidJwt) {
        _cachedLoginJwt = "";
        this.lastWsTokenFingerprint = "";
        addLog("[ws]", "JWT rejected — will re-login on next connect");
        if (this.subs.size > 0) this.scheduleReconnect();
        return;
      }

      if (this.subs.size > 0) this.scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  /** Một lệnh trong `cmds` (format NewGen / demo HTML). */
  private buildNewgenCmd(sub: Sub) {
    const keysWire =
      sub.batchKeys && sub.batchKeys.length > 0 ? sub.batchKeys.join(",") : sub.key;

    /** Giống `tsSubCmds` (LATEST_TELEMETRY) — `ATTRIBUTES`+`scope:null` không phải lúc nào cũng nhận push TS. */
    if (sub.subType === "ts") {
      return {
        type: "TIMESERIES" as const,
        entityType: "DEVICE" as const,
        entityId: sub.deviceId,
        scope: "LATEST_TELEMETRY" as const,
        keys: keysWire,
        cmdId: sub.cmdId,
        unsubscribe: false as const,
      };
    }

    let scope: "CLIENT_SCOPE" | "SERVER_SCOPE" | "SHARED_SCOPE";
    if (sub.subType === "client_attr") scope = "CLIENT_SCOPE";
    else if (sub.subType === "shared_attr") scope = "SHARED_SCOPE";
    else scope = "SERVER_SCOPE";

    return {
      type: "ATTRIBUTES" as const,
      entityType: "DEVICE" as const,
      entityId: sub.deviceId,
      scope,
      keys: keysWire,
      cmdId: sub.cmdId,
      unsubscribe: false as const,
    };
  }

  private doSend(ws: WebSocket, sub: Sub): void {
    if (ws.readyState !== WebSocket.OPEN) return;

    if (getNewgenWsUseCmdsFormat()) {
      const cmd = this.buildNewgenCmd(sub);
      ws.send(JSON.stringify({ cmds: [cmd] }));
      return;
    }

    // ThingsBoard UI cũ: `tsSubCmds` / `attrSubCmds`
    const keysWire =
      sub.batchKeys && sub.batchKeys.length > 0 ? sub.batchKeys.join(",") : sub.key;

    const tsBase = {
      entityType: "DEVICE",
      entityId: sub.deviceId,
      scope: "LATEST_TELEMETRY",
      type: "TIMESERIES",
      cmdId: sub.cmdId,
      keys: keysWire,
    };

    const attrBase = {
      entityType: "DEVICE",
      entityId: sub.deviceId,
      cmdId: sub.cmdId,
      keys: keysWire,
      ...(sub.subType === "client_attr"
        ? { scope: "CLIENT_SCOPE" as const }
        : sub.subType === "shared_attr"
          ? { scope: "SHARED_SCOPE" as const }
          : sub.subType === "attr"
            ? { scope: "SERVER_SCOPE" as const }
            : {}),
    };
    const msg =
      sub.subType === "ts"
        ? { tsSubCmds: [tsBase], attrSubCmds: [], historyCmds: [] }
        : { tsSubCmds: [], attrSubCmds: [attrBase], historyCmds: [] };
    ws.send(JSON.stringify(msg));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, RECONNECT_MAX_MS);
      this.ensureConnected();
    }, this.reconnectDelay);
  }

  subscribe(
    deviceId: string,
    key: string,
    subType: "ts" | "attr" | "client_attr" | "shared_attr",
    cb: ValueCb,
  ): () => void {
    // Tránh 2 subscription cùng (deviceId, key) — React StrictMode mount đôi → chỉ giữ bản mới nhất
    for (const [existingId, existing] of [...this.subs.entries()]) {
      if (existing.deviceId === deviceId && existing.key === key && existing.subType === subType) {
        this.subs.delete(existingId);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendUnsubscribe(this.ws, existing);
        }
      }
    }

    const cmdId = this.nextId++;
    const sub: Sub = { cmdId, deviceId, key, subType, cb };
    this.subs.set(cmdId, sub);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.doSend(this.ws, sub);
    } else {
      this.ensureConnected();
    }

    return () => {
      this.subs.delete(cmdId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendUnsubscribe(this.ws, sub);
      }
    };
  }

  /**
   * Smart switch / batch: CLIENT, SHARED, **SERVER** (`attr`), hoặc **TIMESERIES** (`ts`).
   */
  subscribeBatch(
    deviceId: string,
    batchKeys: readonly string[],
    subType: "client_attr" | "shared_attr" | "attr" | "ts",
    cb: BatchAttrCb,
  ): () => void {
    for (const [existingId, existing] of [...this.subs.entries()]) {
      if (
        existing.deviceId === deviceId &&
        existing.subType === subType &&
        existing.batchKeys &&
        existing.batchKeys.length === batchKeys.length &&
        existing.batchKeys.join(",") === batchKeys.join(",")
      ) {
        this.subs.delete(existingId);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.sendUnsubscribe(this.ws, existing);
        }
      }
    }

    const cmdId = this.nextId++;
    const sub: Sub = {
      cmdId,
      deviceId,
      key: `batch|${subType}|${batchKeys.join(",")}`,
      batchKeys,
      batchAttrCb: cb,
      subType,
      cb: () => {},
    };
    this.subs.set(cmdId, sub);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.doSend(this.ws, sub);
    } else {
      this.ensureConnected();
    }

    return () => {
      this.subs.delete(cmdId);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendUnsubscribe(this.ws, sub);
      }
    };
  }
}

/** Singleton — dùng chung một WS connection cho toàn app. */
export const tbWsManager = new TbWsManager();

interface WsValueState {
  value: unknown;
  /** Tăng mỗi lần server push — đảm bảo re-render kể cả khi giá trị chuỗi trùng (detected liên tục). */
  rev: number;
}

function useTbWs(
  deviceId: string | null,
  key: string,
  subType: "ts" | "attr" | "client_attr" | "shared_attr",
): { value: unknown; rev: number } {
  const [state, setState] = useState<WsValueState>({ value: undefined, rev: 0 });
  const setRef = useRef(setState);
  setRef.current = setState;

  useEffect(() => {
    if (!deviceId) {
      setState({ value: undefined, rev: 0 });
      return;
    }
    setState({ value: undefined, rev: 0 });
    return tbWsManager.subscribe(deviceId, key, subType, (v) => {
      setRef.current((s) => ({ value: v, rev: s.rev + 1 }));
    });
  }, [deviceId, key, subType]);

  return { value: state.value, rev: state.rev };
}

/**
 * Gộp `smoke_sensor`/`human_sensor` (primary) + alias (`smokeDetected`/`humanDetected`).
 * Phải **OR** cảnh báo: nếu `primary === false` (cleared) nhưng `alias === true` (detected) — vẫn báo động.
 * Trước đây `if (primary !== undefined) return primary` khiến luôn Normal trong trường hợp đó.
 */
function pickPresenceAlarm(primary: boolean | undefined, alias: boolean | undefined): boolean | undefined {
  if (primary === true || alias === true) return true;
  if (primary === false && alias === false) return false;
  if (primary !== undefined) return primary;
  return alias;
}

/**
 * WS cảm biến khói — subscribe **`smoke_sensor`** + **`smokeDetected`** (push có thể chỉ dùng một key).
 * `alarm`: `cleared` → Normal, `detected` → báo đỏ. `wsRev` tăng khi có bản tin WS.
 */
export function useSmokeDetectedWs(deviceId: string | null): {
  alarm: boolean | undefined;
  wsRev: number;
} {
  const { value: v1, rev: r1 } = useTbWs(deviceId, SMOKE_TS_KEY, "ts");
  const { value: v2, rev: r2 } = useTbWs(deviceId, SMOKE_TS_KEY_ALT, "ts");
  const a = mapPresenceWsPayloadToAlarmState(v1);
  const b = mapPresenceWsPayloadToAlarmState(v2);
  return {
    alarm: pickPresenceAlarm(a, b),
    wsRev: r1 + r2,
  };
}

/**
 * Smart Switch — giống 1:1 `index-ws-tb-full-command-jwt-org.html`:
 *
 * 1. `subscribeBatch` → WS cmds: CLIENT_SCOPE state-sw*, SHARED_SCOPE cmd-sw*
 *    (giống demo `subscribeLatestAttributes`)
 * 2. `subscribeSmartSwitch` → mỗi WS message chạy `processAttrs(msg.data)`
 *    + `processAttrs(msg.data.data)` + `processAttrs(msg.attrSubCmds.data)`
 *    → `updateAttributeState(key, value)` → React state
 * 3. HTTP bootstrap fallback
 */
type SwitchTuple = [
  boolean | undefined,
  boolean | undefined,
  boolean | undefined,
  boolean | undefined,
];

function emptySwitchTuple(): SwitchTuple {
  return [undefined, undefined, undefined, undefined];
}

export function useSmartSwitchStatesWs(deviceId: string | null): {
  sw1: boolean | undefined;
  sw2: boolean | undefined;
  sw3: boolean | undefined;
  sw4: boolean | undefined;
  wsRev: number;
} {
  const [chs, setChs] = useState<SwitchTuple>(() => emptySwitchTuple());
  const [wsRev, setWsRev] = useState(0);

  useEffect(() => {
    if (!deviceId) {
      setChs(emptySwitchTuple());
      setWsRev(0);
      return;
    }
    setChs(emptySwitchTuple());
    setWsRev(0);

    /* ── (1) Subscribe WS — giống demo subscribeLatestAttributes ── */
    const noop: BatchAttrCb = () => {};
    const unsubState = tbWsManager.subscribeBatch(
      deviceId,
      [...SWITCH_KEYS],
      "client_attr",
      noop,
    );
    const unsubCmd = tbWsManager.subscribeBatch(
      deviceId,
      [...COMMAND_KEYS],
      "shared_attr",
      noop,
    );

    /* ── (2) processAttrs → updateAttributeState (giống demo) ── */
    const unsubSwitch = tbWsManager.subscribeSmartSwitch((key, on) => {
      const idx = SWITCH_KEY_TO_IDX[key];
      if (idx === undefined) return;
      setChs((prev) => {
        if (prev[idx] === on) return prev;
        const next = [...prev] as SwitchTuple;
        next[idx] = on;
        return next;
      });
      setWsRev((r) => r + 1);
    });

    /* ── (3) HTTP bootstrap — fallback nếu WS chưa push ── */
    let cancelled = false;
    const bootstrapTid = window.setTimeout(() => {
      void fetchDeviceSwitchChannelStates(deviceId.trim()).then((tuple) => {
        if (cancelled || !tuple) return;
        setChs((prev) => {
          if (!prev.every((x) => x === undefined)) return prev;
          return [tuple[0], tuple[1], tuple[2], tuple[3]] as SwitchTuple;
        });
        setWsRev((r) => r + 1);
      });
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTid);
      unsubState();
      unsubCmd();
      unsubSwitch();
    };
  }, [deviceId]);

  return { sw1: chs[0], sw2: chs[1], sw3: chs[2], sw4: chs[3], wsRev };
}

/**
 * WS cảm biến người — subscribe **`human_sensor`** + **`humanDetected`** (TB đôi khi chỉ đẩy một key).
 */
export function useHumanDetectedWs(deviceId: string | null): {
  alarm: boolean | undefined;
  wsRev: number;
} {
  const { value: v1, rev: r1 } = useTbWs(deviceId, HUMAN_TS_KEY, "ts");
  const { value: v2, rev: r2 } = useTbWs(deviceId, HUMAN_TS_KEY_ALT, "ts");
  const a = mapPresenceWsPayloadToAlarmState(v1);
  const b = mapPresenceWsPayloadToAlarmState(v2);
  return {
    alarm: pickPresenceAlarm(a, b),
    wsRev: r1 + r2,
  };
}

/**
 * WS subscription: `state-plug` (đèn hành lang / gateway plug) — **chỉ đọc** trạng thái.
 * Giống demo HTML TB: `{ type:"ATTRIBUTES", scope:"CLIENT_SCOPE", keys:"state-plug" }` (`subType:"client_attr"`).
 * Push: `data: { "state-plug": [[ts,"on"|"off"]] }` hoặc lồng trong `data` / `attrSubCmds.data` — xem `mergeTbWsPayloadData`.
 */
export function useGatewayPlugStateWs(deviceId: string | null): {
  on: boolean | undefined;
  /** Mỗi lần server push — dùng để bỏ snapshot HTTP sau điều khiển. */
  wsRev: number;
} {
  const { value: raw, rev } = useTbWs(deviceId, GATEWAY_PLUG_ATTR_KEY, "client_attr");
  if (raw === undefined) return { on: undefined, wsRev: rev };
  const s = String(raw ?? "").toLowerCase().trim();
  const on = s === "on" || s === "true" || s === "1";
  return { on, wsRev: rev };
}

const LED_STATE_LIGHT_KEY = "state-light";
const LED_COLOR_TEMP_KEY = "color-temp-light";

function parseLedLightState(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "off" || s === "false" || s === "0") return false;
  if (s === "on" || s === "true" || s === "1") return true;
  return undefined;
}

function parseLedColorTemp(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * LED strip — subscribe `state-light` (on/off) + `color-temp-light` (0…100).
 * NewGen `cmds`: `TIMESERIES` + `LATEST_TELEMETRY` khi `subType: "ts"` (xem `buildNewgenCmd`).
 */
export function useLedStripStatesWs(deviceId: string | null): {
  lightOn: boolean | undefined;
  colorTemp: number | undefined;
  wsRev: number;
} {
  const subType: "ts" | "attr" = getNewgenWsUseCmdsFormat() ? "ts" : "attr";
  const { value: rawLight, rev: r1 } = useTbWs(deviceId, LED_STATE_LIGHT_KEY, subType);
  const { value: rawTemp, rev: r2 } = useTbWs(deviceId, LED_COLOR_TEMP_KEY, subType);
  return {
    lightOn: parseLedLightState(rawLight),
    colorTemp: parseLedColorTemp(rawTemp),
    wsRev: r1 + r2,
  };
}