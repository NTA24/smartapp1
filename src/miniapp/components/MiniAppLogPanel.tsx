import React, { useEffect, useMemo, useState } from "react";
import { clearLogs, getLogs } from "../lib/debugLog";

type PanelTab = "log" | "authcode";
const LAST_AUTH_CODE_KEY = "miniapp_last_auth_code";

function copyTextWithFallback(text: string): Promise<void> {
  return navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

export const MiniAppLogPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(() => getLogs());
  const [tab, setTab] = useState<PanelTab>("log");
  const [lastAuthCode, setLastAuthCode] = useState<string>(() => {
    try {
      return sessionStorage.getItem(LAST_AUTH_CODE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    const onLog = (ev: Event) => {
      const detail = (ev as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setLines(detail);
      else setLines(getLogs());
      try {
        setLastAuthCode(sessionStorage.getItem(LAST_AUTH_CODE_KEY) ?? "");
      } catch {}
    };
    window.addEventListener("miniapp-debug-log", onLog as EventListener);
    return () => window.removeEventListener("miniapp-debug-log", onLog as EventListener);
  }, []);

  const count = lines.length;
  const reversed = useMemo(() => [...lines].reverse(), [lines]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 12,
          bottom: 86,
          zIndex: 220,
          border: "1px solid rgba(15,23,42,0.14)",
          borderRadius: 999,
          background: "#ffffff",
          color: "#0f172a",
          height: 34,
          padding: "0 12px",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 4px 12px rgba(2, 6, 23, 0.12)",
        }}
        aria-label="Mở log debug miniapp"
      >
        Log{count > 0 ? ` (${count})` : ""}
      </button>

      {open ? (
        <section
          style={{
            position: "fixed",
            left: 10,
            right: 10,
            bottom: 126,
            zIndex: 230,
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.3)",
            boxShadow: "0 12px 28px rgba(2, 6, 23, 0.45)",
            overflow: "hidden",
          }}
          aria-label="Bảng log debug miniapp"
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span>MiniApp log ({count})</span>
            <span style={{ display: "inline-flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setTab("log")}
                style={{ ...miniBtnStyle, ...(tab === "log" ? activeMiniBtnStyle : null) }}
              >
                Log
              </button>
              <button
                type="button"
                onClick={() => setTab("authcode")}
                style={{ ...miniBtnStyle, ...(tab === "authcode" ? activeMiniBtnStyle : null) }}
              >
                Authcode
              </button>
              <button
                type="button"
                onClick={async () => {
                  const text = getLogs().join("\n");
                  await copyTextWithFallback(text);
                }}
                style={miniBtnStyle}
              >
                Copy log
              </button>
              <button
                type="button"
                onClick={async () => {
                  await copyTextWithFallback(lastAuthCode || "");
                }}
                style={miniBtnStyle}
              >
                Copy authcode
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLogs();
                  setLines([]);
                }}
                style={miniBtnStyle}
              >
                Xóa
              </button>
              <button type="button" onClick={() => setOpen(false)} style={miniBtnStyle}>
                Đóng
              </button>
            </span>
          </header>
          <div
            style={{
              maxHeight: "38vh",
              overflow: "auto",
              padding: "8px 10px 10px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: 11,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {tab === "log" ? (
              reversed.length === 0 ? (
                <div style={{ color: "#94a3b8" }}>Chưa có log.</div>
              ) : (
                reversed.map((line, i) => <div key={`${i}-${line.slice(0, 24)}`}>{line}</div>)
              )
            ) : lastAuthCode ? (
              <div>{lastAuthCode}</div>
            ) : (
              <div style={{ color: "#94a3b8" }}>Chưa có authcode.</div>
            )}
          </div>
        </section>
      ) : null}
    </>
  );
};

const miniBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.45)",
  borderRadius: 8,
  background: "rgba(15,23,42,0.4)",
  color: "#e2e8f0",
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 600,
};

const activeMiniBtnStyle: React.CSSProperties = {
  background: "rgba(15,23,42,0.75)",
  borderColor: "rgba(125, 211, 252, 0.8)",
};

