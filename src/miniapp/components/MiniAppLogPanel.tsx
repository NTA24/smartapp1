import React, { useEffect, useState } from "react";
import { clearLogs, getLogs } from "../lib/debugLog";
import { isMiniAppLogUiEnabled } from "../lib/enableDevtools";

/**
 * Panel log từ addLog() — bật bằng VITE_ENABLE_MINIAPP_LOG_UI / ?logui=1 / DEV.
 */
export const MiniAppLogPanel: React.FC = () => {
  // Mặc định ẩn để không che UI Camera, bật khi cần debug.
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(() => getLogs());

  useEffect(() => {
    if (!isMiniAppLogUiEnabled()) return;

    const onLog = (e: Event) => {
      if (!(e instanceof CustomEvent) || !Array.isArray(e.detail)) return;
      const detail = e.detail.filter((item): item is string => typeof item === "string");
      setLines([...detail]);
    };
    window.addEventListener("miniapp-debug-log", onLog);
    setLines(getLogs());
    return () => window.removeEventListener("miniapp-debug-log", onLog);
  }, []);

  if (!isMiniAppLogUiEnabled()) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          left: 8,
          bottom: 72,
          zIndex: 999998,
          padding: "8px 10px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.2)",
          background: "rgba(255,255,255,0.96)",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        }}
      >
        Log
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        right: 8,
        bottom: 72,
        maxHeight: "38vh",
        zIndex: 999998,
        display: "flex",
        flexDirection: "column",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.15)",
        background: "rgba(255,255,255,0.97)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: "1px solid #e8ecf0",
          fontSize: 12,
          fontWeight: 700,
          color: "#1a2332",
        }}
      >
        <span>MiniApp log (addLog)</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => clearLogs()}
            style={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, border: "1px solid #cfd7e3", background: "#fff" }}
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, border: "1px solid #cfd7e3", background: "#fff" }}
          >
            Thu
          </button>
        </span>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 10,
          flex: 1,
          overflow: "auto",
          fontSize: 10,
          lineHeight: 1.35,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "#1a2332",
          background: "#f8fafc",
        }}
      >
        {lines.length ? lines.join("\n") : "(chưa có log)"}
      </pre>
    </div>
  );
};
