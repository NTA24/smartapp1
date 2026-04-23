import { useEffect, useRef, useState } from "react";
import { fetchDeviceSwitchChannelStates } from "../../services/deviceSync";
import { getNewgenWsUseCmdsFormat } from "../config";
import {
  type BatchAttrCb,
  DOOR_TS_KEY,
  DOOR_TS_KEY_ALT,
  FENCE1_TS_KEY,
  FENCE2_TS_KEY,
  GATEWAY_PLUG_ATTR_KEY,
  HUMAN_TS_KEY,
  HUMAN_TS_KEY_ALT,
  SIREN_WS_KEYS,
  SMOKE_TS_KEY,
  SMOKE_TS_KEY_ALT,
} from "./tbWsModel";
import { mapDoorWsPayloadToOpenState, mapFenceWsPayloadToAlarmState, mapPresenceWsPayloadToAlarmState } from "./tbWsParser";
import {
  SWITCH_KEYS,
  SWITCH_KEY_TO_IDX,
} from "./tbWsSmartSwitch";
import { tbWsManager } from "./TbWsManager";

interface WsValueState {
  value: unknown;
  rev: number;
}

function useTbWs(
  deviceId: string | null,
  key: string,
  subType: "ts" | "attr" | "attr_any" | "client_attr" | "shared_attr",
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

function pickPresenceAlarm(primary: boolean | undefined, alias: boolean | undefined): boolean | undefined {
  if (primary === true || alias === true) return true;
  if (primary === false && alias === false) return false;
  if (primary !== undefined) return primary;
  return alias;
}

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

    const noop: BatchAttrCb = () => {};
    const unsubState = tbWsManager.subscribeBatch(
      deviceId,
      [...SWITCH_KEYS],
      "client_attr",
      noop,
    );
    const unsubSwitch = tbWsManager.subscribeSmartSwitch(deviceId.trim(), (key, on) => {
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
      unsubSwitch();
    };
  }, [deviceId]);

  return { sw1: chs[0], sw2: chs[1], sw3: chs[2], sw4: chs[3], wsRev };
}

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

export function useDoorSensorWs(deviceId: string | null): {
  open: boolean | undefined;
  wsRev: number;
} {
  const { value: v1, rev: r1 } = useTbWs(deviceId, DOOR_TS_KEY, "attr_any");
  const { value: v2, rev: r2 } = useTbWs(deviceId, DOOR_TS_KEY_ALT, "attr_any");
  const a = mapDoorWsPayloadToOpenState(v1);
  const b = mapDoorWsPayloadToOpenState(v2);
  return {
    open: pickPresenceAlarm(a, b),
    wsRev: r1 + r2,
  };
}

export function useFenceSensorWs(deviceId: string | null, channel?: 1 | 2): {
  alarm: boolean | undefined;
  wsRev: number;
} {
  const selectedChannel = channel ?? 1;
  const key = selectedChannel === 2 ? FENCE2_TS_KEY : FENCE1_TS_KEY;
  const { value: raw, rev } = useTbWs(deviceId, key, "attr_any");
  return {
    alarm: mapFenceWsPayloadToAlarmState(raw),
    wsRev: rev,
  };
}

function parseSirenNumeric(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseSirenOn(v: unknown): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).toLowerCase().trim();
  if (["on", "true", "1", "alarm"].includes(s)) return true;
  if (["off", "false", "0"].includes(s)) return false;
  return undefined;
}

/** WS: cùng format `ATTRIBUTES` + `scope: null` như log ThingsBoard (attr_any). */
export function useSirenStatesWs(deviceId: string | null): {
  on: boolean | undefined;
  tune: number | undefined;
  volume: number | undefined;
  durationSec: number | undefined;
  levelRaw: number | undefined;
  wsRev: number;
} {
  const [map, setMap] = useState<Record<string, unknown>>({});
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!deviceId) {
      setMap({});
      setRev(0);
      return;
    }
    setMap({});
    setRev(0);
    return tbWsManager.subscribeBatch(deviceId, [...SIREN_WS_KEYS], "attr_any", (key, value) => {
      setMap((m) => ({ ...m, [key]: value }));
      setRev((r) => r + 1);
    });
  }, [deviceId]);

  return {
    on: parseSirenOn(map.siren_state ?? map.cmd_siren_state),
    tune: parseSirenNumeric(map.siren_tune ?? map.cmd_siren_tune),
    volume: parseSirenNumeric(map.siren_volume ?? map.cmd_siren_volume),
    durationSec: parseSirenNumeric(map.siren_duration_sec ?? map.cmd_siren_duration_sec),
    levelRaw: parseSirenNumeric(map.siren_level_raw),
    wsRev: rev,
  };
}

export function useGatewayPlugStateWs(deviceId: string | null): {
  on: boolean | undefined;
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
