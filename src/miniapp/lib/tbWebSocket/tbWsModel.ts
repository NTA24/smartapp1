export type ValueCb = (value: unknown) => void;
export type BatchAttrCb = (attrKey: string, value: unknown) => void;

export interface Sub {
  cmdId: number;
  deviceId: string;
  key: string;
  batchKeys?: readonly string[];
  batchAttrCb?: BatchAttrCb;
  subType: "ts" | "attr" | "attr_any" | "client_attr" | "shared_attr";
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
export const DOOR_TS_KEY = "door_sensor";
export const DOOR_TS_KEY_ALT = "doorSensor";
export const FENCE1_TS_KEY = "channel_1_status";
export const FENCE2_TS_KEY = "channel_2_status";
export const GATEWAY_PLUG_ATTR_KEY = "state-plug";

/** Thuộc tính còi báo — subscribe WS dạng ATTRIBUTES, scope null (attr_any). */
export const SIREN_STATE_KEY = "siren_state";
export const SIREN_TUNE_KEY = "siren_tune";
export const SIREN_VOLUME_KEY = "siren_volume";
export const SIREN_DURATION_KEY = "siren_duration_sec";
export const SIREN_LEVEL_RAW_KEY = "siren_level_raw";
export const SIREN_CMD_STATE_KEY = "cmd_siren_state";
export const SIREN_CMD_TUNE_KEY = "cmd_siren_tune";
export const SIREN_CMD_VOLUME_KEY = "cmd_siren_volume";
export const SIREN_CMD_DURATION_KEY = "cmd_siren_duration_sec";

export const SIREN_WS_KEYS = [
  SIREN_STATE_KEY,
  SIREN_TUNE_KEY,
  SIREN_VOLUME_KEY,
  SIREN_DURATION_KEY,
  SIREN_LEVEL_RAW_KEY,
  SIREN_CMD_STATE_KEY,
  SIREN_CMD_TUNE_KEY,
  SIREN_CMD_VOLUME_KEY,
  SIREN_CMD_DURATION_KEY,
] as const;

export const RECONNECT_BASE_MS = 2_000;
export const RECONNECT_MAX_MS = 30_000;
