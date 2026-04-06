import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNewgenWsJwt, getNewgenWsTelemetryUrl } from "../lib/config";
import { latestScalar, mergeWsDataLayers } from "../lib/wsLabShared";

type ScopeMode = "client" | "newgen";

const DEFAULT_PLUG_DEVICE_ID = "40b19a30-21e3-11f1-b9a6-41c05f43cae8";
const STATE_PLUG_KEY = "state-plug";

function parsePlugOn(raw: unknown): string {
  if (raw === undefined || raw === null) return "—";
  const s = String(raw).toLowerCase().trim();
  if (s === "on" || s === "true" || s === "1") return "on";
  if (s === "off" || s === "false" || s === "0") return "off";
  return String(raw);
}

export const WsHallwayPlugLabPage: React.FC = () => {
  const [token, setToken] = useState(() => getNewgenWsJwt());
  const [deviceId, setDeviceId] = useState(DEFAULT_PLUG_DEVICE_ID);
  const [scopeMode, setScopeMode] = useState<ScopeMode>("client");
  const [connected, setConnected] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [lastPlug, setLastPlug] = useState<string>("—");
  const [lastJson, setLastJson] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const socketRef = useRef<WebSocket | null>(null);

  const appendLog = (line: string) => {
    setLog((prev) => `${line}\n${prev}`.slice(0, 12_000));
  };

  const disconnect = () => {
    const s = socketRef.current;
    socketRef.current = null;
    if (s && s.readyState === WebSocket.OPEN) {
      try {
        s.send(JSON.stringify({ cmds: [{ cmdId: 1, unsubscribe: true }] }));
      } catch {}
      s.close();
    }
    setConnected(false);
  };

  const connect = () => {
    disconnect();
    const t = token.trim();
    const id = deviceId.trim();
    if (!t || !id) {
      appendLog("Cần JWT và Device ID.");
      return;
    }

    const base = getNewgenWsTelemetryUrl();
    const wsUrl = `${base}?token=${encodeURIComponent(t)}`;
    appendLog(`Mở: ${wsUrl.slice(0, 80)}…`);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setMsgCount(0);
      appendLog(`🟢 onopen — authCmd + cmds (đăng ký ${STATE_PLUG_KEY})`);

      const scope = scopeMode === "client" ? "CLIENT_SCOPE" : null;
      const payload = {
        authCmd: {
          cmdId: 0,
          type: "AUTH",
          token: t,
        },
        cmds: [
          {
            cmdId: 1,
            entityType: "DEVICE",
            type: "ATTRIBUTES",
            entityId: id,
            scope,
            keys: STATE_PLUG_KEY,
            unsubscribe: false,
          },
        ],
      };
      socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (ev) => {
      setMsgCount((c) => c + 1);
      try {
        const response = JSON.parse(String(ev.data)) as Record<string, unknown>;
        setLastJson(JSON.stringify(response, null, 2));

        const flat = mergeWsDataLayers(response);
        const v = latestScalar(flat[STATE_PLUG_KEY]);
        setLastPlug(parsePlugOn(v));
      } catch (e) {
        setLastJson(String(ev.data));
        appendLog(`Parse lỗi: ${String(e)}`);
      }
    };

    socket.onerror = () => {
      appendLog("🔴 onerror");
    };

    socket.onclose = (ev) => {
      setConnected(false);
      appendLog(`Đóng: code=${ev.code} reason=${ev.reason || "(none)"}`);
    };
  };

  useEffect(() => () => disconnect(), []);

  const on = lastPlug === "on";

  return (
    <div className="ws-human-lab">
      <div className="ws-human-lab__header">
        <Link to="/profile" className="ws-human-lab__back">
          ‹ Hồ sơ
        </Link>
        <h1 className="ws-human-lab__title">Lab WS · đèn hành lang ({STATE_PLUG_KEY})</h1>
        <p className="ws-human-lab__hint">
          Một gói <code>authCmd</code> + <code>cmds</code> subscribe attribute — nhận đúng format{" "}
          <code>data.state-plug</code> → <code>{'[[ts, "on" | "off"]]'}</code>.
        </p>
      </div>

      <label className="ws-human-lab__label">
        JWT (ThingsBoard)
        <textarea
          className="ws-human-lab__textarea"
          rows={3}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJ…"
          spellCheck={false}
        />
      </label>

      <label className="ws-human-lab__label">
        Device ID (gateway / đèn hành lang)
        <input
          className="ws-human-lab__input"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder={DEFAULT_PLUG_DEVICE_ID}
          spellCheck={false}
        />
      </label>

      <fieldset className="ws-human-lab__fieldset">
        <legend>Scope trong cmds</legend>
        <label className="ws-human-lab__radio">
          <input
            type="radio"
            name="scope-plug"
            checked={scopeMode === "client"}
            onChange={() => setScopeMode("client")}
          />
          <span>
            <code>CLIENT_SCOPE</code> (mặc định — giống subscribe trên thẻ đèn hành lang)
          </span>
        </label>
        <label className="ws-human-lab__radio">
          <input
            type="radio"
            name="scope-plug"
            checked={scopeMode === "newgen"}
            onChange={() => setScopeMode("newgen")}
          />
          <span>
            <code>null</code> (thử nếu không thấy bản tin)
          </span>
        </label>
      </fieldset>

      <div className="ws-human-lab__actions">
        <button type="button" className="ws-human-lab__btn ws-human-lab__btn--primary" onClick={connect}>
          Kết nối &amp; subscribe
        </button>
        <button type="button" className="ws-human-lab__btn" onClick={disconnect}>
          Ngắt
        </button>
      </div>

      <div
        style={{
          marginBottom: 12,
          padding: "14px 16px",
          borderRadius: 12,
          textAlign: "center",
          fontWeight: 700,
          fontSize: 18,
          background: lastPlug === "—" ? "var(--btn-gray)" : on ? "rgba(46, 125, 50, 0.2)" : "rgba(96, 125, 139, 0.25)",
          color: "var(--text-primary)",
        }}
      >
        state-plug: {lastPlug.toUpperCase()}
      </div>

      <div className="ws-human-lab__stats">
        <span>
          Trạng thái: <strong>{connected ? "đã mở socket" : "chưa"}</strong>
        </span>
        <span>
          Số bản tin WS: <strong className="ws-human-lab__blink">{msgCount}</strong> (tăng khi đổi on/off)
        </span>
      </div>

      <pre className="ws-human-lab__pre">{lastJson || "—"}</pre>

      <details className="ws-human-lab__details">
        <summary>Log</summary>
        <pre className="ws-human-lab__pre ws-human-lab__pre--log">{log || "—"}</pre>
      </details>
    </div>
  );
};
