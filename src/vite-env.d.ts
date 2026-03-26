/// <reference types="vite/client" />

/** Biến môi trường Vite (prefix VITE_) — khai báo để TypeScript/IDE gợi ý đúng. */
interface ImportMetaEnv {
  readonly VITE_NEWGEN_API_KEY?: string;
  /** `true`: hiện panel log addLog() trên màn hình Mini App */
  readonly VITE_ENABLE_MINIAPP_LOG_UI?: string;
  /** `true`: tải Eruda (console trên WebView), có thể bị Super App chặn CDN */
  readonly VITE_ENABLE_DEVTOOLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
