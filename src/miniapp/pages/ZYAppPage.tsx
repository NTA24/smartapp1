import React, { useEffect, useRef, useState } from "react";
import { useMiniApp } from "../context/MiniAppContext";
import { addLog } from "../lib/debugLog";
import { isWindVaneReady, onWindVaneReady } from "../services/auth";
import { callMakeCallFromCamera, updateCameraFlowTrace } from "../utils/cameraFlow";

type CallState = "idle" | "loading" | "success" | "error";

export const ZYAppPage: React.FC = () => {
  const { userPhone, cameraToken, cameraUIDs, requestAuthAndPhone, authLoading } = useMiniApp();

  const [callState, setCallState] = useState<CallState>("idle");
  const [callMsg, setCallMsg] = useState("");
  const [callResult, setCallResult] = useState("");
  const [refreshMsg, setRefreshMsg] = useState("");
  const phone = String(userPhone || "").replace(/[^\d]/g, "").trim();

  // Gọi JSAPI ngay khi mount (hoặc khi cameraToken sẵn sàng lần đầu)
  const didCallRef = useRef(false);

  useEffect(() => {
    if (didCallRef.current) return;
    if (!cameraToken) return;

    didCallRef.current = true;
    setCallState("loading");
    setCallMsg("");
    setCallResult("");

    updateCameraFlowTrace({ jsapiStatus: "calling", jsapiCalledAt: new Date().toISOString() });
    addLog("[CHECK][JSAPI_CALL] auto-call on mount", { tokenPreview: cameraToken.slice(0, 8) + "…" });

    void (async () => {
      try {
        await onWindVaneReady();
        if (!isWindVaneReady()) throw new Error("WindVane chưa sẵn sàng.");
        const res = await callMakeCallFromCamera(cameraToken, cameraUIDs);
        setCallState("success");
        setCallMsg("makeCallFromCamera thành công.");
        setCallResult(JSON.stringify(res, null, 2));
        updateCameraFlowTrace({ jsapiStatus: "success", jsapiResponseAt: new Date().toISOString() });
        addLog("[CHECK][JSAPI_CALL] success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setCallState("error");
        setCallMsg(msg);
        updateCameraFlowTrace({ jsapiStatus: "error", jsapiError: msg });
        addLog("[CHECK][JSAPI_CALL] error", msg);
      }
    })();
  }, [cameraToken, cameraUIDs]);

  const onRefreshAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshMsg("");
    setCallState("idle");
    setCallMsg("");
    setCallResult("");
    didCallRef.current = false; // cho phép auto-call lại sau khi có token mới
    try {
      await requestAuthAndPhone();
      setRefreshMsg("Đã lấy lại SĐT + cameraToken từ /oauth/user-info.");
      addLog("[CHECK][REFRESH_AUTH] success");
    } catch (err) {
      setRefreshMsg(`Refresh lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="page-zyapp" style={{ padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 10px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2332", marginBottom: 12 }}>Camera</div>

        <div style={{ fontSize: 12, color: "#1a2332", marginBottom: 4 }}>
          SĐT: <strong>{phone || "(chưa có)"}</strong>
        </div>
        <div style={{ fontSize: 12, color: "#1a2332", marginBottom: 12 }}>
          cameraToken: <strong>{cameraToken ? cameraToken.slice(0, 12) + "…" : "(chưa có)"}</strong>
        </div>

        {/* Trạng thái gọi JSAPI */}
        {callState === "loading" && (
          <div style={{ color: "#637083", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Đang gọi makeCallFromCamera…
          </div>
        )}
        {callState === "success" && (
          <div style={{ color: "#128a57", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {callMsg}
          </div>
        )}
        {callState === "error" && (
          <div style={{ color: "#c0392b", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Lỗi: {callMsg}
          </div>
        )}
        {!cameraToken && callState === "idle" && (
          <div style={{ color: "#c0392b", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Chưa có cameraToken — bấm &quot;Refresh auth&quot; để lấy.
          </div>
        )}

        {!!callResult && (
          <pre style={{ borderRadius: 10, padding: 12, background: "#f5f8fc", color: "#1a2332", fontSize: 12, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 12 }}>
            {callResult}
          </pre>
        )}

        {/* Nút refresh auth (dùng khi lỗi hoặc chưa có token) */}
        <form onSubmit={(e) => void onRefreshAuth(e)}>
          <button
            type="submit"
            disabled={authLoading}
            style={{ width: "100%", height: 42, borderRadius: 10, border: "none", background: "#eef3f9", color: "#1a2332", fontWeight: 700, fontSize: 14, cursor: authLoading ? "default" : "pointer", opacity: authLoading ? 0.7 : 1 }}
          >
            {authLoading ? "Đang lấy…" : "Refresh auth (auth → /oauth/user-info)"}
          </button>
        </form>

        {!!refreshMsg && (
          <div style={{ marginTop: 8, color: "#128a57", fontSize: 13, fontWeight: 600 }}>
            {refreshMsg}
          </div>
        )}
      </div>
    </div>
  );
};
