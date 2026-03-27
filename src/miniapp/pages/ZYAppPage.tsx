import React, { useEffect, useMemo, useState } from "react";
import { useMiniApp } from "../context/MiniAppContext";
import { addLog } from "../lib/debugLog";
import { getAuthCode, isWindVaneReady, onWindVaneReady } from "../services/auth";
import { extractCameraToken, updateCameraFlowTrace } from "../utils/cameraFlow";
import { ZYAPP_CAMERA_TOKEN_STORAGE_KEY } from "../lib/storageKeys";

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
  const { userPhone } = useMiniApp();

  const [bridgeMsg, setBridgeMsg] = useState("");

  const [cameraTokenLoading, setCameraTokenLoading] = useState(false);
  const [cameraToken, setCameraToken] = useState("");
  const [cameraTokenMsg, setCameraTokenMsg] = useState("");

  const [cameraCallLoading, setCameraCallLoading] = useState(false);
  const [cameraCallResult, setCameraCallResult] = useState("");
  const [cameraCallMsg, setCameraCallMsg] = useState("");

  const username = useMemo(
    () => String(userPhone || "").replace(/[^\d]/g, "").trim(),
    [userPhone],
  );

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

  useEffect(() => {
    // Dùng token đã lưu từ flow requestAuthAndPhone -> getUserInfoByAuthCode.
    try {
      const raw = sessionStorage.getItem(ZYAPP_CAMERA_TOKEN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const tokenFromApi = extractCameraToken(parsed);
      if (!tokenFromApi) return;
      setCameraToken(tokenFromApi);
      setCameraTokenMsg("Đã nhận cameraToken từ response user-info (flow requestAuthAndPhone).");
      addLog("[CHECK][USER_INFO_API] cameraToken loaded for JSAPI", {
        tokenPreview: tokenFromApi.slice(0, 8) + "…",
      });
    } catch (err) {
      addLog("[CHECK][USER_INFO_API] failed to read stored response", err);
    }
  }, []);

  const onGetCameraToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCameraTokenLoading(true);
    setCameraToken("");
    setCameraTokenMsg("");
    setCameraCallResult("");
    setCameraCallMsg("");

    try {
      if (!username) throw new Error("Chưa có username (userPhone rỗng)");
      const auth = await getAuthCode();
      const tk = String(auth.authCode ?? "").trim();
      if (!tk) throw new Error("Không lấy được authCode");
      setCameraToken(tk);
      setCameraTokenMsg("Đã refresh cameraToken từ authCode (wv.getAuthCode).");
      addLog("[CHECK][AUTH_CODE] refresh button got authCode", { authCodePreview: tk.slice(0, 8) + "…" });
    } catch (err) {
      setCameraTokenMsg(`Refresh cameraToken từ authCode lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCameraTokenLoading(false);
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
    addLog("[CHECK][JSAPI_CALL] start makeCallFromCamera");
    try {
      if (!cameraToken) {
        throw new Error("Chưa có cameraToken từ flow requestAuthAndPhone/user-info. Hãy auth lại hoặc bấm 'Refresh token từ authCode'.");
      }
      await onWindVaneReady();
      if (!isWindVaneReady()) {
        throw new Error("WindVane chưa sẵn sàng — không gọi được makeCallFromCamera.");
      }
      const res = await makeCallFromCameraByJsapi(cameraToken);
      setCameraCallMsg("Đã gọi JSAPI makeCallFromCamera bằng cameraToken hiện tại.");
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

          <form onSubmit={onGetCameraToken} style={{ display: "grid", gap: 10 }}>
            <button
              type="submit"
              disabled={cameraTokenLoading}
              style={{
                width: "100%",
                height: 42,
                borderRadius: 10,
                border: "none",
                background: "#eef3f9",
                color: "#1a2332",
                fontWeight: 700,
                fontSize: 14,
                cursor: cameraTokenLoading ? "default" : "pointer",
                opacity: cameraTokenLoading ? 0.7 : 1,
              }}
            >
              {cameraTokenLoading ? "Đang lấy authCode..." : "Refresh token từ authCode"}
            </button>
          </form>

          {!!cameraTokenMsg && (
            <div style={{ marginTop: 8, color: "#128a57", fontSize: 13, fontWeight: 600 }}>
              {cameraTokenMsg}
            </div>
          )}

          {!!cameraToken && (
            <div style={{ marginTop: 8, color: "#1a2332", fontSize: 12, wordBreak: "break-all" }}>
              cameraToken: <strong>{cameraToken}</strong>
            </div>
          )}

          <button
            type="button"
            disabled={cameraCallLoading}
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

