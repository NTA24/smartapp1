import { layersForProcessAttrs, mergeLayersIntoFlatAttrMap } from "../tbWsProcessAttrs";
import type { TbWsMsg } from "./tbWsModel";

export function unwrapTelemetryScalar(raw: unknown): unknown {
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

export function mapPresenceWsPayloadToAlarmState(raw: unknown): boolean | undefined {
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
    } catch {}
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
  } catch {}

  return undefined;
}

export function mapDoorWsPayloadToOpenState(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;

  const pointRows = normalizeTelemetryPoints(raw);
  if (pointRows && pointRows.length > 0) {
    const sorted = [...pointRows].sort((a, b) => b[0] - a[0]);
    const latest = sorted[0]?.[1];
    return mapDoorWsPayloadToOpenState(latest);
  }

  const cur = unwrapTelemetryScalar(extractTbWsAttributeValueLikeDemo(raw));
  if (cur === undefined || cur === null) return undefined;
  if (typeof cur === "boolean") return cur;
  if (typeof cur === "number") {
    if (cur === 1) return true;
    if (cur === 0) return false;
  }

  const s = String(cur).replace(/\uFEFF/g, "").trim().toLowerCase();
  if (!s) return undefined;
  if (["open", "opened", "unlock", "unlocked", "on", "true", "1"].includes(s)) return true;
  if (["closed", "close", "lock", "locked", "off", "false", "0"].includes(s)) return false;
  return undefined;
}

export function mapFenceWsPayloadToAlarmState(raw: unknown): boolean | undefined {
  if (raw === undefined || raw === null) return undefined;

  const pointRows = normalizeTelemetryPoints(raw);
  if (pointRows && pointRows.length > 0) {
    const sorted = [...pointRows].sort((a, b) => b[0] - a[0]);
    const latest = sorted[0]?.[1];
    return mapFenceWsPayloadToAlarmState(latest);
  }

  const cur = unwrapTelemetryScalar(extractTbWsAttributeValueLikeDemo(raw));
  if (cur === undefined || cur === null) return undefined;
  if (typeof cur === "boolean") return cur;
  if (typeof cur === "number") {
    if (cur === 1) return true;
    if (cur === 0) return false;
  }

  const s = String(cur).replace(/\uFEFF/g, "").trim().toLowerCase();
  if (!s) return undefined;
  if (["alarm", "alert", "triggered", "on", "true", "1"].includes(s)) return true;
  if (["good", "normal", "ok", "off", "false", "0"].includes(s)) return false;
  return undefined;
}

export function humanSensorValPreview(raw: unknown): string {
  try {
    const s = JSON.stringify(raw);
    return s.length > 120 ? s.slice(0, 120) + "…" : s;
  } catch {
    return String(raw).slice(0, 120);
  }
}

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

export function flattenAttributeData(data: unknown): Record<string, unknown> {
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

export const SMART_SWITCH_LIKE_KEY_RE = /^state-sw[1-4]$/;

export function collectSmartSwitchLikeKeysDeep(node: unknown, acc: Record<string, unknown>): void {
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

export function mergeTbWsPayloadData(msg: TbWsMsg): Record<string, unknown> | null {
  const acc: Record<string, unknown> = {};

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

export function readMsgEntityId(msg: TbWsMsg): string | undefined {
  const fromRoot = tryReadEntityIdValue(msg.entityId);
  if (fromRoot) return fromRoot;
  const anyMsg = msg as Record<string, unknown>;
  const alt = tryReadEntityIdValue(anyMsg.deviceId) ?? tryReadEntityIdValue(anyMsg.originator);
  if (alt) return alt;
  return undefined;
}

export function readMsgEntityIdDeep(msg: TbWsMsg): string | undefined {
  const base = readMsgEntityId(msg);
  if (base) return base;

  const fromPart = (part: Record<string, unknown>): string | undefined =>
    tryReadEntityIdValue(part.entityId) ?? tryReadEntityIdValue(part.deviceId);

  const asc = (msg as { attrSubCmds?: unknown }).attrSubCmds;
  if (Array.isArray(asc)) {
    for (const part of asc) {
      if (!part || typeof part !== "object") continue;
      const id = fromPart(part as Record<string, unknown>);
      if (id) return id;
    }
  }
  const cmds = (msg as { cmds?: unknown }).cmds;
  if (Array.isArray(cmds)) {
    for (const part of cmds) {
      if (!part || typeof part !== "object") continue;
      const id = fromPart(part as Record<string, unknown>);
      if (id) return id;
    }
  }
  return undefined;
}

function normalizeEntityIdForMatch(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

export function entityIdsMatch(deviceId: string, msgEntityId: string | undefined): boolean {
  if (!msgEntityId?.trim()) return false;
  const a = normalizeEntityIdForMatch(deviceId.trim());
  const b = normalizeEntityIdForMatch(msgEntityId.trim());
  return a.length > 0 && a === b;
}

export function extractTbWsAttributeValueLikeDemo(raw: unknown): unknown {
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

function coerceTelemetryTs(ts: unknown): number {
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts === "string") {
    const n = Number(ts.trim().replace(/\uFEFF/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function normalizeTelemetryPoints(raw: unknown): [number, unknown][] | null {
  if (raw === undefined || raw === null) return null;

  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "value" in raw[0]) {
    return raw.map((item) => {
      const row = item as { ts?: number; value?: unknown };
      return [coerceTelemetryTs(row.ts ?? Date.now()), row.value] as [number, unknown];
    });
  }

  if (!Array.isArray(raw) || raw.length === 0) return null;

  if (raw.length === 2 && (typeof raw[0] === "number" || typeof raw[0] === "string")) {
    return [[coerceTelemetryTs(raw[0]), raw[1]]];
  }

  const first = raw[0];
  if (Array.isArray(first) && first.length >= 2) {
    return (raw as unknown[][]).map((row) => {
      if (!Array.isArray(row) || row.length < 2) return [0, undefined] as [number, unknown];
      return [coerceTelemetryTs(row[0]), row[1]] as [number, unknown];
    });
  }

  return null;
}
