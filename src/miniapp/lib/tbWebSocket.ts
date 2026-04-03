/**
 * NewGen WebSocket — đọc trạng thái (subscribe telemetry/attributes). Base URL `…/api/ws` (xem getNewgenWsTelemetryUrl).
 *
 * **Ổ cắm / đèn hành lang:** đọc qua WS `state-plug`; bật/tắt: HTTP `sendGatewayPlugHallwayControl` (mặc định SHARED_SCOPE `cmd-socket`).
 * Công tắc 4 kênh: điều khiển HTTP POST SHARED_SCOPE `cmd-sw1`…`cmd-sw4` (`postDeviceSharedScopeSwitchChannel`).
 *
 * Message: { subscriptionId, errorCode, data: { key: [[ts, value], ...] }, latestValues }.
 * NewGen: lần đầu mở socket gửi **một** bản `{ authCmd, cmds }` (giống demo HTML); chỉ mở `wss://` không gửi `cmds` thì server không bơm dữ liệu.
 * LED strip: đọc `state-light`, `color-temp-light`; điều khiển HTTP SHARED `cmd-light`, `cmd-color-temp-light`.
 * smoke_sensor / human_sensor: `cleared` = bình thường, `detected` = cảnh báo (đỏ).
 * Auth: `?token=` + `authCmd` — **JWT** (`VITE_NEWGEN_WS_JWT`) hoặc **ApiKey** mẫu (`VITE_NEWGEN_SAMPLE_DEVICES_API_KEY`) nếu không có JWT.
 * TB chuẩn thường chỉ chấp nhận JWT trong `?token=`; ApiKey có thể bị `1011 Invalid JWT` — khi đó bắt buộc JWT.
 */
import { useEffect, useRef, useState } from "react";
import {
  getNewgenSampleDevicesApiKey,
  getNewgenWsJwt,
  getNewgenWsTelemetryUrl,
  getNewgenWsUseCmdsFormat,
} from "./config";
import { addLog } from "./debugLog";

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

interface Sub {
  cmdId: number;
  deviceId: string;
  key: string;
  /** `client_attr` = CLIENT_SCOPE (giống demo TB `state-sw*` / `state-plug`). */
  subType: "ts" | "attr" | "client_attr";
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

/** Gộp `msg.data`, `msg.data.data`, `attrSubCmds.data` — giống demo HTML ThingsBoard. */
function mergeTbWsPayloadData(msg: TbWsMsg): Record<string, unknown> | null {
  const acc: Record<string, unknown> = {};
  const push = (o: unknown) => {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      Object.assign(acc, o as Record<string, unknown>);
    }
  };
  push(msg.data);
  if (msg.data && typeof msg.data === "object" && msg.data !== null) {
    push((msg.data as { data?: unknown }).data);
  }
  push((msg as { attrSubCmds?: { data?: unknown } }).attrSubCmds?.data);
  return Object.keys(acc).length ? acc : null;
}

