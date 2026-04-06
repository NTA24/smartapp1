export type ValueCb = (value: unknown) => void;
export type BatchAttrCb = (attrKey: string, value: unknown) => void;

export interface Sub {
  cmdId: number;
  deviceId: string;
  key: string;
  batchKeys?: readonly string[];
  batchAttrCb?: BatchAttrCb;
  subType: "ts" | "attr" | "client_attr" | "shared_attr";
  cb: ValueCb;
}

export interface TbWsMsg {
  subscriptionId?: number;
  errorCode?: number;
  errorMsg?: string | null;
  data?: Record<string, unknown>;
  latestValues?: Record<string, unknown>;
  entityId?: string | { id?: string; entityType?: string };
  [key: string]: unknown;
}

export type SmartSwitchWsListener = (key: string, on: boolean) => void;

export const SMOKE_TS_KEY = "smoke_sensor";
export const SMOKE_TS_KEY_ALT = "smokeDetected";
export const HUMAN_TS_KEY = "human_sensor";
export const HUMAN_TS_KEY_ALT = "humanDetected";
export const GATEWAY_PLUG_ATTR_KEY = "state-plug";

export const RECONNECT_BASE_MS = 2_000;
export const RECONNECT_MAX_MS = 30_000;
