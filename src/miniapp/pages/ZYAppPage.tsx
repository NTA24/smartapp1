import React, { useEffect, useState } from "react";

const ZYAPP_INDEX_URL = "/ZYApp/index.html";
const ZYAPP_WASM_URL = "/ZYApp/libffmpeg_264_265.wasm";

export const ZYAppPage: React.FC = () => {
  const [decoderError, setDecoderError] = useState<string>("");

  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.classList.add("is-zyapp");
    // Decoder resource check (WASM must be reachable for decoding to work)
    fetch(ZYAPP_WASM_URL, { method: "HEAD", credentials: "same-origin" })
      .then((r) => {
        const mime = (r.headers.get("Content-Type") ?? "").toLowerCase();
        if (!r.ok) throw new Error(`WASM HTTP ${r.status}`);
        if (mime.includes("text/html")) throw new Error("WASM bị trả thành HTML (fallback)");
        // ok: do nothing
      })
      .catch((e) => setDecoderError(e instanceof Error ? e.message : String(e)));
    return () => {
      main?.classList.remove("is-zyapp");
    };
  }, []);

  return (
    <div className="page-zyapp">
      {decoderError && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            zIndex: 10,
            padding: "8px 10px",
            borderRadius: 10,
            background: "#ffebee",
            color: "#c62828",
            fontSize: 12,
            fontWeight: 600,
          }}
          title={decoderError}
        >
          Decoder WASM lỗi: {decoderError}
        </div>
      )}
      <iframe title="ZYApp" src={ZYAPP_INDEX_URL} className="zyapp-iframe" />
    </div>
  );
};

