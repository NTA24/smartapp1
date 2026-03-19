import React, { useEffect, useMemo, useState } from "react";
import { getAuthCode } from "../services/auth";

const ZYAPP_HOST = "https://smartapp-ten.vercel.app";
const ZYAPP_BASE = `${ZYAPP_HOST}/ZYApp/`;

export const ZYAppPage: React.FC = () => {
  const [decoderError, setDecoderError] = useState<string>("");
  const [logOpen, setLogOpen] = useState(false);
  const [logText, setLogText] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const urls = useMemo(() => {
    return {
      index: ZYAPP_BASE + "index.html",
      js: ZYAPP_BASE + "libffmpeg_264_265.js",
      wasm: ZYAPP_BASE + "libffmpeg_264_265.wasm",
    };
  }, []);

  const appendLog = (line: string) => {
    setLogText((prev) => (prev ? prev + "\n" + line : line));
  };

  const runLogChecks = async () => {
    setLogText("");
    appendLog(`location.href: ${window.location.href}`);
    appendLog(`location.origin: ${window.location.origin}`);
    appendLog(`location.pathname: ${window.location.pathname}`);
    appendLog(`location.hash: ${window.location.hash}`);
    appendLog(`UA: ${navigator.userAgent}`);
    appendLog("");
    appendLog(`resolved ZYApp index: ${urls.index}`);
    appendLog(`resolved ZYApp js: ${urls.js}`);
    appendLog(`resolved ZYApp wasm: ${urls.wasm}`);
    appendLog("");

    const checkHead = async (url: string) => {
      try {
        const res = await fetch(url, { method: "HEAD", credentials: "same-origin" });
        const ct = res.headers.get("Content-Type") ?? "";
        const cl = res.headers.get("Content-Length") ?? "";
        appendLog(`${url} -> ${res.status} ${res.statusText} | content-type: ${ct}`);
        if (cl) appendLog(`  content-length: ${cl}`);
      } catch (e) {
        appendLog(`${url} -> ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    const checkWasmMagic = async (url: string) => {
      try {
        const res = await fetch(url, {
          method: "GET",
          credentials: "same-origin",
          headers: { Range: "bytes=0-3" },
        });
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
        appendLog(`wasm magic (first 4 bytes): ${hex} (expect: 00 61 73 6d)`);
      } catch (e) {
        appendLog(`wasm magic -> ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    await checkHead(urls.js);
    await checkHead(urls.wasm);
    await checkWasmMagic(urls.wasm);
  };

  const handleGetAuthCode = async () => {
    setAuthLoading(true);
    setCopyStatus("");
    appendLog("");
    appendLog("[auth] calling wv.getAuthCode...");
    try {
      const result = await getAuthCode(["auth_user"]);
      setAuthCode(result.authCode);
      appendLog(`[auth] scope used: ${result.scopes.join(", ")}`);
      appendLog(`[auth] authCode: ${result.authCode}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`[auth] ERROR: ${msg}`);
    } finally {
      setAuthLoading(false);
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
      setCopyStatus("Copied");
      appendLog("[auth] copied authCode to clipboard");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCopyStatus("Copy failed");
      appendLog(`[auth] copy failed: ${msg}`);
    }
  };

  useEffect(() => {
    const main = document.getElementById("main-content");
    main?.classList.add("is-zyapp");
    // Decoder resource check (WASM must be reachable for decoding to work)
    fetch(urls.wasm, { method: "HEAD", credentials: "same-origin" })
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
  }, [urls.wasm]);

  return (
    <div className="page-zyapp">
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 11, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => void handleGetAuthCode()}
          disabled={authLoading}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            opacity: authLoading ? 0.6 : 1,
          }}
        >
          {authLoading ? "Getting..." : "Get authCode"}
        </button>
        <button
          type="button"
          onClick={() => void handleCopyAuthCode()}
          disabled={!authCode}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
            opacity: authCode ? 1 : 0.6,
          }}
          title={authCode ? "Copy latest authCode" : "No authCode yet"}
        >
          {copyStatus || "Copy authCode"}
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !logOpen;
            setLogOpen(next);
            if (next) void runLogChecks();
          }}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {logOpen ? "Hide log" : "Log"}
        </button>
        {logOpen && (
          <button
            type="button"
            onClick={() => void runLogChecks()}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        )}
      </div>

      {logOpen && (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 8,
            right: 8,
            zIndex: 11,
            maxHeight: 180,
            overflow: "auto",
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(255,255,255,0.92)",
            fontSize: 12,
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {logText || "…"}
          {authCode ? `\n\nauthCode(latest): ${authCode}` : ""}
        </div>
      )}

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
      <iframe title="ZYApp" src={urls.index} className="zyapp-iframe" />
    </div>
  );
};