function readMsgEntityId(msg: TbWsMsg): string | undefined {
  const e = msg.entityId;
  if (typeof e === "string" && e.trim()) return e.trim();
  if (e && typeof e === "object" && typeof (e as { id?: string }).id === "string") {
    return String((e as { id: string }).id).trim();
  }
  return undefined;
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

class TbWsManager {
  /** Gửi `v` tới đúng subscription(s) cho `key` — hỗ trợ nhiều thiết bị (entityId / subscriptionId) và trùng sub (StrictMode). */
  private dispatchTelemetryValue(
    key: string,
    v: unknown,
    sidNum: number,
    entityIdFromMsg: string | undefined,
  ): void {
    const matches = [...this.subs.values()].filter((s) => s.key === key);
    if (matches.length === 0) return;

    const notify = (sub: Sub) => {
      sub.cb(v);
    };

    if (matches.length === 1) {
      notify(matches[0]);
      return;
    }

    if (entityIdFromMsg) {
      const byEntity = matches.find((s) => s.deviceId === entityIdFromMsg);
      if (byEntity) {
        notify(byEntity);
        return;
      }
    }

    if (!Number.isNaN(sidNum)) {
      const bySid = matches.find((s) => s.cmdId === sidNum);
      if (bySid) {
        notify(bySid);
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

  ensureConnected(): void {
    const jwt = getNewgenWsJwt();
    const apiKey = getNewgenSampleDevicesApiKey();
    const token = jwt || apiKey;
    if (token !== this.lastWsTokenFingerprint) {
      this.lastWsTokenFingerprint = token;
      this.wsAuthFatal = false;
    }
    if (this.wsAuthFatal) return;
    if (this.connecting) return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    if (!token) {
      return;
    }
    this.connecting = true;

    // Thử cả hai cách auth: URL token + authCmd sau connect
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
        if (err !== 0) {
          return;
        }
        const dataObj = mergeTbWsPayloadData(msg);
        if (!dataObj || Object.keys(dataObj).length === 0) {
          return;
        }

        const rawSid = msg.subscriptionId;
        const sidNum =
          typeof rawSid === "number"
            ? rawSid
            : rawSid !== undefined && rawSid !== null && String(rawSid).trim() !== ""
              ? Number(rawSid)
              : NaN;

        const dataKeys = Object.keys(dataObj);
        const entityId = msgEntity;

        for (const k of dataKeys) {
          const rawPts = dataObj[k];
          const rows = normalizeTelemetryPoints(rawPts);
          const isHumanKey = k === HUMAN_TS_KEY || k === HUMAN_TS_KEY_ALT;
          const isGatewayPlugKey = k === GATEWAY_PLUG_ATTR_KEY;

          if (!rows || rows.length === 0) {
            if (isHumanKey) {
              const matches = [...this.subs.values()].filter((s) => s.key === k);
              const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
              addLog("[human_sensor]", dev || "?", "empty-or-bad-shape", humanSensorValPreview(rawPts));
            }
            if (isGatewayPlugKey) {
              const matches = [...this.subs.values()].filter((s) => s.key === k);
              const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
              addLog("[hallway_plug]", dev || "?", "empty-or-bad-shape", humanSensorValPreview(rawPts));
            }
            continue;
          }

          const sorted = [...rows].sort((a, b) => Number(b[0]) - Number(a[0]));
          let v: unknown = sorted[0][1];
          if (Array.isArray(v) && v.length === 1) v = v[0];
          v = unwrapTelemetryScalar(v);

          if (isHumanKey) {
            const matches = [...this.subs.values()].filter((s) => s.key === k);
            const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
            logHumanSensorWsLine(dev || "?", v);
          }
          if (isGatewayPlugKey) {
            const matches = [...this.subs.values()].filter((s) => s.key === k);
            const dev = (entityId ?? matches[0]?.deviceId ?? "").trim();
            logGatewayPlugWsLine(dev || "?", v);
          }

          this.dispatchTelemetryValue(k, v, sidNum, entityId);
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
        this.wsAuthFatal = true;
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
    let scope: "CLIENT_SCOPE" | "SERVER_SCOPE" | null;
    if (sub.subType === "ts") scope = null;
    else if (sub.subType === "client_attr") scope = "CLIENT_SCOPE";
    else scope = "SERVER_SCOPE";

    return {
      type: "ATTRIBUTES" as const,
      entityType: "DEVICE" as const,
      entityId: sub.deviceId,
      scope,
      keys: sub.key,
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
    const tsBase = {
      entityType: "DEVICE",
      entityId: sub.deviceId,
      scope: "LATEST_TELEMETRY",
      type: "TIMESERIES",
      cmdId: sub.cmdId,
      keys: sub.key,
    };
    const attrBase = {
      entityType: "DEVICE",
      entityId: sub.deviceId,
      cmdId: sub.cmdId,
      keys: sub.key,
      ...(sub.subType === "client_attr" ? { scope: "CLIENT_SCOPE" as const } : {}),
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
    subType: "ts" | "attr" | "client_attr",
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
  subType: "ts" | "attr" | "client_attr",
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
 * Smart Switch 4 kênh — bốn subscription WS riêng `state-sw1` … `state-sw4`.
 * NewGen (`VITE_NEWGEN_WS_USE_CMDS_FORMAT` mặc định): giống payload
 * `{ "state-sw1": [[ts,"on"|"off"]], ... }` — dùng `subType:"ts"` → `ATTRIBUTES` + `scope: null`.
 * TB cũ: `subType:"attr"` (SERVER_SCOPE).
 */
export function useSmartSwitchStatesWs(deviceId: string | null): {
  sw1: boolean | undefined;
  sw2: boolean | undefined;
  sw3: boolean | undefined;
  sw4: boolean | undefined;
} {
  const swSubType: "ts" | "attr" = getNewgenWsUseCmdsFormat() ? "ts" : "attr";
  const r1 = useTbWs(deviceId, "state-sw1", swSubType).value;
  const r2 = useTbWs(deviceId, "state-sw2", swSubType).value;
  const r3 = useTbWs(deviceId, "state-sw3", swSubType).value;
  const r4 = useTbWs(deviceId, "state-sw4", swSubType).value;

  const parse = (v: unknown): boolean | undefined => {
    if (v === undefined) return undefined;
    const s = String(v ?? "").toLowerCase().trim();
    if (s === "off" || s === "false" || s === "0") return false;
    if (s === "on" || s === "true" || s === "1") return true;
    return undefined;
  };

  return { sw1: parse(r1), sw2: parse(r2), sw3: parse(r3), sw4: parse(r4) };
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
 * Cùng format NewGen: `ATTRIBUTES` + `scope: null` khi `VITE_NEWGEN_WS_USE_CMDS_FORMAT=true`.
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