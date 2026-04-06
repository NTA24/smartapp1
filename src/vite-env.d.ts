/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEWGEN_API_KEY?: string;
  readonly VITE_NEWGEN_SAMPLE_DEVICES_API_KEY?: string;
  readonly VITE_NEWGEN_WS_JWT?: string;
  readonly VITE_NEWGEN_WS_USE_CMDS_FORMAT?: string;
  readonly VITE_NEWGEN_SMART_SWITCH_DEVICE_IDS?: string;
  readonly VITE_NEWGEN_GATEWAY_SOCKET_DEVICE_IDS?: string;
  readonly VITE_NEWGEN_LED_STRIP_DEVICE_IDS?: string;
  readonly VITE_NEWGEN_SMOKE_SENSOR_DEVICE_IDS?: string;
  readonly VITE_NEWGEN_HUMAN_SENSOR_DEVICE_IDS?: string;
  readonly VITE_ENABLE_MINIAPP_LOG_UI?: string;
  readonly VITE_ENABLE_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
