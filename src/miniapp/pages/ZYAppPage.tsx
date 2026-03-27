import React, { useEffect, useState } from "react";
import { useMiniApp } from "../context/MiniAppContext";
import { addLog } from "../lib/debugLog";
import { isWindVaneReady, onWindVaneReady } from "../services/auth";
import { updateCameraFlowTrace } from "../utils/cameraFlow";

interface CameraJsapiResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return JSON.stringify(err ?? {});
}

function makeCallFromCameraByJsapi(token: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    addLog("[CHECK][JSAPI_PAYLOAD] IOTPlatFormService.makeCallFromCamera payload", {
      cameraTokenPreview: token.slice(0, 8) + "…",
      hasCameraToken: Boolean(token),
    });
    const call = window.WindVane?.call;

    if (typeof call !== "function") {
      reject(new Error("WindVane.call is not available (not running in SuperApp/WebView?)"));
      return;
    }

    call(
      "IOTPlatFormService",
      "makeCallFromCamera",
      { token },
      (res: unknown) => {
        const payload = (res && typeof res === "object" ? res : {}) as CameraJsapiResponse;
        const success = payload.success === true;
        const msg = String(payload.message ?? "");
        if (!success) {
          const errMsg = msg || "makeCallFromCamera failed";
          addLog("[CHECK][JSAPI_CALL] failed (response.success=false)", payload);
          reject(new Error(errMsg));
          return;
        }
        addLog("[CHECK][JSAPI_CALL] success", payload);
        resolve(payload);
      },
      (err: unknown) => {
        const msg = getErrorMessage(err);
        addLog("[CHECK][JSAPI_CALL] error callback", msg);
        reject(new Error(msg || "makeCallFromCamera failed"));
      },
    );
  });
}

export const ZYAppPage: React.FC = () => {
  const { userPhone, cameraToken, requestAuthAndPhone, authLoading } = useMiniApp();

  const [bridgeMsg, setBridgeMsg] = useState("");
  const [refreshMsg, setRefreshMsg] = useState("");

  const [cameraCallLoading, setCameraCallLoading] = useState(false);
  const [cameraCallResult, setCameraCallResult] = useState("");
  const [cameraCallMsg, setCameraCallMsg] = useState("");

  const phone = String(userPhone || "").replace(/[^\d]/g, "").trim();

  useEffect(() => {
    let cancelled = false;
    setBridgeMsg("Đang kiểm tra WindVane (JSAPI native)…");
    void onWindVaneReady()
      .then(() => {
        if (cancelled) return;
        setBridgeMsg(
          isWindVaneReady()
            ? "WindVane sẵn sàng — luồng camera dùng IOTPlatFormService.makeCallFromCamera (native)."
            : "WindVane không khả dụng.",
        );
      })
      .catch(() => {
        if (!cancelled) setBridgeMsg("Không đợi được WindVane (có thể không chạy trong Super App).");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefreshPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshMsg("");
    setCameraCallResult("");
    setCameraCallMsg("");
    try {
      await requestAuthAndPhone();
      setRefreshMsg("Đã refresh SĐT + cameraToken từ /oauth/user-info.");
      addLog("[CHECK][REFRESH_AUTH] success via requestAuthAndPhone");
    } catch (err) {
      setRefreshMsg(`Refresh lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const onCallMakeCallFromCamera = async () => {
    setCameraCallLoading(true);
    setCameraCallMsg("");
    setCameraCallResult("");
    updateCameraFlowTrace({
      jsapiStatus: "calling",
      jsapiCalledAt: new Date().toISOString(),
    });
    addLog("[CHECK][JSAPI_CALL] start makeCallFromCamera", {
      hasCameraToken: Boolean(cameraToken),
      tokenPreview: cameraToken ? cameraToken.slice(0, 8) + "…" : "",
    });
    try {
      if (!cameraToken) {
        throw new Error("Chưa có cameraToken từ /oauth/user-info. Hãy bấm 'Refresh auth' hoặc chờ auth flow hoàn tất.");
      }
      await onWindVaneReady();
      if (!isWindVaneReady()) {
        throw new Error("WindVane chưa sẵn sàng — không gọi được makeCallFromCamera.");
      }
      const res = await makeCallFromCameraByJsapi(cameraToken);
      setCameraCallMsg("Đã gọi JSAPI makeCallFromCamera bằng cameraToken từ /oauth/user-info.");
      setCameraCallResult(JSON.stringify(res, null, 2));
      updateCameraFlowTrace({
        jsapiStatus: "success",
        jsapiResponseAt: new Date().toISOString(),
      });
      addLog("[CHECK][JSAPI_CALL] completed successfully");
    } catch (err) {
      setCameraCallMsg(`makeCallFromCamera lỗi: ${err instanceof Error ? err.message : String(err)}`);
      updateCameraFlowTrace({
        jsapiStatus: "error",
        jsapiError: err instanceof Error ? err.message : String(err),
      });
      addLog("[CHECK][JSAPI_CALL] completed with error", err instanceof Error ? err.message : String(err));
    } finally {
      setCameraCallLoading(false);
    }
  };

  return (
    <div className="page-zyapp" style={{ padding: 16 }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2332", marginBottom: 12 }}>Camera</div>

        {/* Camera JSAPI */}
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #eef1f5" }}>
          <div style={{ fontWeight: 700, color: "#1a2332", marginBottom: 8, fontSize: 14 }}>
            Camera JSAPI (native)
          </div>

          {!!bridgeMsg && (
            <div style={{ marginTop: 2, color: "#637083", fontSize: 12, fontWeight: 600 }}>
              {bridgeMsg}
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 12, color: "#1a2332" }}>
            SĐT: <strong>{phone || "(chưa có)"}</strong>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#1a2332" }}>
            cameraToken: <strong>{cameraToken ? cameraToken.slice(0, 12) + "…" : "(chưa có)"}</strong>
          </div>

          <form onSubmit={(e) => void onRefreshPhone(e)} style={{ display: "grid", gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 10,
                border: "none",
                background: "#eef3f9",
                color: "#1a2332",
                fontWeight: 700,
                fontSize: 14,
                cursor: authLoading ? "default" : "pointer",
                opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading ? "Đang lấy..." : "Refresh auth (auth → /oauth/user-info)"}
            </button>
          </form>

          {!!refreshMsg && (
            <div style={{ marginTop: 8, color: "#128a57", fontSize: 13, fontWeight: 600 }}>
              {refreshMsg}
            </div>
          )}

          <button
            type="button"
            disabled={cameraCallLoading || !cameraToken}
            onClick={() => void onCallMakeCallFromCamera()}
            style={{
              marginTop: 10,
              width: "100%",
              height: 42,
              borderRadius: 10,
              border: "none",
              background: "#00acc1",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: cameraCallLoading ? "default" : "pointer",
              opacity: cameraCallLoading ? 0.7 : 1,
            }}
          >
            {cameraCallLoading ? "Đang gọi makeCallFromCamera..." : "makeCallFromCamera"}
          </button>

          {!!cameraCallMsg && (
            <div style={{ marginTop: 10, color: "#128a57", fontSize: 13, fontWeight: 600 }}>
              {cameraCallMsg}
            </div>
          )}

          {!!cameraCallResult && (
            <pre
              style={{
                marginTop: 8,
                borderRadius: 10,
                padding: 12,
                background: "#f5f8fc",
                color: "#1a2332",
                fontSize: 12,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {cameraCallResult}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

