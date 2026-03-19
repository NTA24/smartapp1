import React, { useState } from "react";
import { getAuthCode } from "../services/auth";

export const DebugLogPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [status, setStatus] = useState("");

  const handleGetAuthCode = async () => {
    setLoading(true);
    setStatus("");
    try {
      const result = await getAuthCode(["auth_user"]);
      setAuthCode(result.authCode || "");
      setStatus(result.authCode ? "Lấy authCode thành công" : "Không nhận được authCode");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAuthCode = async () => {
    if (!authCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(authCode);
      } else {
        const ta = document.createElement("textarea");
        ta.value = authCode;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setStatus("Đã copy authCode");
    } catch (e) {
      setStatus("Copy lỗi: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 8,
        bottom: 56,
        zIndex: 9998,
        width: 220,
        padding: 8,
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.18)",
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => void handleGetAuthCode()}
          disabled={loading}
          style={{
            flex: 1,
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#fff",
            fontSize: 12,
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Getting..." : "Get authCode"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopyAuthCode()}
          disabled={!authCode}
          style={{
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#fff",
            fontSize: 12,
            fontWeight: 600,
            opacity: authCode ? 1 : 0.5,
          }}
        >
          Copy
        </button>
      </div>
      <div
        style={{
          minHeight: 36,
          maxHeight: 90,
          overflow: "auto",
          padding: "6px 8px",
          borderRadius: 8,
          background: "#f7f7f7",
          fontSize: 11,
          lineHeight: 1.35,
          wordBreak: "break-all",
        }}
      >
        {authCode || "Chưa có authCode"}
      </div>
      {status && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#444", wordBreak: "break-word" }}>
          {status}
        </div>
      )}
    </div>
  );
};
