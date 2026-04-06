import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getNewgenWsJwt, getNewgenWsTelemetryUrl } from "../lib/config";
import { latestScalar, mergeWsDataLayers } from "../lib/wsLabShared";

type ScopeMode = "client" | "newgen";

export const WsHumanSensorLabPage: React.FC = () => {
  const [token, setToken] = useState(() => getNewgenWsJwt());
  const [deviceId, setDeviceId] = useState("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("newgen");
  const [connected, setConnected] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [lastHuman, setLastHuman] = useState<string>("—");
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
      appendLog("🟢 onopen — gửi authCmd + cmds (đăng ký human_sensor + humanDetected)");

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
            keys: "human_sensor,humanDetected",
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
        const h1 = latestScalar(flat.human_sensor);
        const h2 = latestScalar(flat.humanDetected);
        const pick = h1 !== undefined ? String(h1) : h2 !== undefined ? String(h2) : "—";
        setLastHuman(pick);
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

  return (
    <div className="ws-human-lab">
      <div className="ws-human-lab__header">
        <Link to="/profile" className="ws-human-lab__back">
          ‹ Hồ sơ
        </Link>
        <h1 className="ws-human-lab__title">Lab WS · human_sensor</h1>
        <p className="ws-human-lab__hint">
          Giống file HTML: một gói <code>authCmd</code> + <code>cmds</code> đăng ký — server mới bơm dữ liệu qua{" "}
          <code>onmessage</code>.
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
        Device ID (UUID)
        <input
          className="ws-human-lab__input"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="f4e89f00-21e1-11f1-b9a6-41c05f43cae8"
          spellCheck={false}
        />
      </label>

      <fieldset className="ws-human-lab__fieldset">
        <legend>Scope trong cmds</legend>
        <label className="ws-human-lab__radio">
          <input
            type="radio"
            name="scope"
            checked={scopeMode === "newgen"}
            onChange={() => setScopeMode("newgen")}
          />
          <span>
            <code>null</code> (giống app — ATTRIBUTES NewGen)
          </span>
        </label>
        <label className="ws-human-lab__radio">
          <input
            type="radio"
            name="scope"
            checked={scopeMode === "client"}
            onChange={() => setScopeMode("client")}
          />
          <span>
            <code>CLIENT_SCOPE</code> (giống snippet React)
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

      <div className="ws-human-lab__stats">
        <span>
          Trạng thái: <strong>{connected ? "đã mở socket" : "chưa"}</strong>
        </span>
        <span>
          Số bản tin WS: <strong className="ws-human-lab__blink">{msgCount}</strong> (tăng = có stream)
        </span>
        <span>
          human mới nhất: <strong>{lastHuman}</strong>
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
