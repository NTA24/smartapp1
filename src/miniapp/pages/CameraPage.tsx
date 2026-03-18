import React, { useEffect, useState } from "react";

const DIST_INDEX_URL = "/dist/index.html";
const DIST_WASM_URL = "/dist/libffmpeg_264_265.wasm";

async function checkWasm(): Promise<{ ok: boolean; message: string }> {
  if (typeof WebAssembly !== "object") return { ok: false, message: "WebAssembly không hỗ trợ" };
  try {
    const res = await fetch(DIST_WASM_URL, { method: "HEAD", credentials: "same-origin" });
    const mime = (res.headers.get("Content-Type") ?? "").toLowerCase();
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
    if (mime.includes("text/html")) return { ok: false, message: "WASM bị trả thành HTML (fallback)" };
    return { ok: true, message: "WASM OK" };
  } catch (e) {
    return { ok: false, message: (e as Error).message || String(e) };
  }
}

export const CameraPage: React.FC = () => {
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    // Route /camera: bỏ padding/scroll của #main-content để iframe không bị “lộ” content phía sau
    const main = document.getElementById("main-content");
    main?.classList.add("is-camera");
    checkWasm().then((r) => {
      if (!r.ok) setErr(r.message);
    });
    return () => {
      main?.classList.remove("is-camera");
    };
  }, []);

  return (
    <div className="page-camera">
      {err && (
        <div className="camera-wasm-check" data-ok="false" title={err}>
          WASM: ✗ {err}
        </div>
      )}
      <iframe title="Camera" src={DIST_INDEX_URL} className="camera-iframe" />
    </div>
  );
};

