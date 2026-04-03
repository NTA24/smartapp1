/// <reference types="vite/client" />

/** Biến môi trường Vite (prefix VITE_) — khai báo để TypeScript/IDE gợi ý đúng. */
interface ImportMetaEnv {
  readonly VITE_NEWGEN_API_KEY?: string;
  /** ApiKey cho GET /api/customer/{id}/devices (thiết bị mẫu Smart Home) */
  readonly VITE_NEWGEN_SAMPLE_DEVICES_API_KEY?: string;
  /** JWT ThingsBoard cho WebSocket `wss://…/api/ws` (ưu tiên hơn ApiKey; tránh lỗi invalid jwt) */
  readonly VITE_NEWGEN_WS_JWT?: string;
  /** `false`: subscribe WS kiểu `tsSubCmds`/`attrSubCmds`. Mặc định / `true`: kiểu `{ cmds: [...] }` (NewGen). */
  readonly VITE_NEWGEN_WS_USE_CMDS_FORMAT?: string;
  /** UUID ThingsBoard (phân tách bằng dấu phẩy) — ép nhận diện Smart Switch / telemetry power */
  readonly VITE_NEWGEN_SMART_SWITCH_DEVICE_IDS?: string;
  /** UUID TB — gateway/ổ cắm HA (`cmd-socket` / `state-plug`), khi tên không khớp hub/gateway */
  readonly VITE_NEWGEN_GATEWAY_SOCKET_DEVICE_IDS?: string;
  /** UUID TB — LED strip (`cmd-light`, `color-temp-light`), khi tên không khớp heuristic */
  readonly VITE_NEWGEN_LED_STRIP_DEVICE_IDS?: string;
  /** UUID TB — cảm biến khói (timeseries `smokeDetected`) */
  readonly VITE_NEWGEN_SMOKE_SENSOR_DEVICE_IDS?: string;
  /** UUID TB — cảm biến người/PIR (timeseries `human_sensor`) */
  readonly VITE_NEWGEN_HUMAN_SENSOR_DEVICE_IDS?: string;
  /** `true`: hiện panel log addLog() trên màn hình Mini App */
  readonly VITE_ENABLE_MINIAPP_LOG_UI?: string;
  /** `true`: tải Eruda (console trên WebView), có thể bị Super App chặn CDN */
  readonly VITE_ENABLE_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
