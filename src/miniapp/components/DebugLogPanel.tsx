import React, { useState, useEffect } from "react";
import { getLogs, clearLogs } from "../lib/debugLog";

export const DebugLogPanel: React.FC = () => {
  const [lines, setLines] = useState<string[]>(() => getLogs());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onLog = () => setLines(getLogs());
    window.addEventListener("miniapp-debug-log", onLog);
    return () => window.removeEventListener("miniapp-debug-log", onLog);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 56,
          right: 8,
          zIndex: 9998,
          width: 40,
          height: 40,
          borderRadius: 20,
          border: "1px solid #333",
          background: "#1a1a1a",
          color: "#0f0",
          fontSize: 10,
          cursor: "pointer",
        }}
        aria-label="Mở log"
      >
        Log
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            top: 40,
            zIndex: 9999,
            background: "rgba(0,0,0,0.95)",
            color: "#0f0",
            fontFamily: "monospace",
            fontSize: 11,
            overflow: "auto",
            padding: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, position: "sticky", top: 0, background: "#1a1a1a", padding: "4px 0" }}>
            <strong>MiniApp debug log (WebView)</strong>
            <span>
              <button
                type="button"
                onClick={clearLogs}
                style={{ marginRight: 8, padding: "4px 8px", fontSize: 11 }}
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ padding: "4px 8px", fontSize: 11 }}
              >
                Đóng
              </button>
            </span>
          </div>
          {lines.length === 0 ? (
            <div style={{ color: "#666" }}>Chưa có log. Thao tác app để xem.</div>
          ) : (
            lines.map((line, i) => (
              <div key={i} style={{ marginBottom: 2, borderBottom: "1px solid #222" }}>
                {line}
              </div>
            ))
          }
        </div>
      )}
    </>
  );
};
