import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Slider } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useSirenStatesWs } from "../lib/tbWebSocket";
import {
  SIREN_DURATION_KEY,
  SIREN_STATE_KEY,
  SIREN_TUNE_KEY,
  SIREN_VOLUME_KEY,
} from "../lib/tbWebSocket/tbWsModel";
import { postDeviceSirenAttributes } from "../services/deviceSync";

const TUNE_MAX = 18;
const VOLUME_MAX = 2;
const DURATION_MAX = 10;

export interface SirenCardProps {
  deviceId: string;
  title: string;
}

/** Chỉ mount khi panel mở — nút ON/OFF (giống ngoài) + 3 slider + pin. */
function SirenPanelBody(props: {
  busy: boolean;
  on: boolean | undefined;
  onTogglePower: () => void;
  tune: number | undefined;
  volume: number | undefined;
  durationSec: number | undefined;
  levelRaw: number | undefined;
  tuneLocal: number | null;
  volLocal: number | null;
  durLocal: number | null;
  setTuneLocal: (v: number | null) => void;
  setVolLocal: (v: number | null) => void;
  setDurLocal: (v: number | null) => void;
  post: (body: Record<string, string | number>) => Promise<void>;
}): React.ReactElement {
  const {
    busy,
    on,
    onTogglePower,
    tune,
    volume,
    durationSec,
    levelRaw,
    tuneLocal,
    volLocal,
    durLocal,
    setTuneLocal,
    setVolLocal,
    setDurLocal,
    post,
  } = props;

  const batteryPct =
    levelRaw !== undefined ? Math.max(0, Math.min(100, Math.round(levelRaw))) : undefined;

  return (
    <>
      <div className="siren-card__modal-block siren-card__modal-block--power">
        <div className="siren-card__label">Bật / tắt còi</div>
        <div className="siren-card__modal-power-row siren-card__modal-power-row--center">
          <button
            type="button"
            className={`siren-card__main-btn siren-card__main-btn--modal ${on === true ? "siren-card__main-btn--on" : ""}`}
            disabled={busy}
            onClick={() => onTogglePower()}
          >
            {on === true ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      <div className="siren-card__modal-block">
        <div className="siren-card__label">Tune (0–{TUNE_MAX})</div>
        <div className="siren-card__value">{tuneLocal ?? tune ?? "—"}</div>
        <Slider
          min={0}
          max={TUNE_MAX}
          step={1}
          value={Math.min(TUNE_MAX, tuneLocal ?? tune ?? 0)}
          disabled={busy}
          onChange={(v) => setTuneLocal(v)}
          onChangeComplete={(v) => {
            void post({ [SIREN_TUNE_KEY]: v });
          }}
        />
      </div>
      <div className="siren-card__modal-block">
        <div className="siren-card__label">Volume (0–{VOLUME_MAX})</div>
        <div className="siren-card__value">{volLocal ?? volume ?? "—"}</div>
        <Slider
          min={0}
          max={VOLUME_MAX}
          step={1}
          value={Math.min(VOLUME_MAX, volLocal ?? volume ?? 0)}
          disabled={busy}
          onChange={(v) => setVolLocal(v)}
          onChangeComplete={(v) => {
            void post({ [SIREN_VOLUME_KEY]: v });
          }}
        />
      </div>
      <div className="siren-card__modal-block">
        <div className="siren-card__label">Duration (0–{DURATION_MAX}s)</div>
        <div className="siren-card__value">{durLocal ?? durationSec ?? "—"}s</div>
        <Slider
          min={0}
          max={DURATION_MAX}
          step={1}
          value={Math.min(DURATION_MAX, durLocal ?? durationSec ?? 0)}
          disabled={busy}
          onChange={(v) => setDurLocal(v)}
          onChangeComplete={(v) => {
            void post({ [SIREN_DURATION_KEY]: v });
          }}
        />
      </div>
      <div className="siren-card__battery siren-card__battery--modal">
        <span className="siren-card__label">Battery</span>
        <span className="siren-card__battery-val">
          {batteryPct !== undefined ? `${batteryPct}%` : "—"}
        </span>
        <div className="siren-card__battery-bar">
          <div className="siren-card__battery-fill" style={{ width: `${batteryPct ?? 0}%` }} />
        </div>
      </div>
    </>
  );
}

export const SirenCard: React.FC<SirenCardProps> = ({ deviceId, title }) => {
  const { on, tune, volume, durationSec, levelRaw, wsRev } = useSirenStatesWs(deviceId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [tuneLocal, setTuneLocal] = useState<number | null>(null);
  const [volLocal, setVolLocal] = useState<number | null>(null);
  const [durLocal, setDurLocal] = useState<number | null>(null);

  useEffect(() => {
    if (!detailOpen) {
      setTuneLocal(null);
      setVolLocal(null);
      setDurLocal(null);
    }
  }, [detailOpen]);

  // Giữ optimistic value sau khi kéo slider; chỉ clear khi WS đã bắt kịp.
  useEffect(() => {
    if (tuneLocal !== null && tune !== undefined && tuneLocal === tune) setTuneLocal(null);
    if (volLocal !== null && volume !== undefined && volLocal === volume) setVolLocal(null);
    if (durLocal !== null && durationSec !== undefined && durLocal === durationSec) setDurLocal(null);
  }, [tuneLocal, volLocal, durLocal, tune, volume, durationSec, wsRev]);

  useEffect(() => {
    if (!detailOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [detailOpen]);

  const post = useCallback(
    async (body: Record<string, string | number>) => {
      setErr("");
      setBusy(true);
      try {
        await postDeviceSirenAttributes(deviceId, body);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [deviceId],
  );

  const openDetail = useCallback(() => {
    setDetailOpen(true);
  }, []);

  const togglePower = useCallback(() => {
    const next = on === true ? "off" : "on";
    void post({ [SIREN_STATE_KEY]: next });
  }, [on, post]);

  const toggleMain = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePower();
  };

  const modalTitle = title.trim() ? `Cài đặt còi — ${title.trim()}` : "Cài đặt còi";

  const closePanel = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setDetailOpen(false);
  }, []);

  const overlay =
    detailOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="siren-overlay-root"
        role="presentation"
        onClick={() => setDetailOpen(false)}
      >
        <div
          className="siren-overlay-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="siren-panel-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="siren-overlay-header">
            <h2 id="siren-panel-title" className="siren-overlay-title">
              {modalTitle}
            </h2>
            <button type="button" className="siren-overlay-close" aria-label="Đóng" onClick={closePanel}>
              ×
            </button>
          </div>
          <div className="siren-overlay-body">
            <SirenPanelBody
              busy={busy}
              on={on}
              onTogglePower={togglePower}
              tune={tune}
              volume={volume}
              durationSec={durationSec}
              levelRaw={levelRaw}
              tuneLocal={tuneLocal}
              volLocal={volLocal}
              durLocal={durLocal}
              setTuneLocal={setTuneLocal}
              setVolLocal={setVolLocal}
              setDurLocal={setDurLocal}
              post={post}
            />
          </div>
          <div className="siren-overlay-footer">
            <button type="button" className="siren-overlay-done" onClick={closePanel}>
              Đóng
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <div
      className="device-card siren-card"
      data-device-id={deviceId}
      data-ws-rev={wsRev}
      onClick={openDetail}
    >
      <div className="siren-card__title">{title}</div>
      {err ? (
        <div className="siren-card__err" style={{ color: "#d93025", fontSize: 12, marginBottom: 8 }}>
          {err}
        </div>
      ) : null}

      <div className="siren-card__controls" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`siren-card__main-btn ${on === true ? "siren-card__main-btn--on" : ""}`}
          disabled={busy}
          onClick={toggleMain}
        >
          {on === true ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className="siren-card__settings-btn"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            openDetail();
          }}
          aria-label="Cài đặt còi"
        >
          <SettingOutlined />
        </button>
      </div>

      {overlay}
    </div>
  );
};
