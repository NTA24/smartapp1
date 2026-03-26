import React, { useEffect, useMemo, useState } from "react";
import { useMiniApp } from "../context/MiniAppContext";
import { addLog } from "../lib/debugLog";
import { getAuthCode } from "../services/auth";

const ZY_SDK_MODULE_URL = "/ZYApp/js/index.1773823368676.js";

function makeCallFromCameraByJsapi(token: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    addLog("JSAPI makeCallFromCamera → IOTPlatFormService.makeCallFromCamera", { token: token.slice(0, 8) + "…" });
    const call = (window as any)?.WindVane?.call as
      | ((className: string, method: string, params: any, ok: (res: any) => void, err: (e: any) => void) => void)
      | undefined;

    if (typeof call !== "function") {
      reject(new Error("WindVane.call is not available (not running in SuperApp/WebView?)"));
      return;
    }

    call(
      "IOTPlatFormService",
      "makeCallFromCamera",
      { token },
      (res: any) => {
        addLog("JSAPI makeCallFromCamera OK", res);
        resolve(res);
      },
      (err: any) => {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : JSON.stringify(err ?? {});
        addLog("JSAPI makeCallFromCamera ERR", msg);
        reject(new Error(msg || "makeCallFromCamera failed"));
      },
    );
  });
}

export const ZYAppPage: React.FC = () => {
  const { userPhone } = useMiniApp();

  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkMsg, setSdkMsg] = useState("");

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

    async function loadSdkOnce() {
      // Best-effort: avoid re-injecting module on re-render/navigation
      const win = window as unknown as { __ZYAPP_SDK_LOADED__?: boolean };
      if (win.__ZYAPP_SDK_LOADED__) {
        setSdkLoaded(true);
        setSdkMsg("SDK camera đã được nạp sẵn.");
        return;
      }

      setSdkMsg("Đang nạp SDK camera (module)..."); // best-effort

      await new Promise<void>((resolve) => {
        const existing = document.getElementById("zyapp-sdk-module-script");
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.id = "zyapp-sdk-module-script";
        script.type = "module";
        script.src = ZY_SDK_MODULE_URL;
        script.async = true;

        script.onload = () => resolve();
        script.onerror = () => resolve(); // vẫn resolve để tránh treo UI

        document.head.appendChild(script);

        // Fallback: module onload sometimes may not fire in some webviews.
        window.setTimeout(() => resolve(), 2000);
      });

      if (cancelled) return;
      (window as unknown as { __ZYAPP_SDK_LOADED__?: boolean }).__ZYAPP_SDK_LOADED__ = true;
      setSdkLoaded(true);
      setSdkMsg("SDK camera đã nạp xong (best-effort).");
    }

    if (typeof window !== "undefined") void loadSdkOnce();
    return () => {
      cancelled = true;
    };
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
      const auth = await getAuthCode(["USER_NAME", "USER_EMAIL"]);
      const tk = String(auth.authCode ?? "").trim();
      if (!tk) throw new Error("Không lấy được authCode");
      setCameraToken(tk);
      setCameraTokenMsg("Đã lấy authCode từ wv.getAuthCode và gán làm token");
      addLog("Camera token source: authCode", { tokenPreview: tk.slice(0, 8) + "…" });
    } catch (err) {
      setCameraTokenMsg(`Lấy authCode lỗi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCameraTokenLoading(false);
    }
  };

  const onCallMakeCallFromCamera = async () => {
    setCameraCallLoading(true);
    setCameraCallMsg("");
    setCameraCallResult("");
    try {
      if (!cameraToken) throw new Error("Chưa có camera token. Hãy bấm 'Get camera token' trước.");
      if (!sdkLoaded) throw new Error("SDK camera chưa nạp xong. Vui lòng chờ vài giây rồi bấm lại.");
      const res = await makeCallFromCameraByJsapi(cameraToken);
      setCameraCallMsg("Đã gọi JSAPI makeCallFromCamera");
      setCameraCallResult(JSON.stringify(res, null, 2));
    } catch (err) {
      setCameraCallMsg(`makeCallFromCamera lỗi: ${err instanceof Error ? err.message : String(err)}`);
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
            Camera JSAPI (SDK)
          </div>

          {!!sdkMsg && (
            <div style={{ marginTop: 2, color: "#637083", fontSize: 12, fontWeight: 600 }}>
              {sdkMsg}
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
              {cameraTokenLoading ? "Đang lấy authCode..." : "Get authCode -> token"}
            </button>
          </form>

          {!!cameraTokenMsg && (
            <div style={{ marginTop: 8, color: "#128a57", fontSize: 13, fontWeight: 600 }}>
              {cameraTokenMsg}
            </div>
          )}

          {!!cameraToken && (
            <div style={{ marginTop: 8, color: "#1a2332", fontSize: 12, wordBreak: "break-all" }}>
              token: <strong>{cameraToken}</strong>
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

