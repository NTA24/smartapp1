import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Slider } from "antd";
import { BulbOutlined, DownOutlined } from "@ant-design/icons";
import { useLedStripStatesWs } from "../lib/tbWebSocket";
import { postDeviceSharedScopeLedColorTemp, postDeviceSharedScopeLedLight } from "../services/deviceSync";
import { fetchDeviceLedStripStates } from "../services/deviceSync";

export interface LedStripCardProps {
  deviceId: string;
  title: string;
}

const SLIDER_DEBOUNCE_MS = 400;

export const LedStripCard: React.FC<LedStripCardProps> = ({ deviceId, title }) => {
  const { lightOn, colorTemp, wsRev } = useLedStripStatesWs(deviceId);
  const [lightBusy, setLightBusy] = useState(false);
  const [sliderBusy, setSliderBusy] = useState(false);
  const [localTemp, setLocalTemp] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [httpLed, setHttpLed] = useState<{ on?: boolean; temp?: number }>({});
  const ledUserTouchedRef = useRef(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    ledUserTouchedRef.current = false;
    setHttpLed({});
    let cancelled = false;
    void fetchDeviceLedStripStates(deviceId).then((r) => {
      if (cancelled || !r || ledUserTouchedRef.current) return;
      setHttpLed({ on: r.lightOn, temp: r.colorTemp });
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  useEffect(() => {
    setLocalTemp(null);
  }, [wsRev, colorTemp]);

  const displayTemp =
    localTemp !== null ? localTemp : (colorTemp ?? httpLed.temp ?? 50);
  const displayOn = lightOn ?? httpLed.on ?? false;

  const onToggleLight = async () => {
    if (lightBusy) return;
    setLightBusy(true);
    try {
      await postDeviceSharedScopeLedLight(deviceId, !displayOn);
      ledUserTouchedRef.current = true;
    } finally {
      setLightBusy(false);
    }
  };

  const sendColorTemp = useCallback(
    async (v: number) => {
      setSliderBusy(true);
      try {
        await postDeviceSharedScopeLedColorTemp(deviceId, v);
        ledUserTouchedRef.current = true;
      } finally {
        setSliderBusy(false);
      }
    },
    [deviceId],
  );

  const scheduleColorTemp = useCallback(
    (v: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void sendColorTemp(v);
      }, SLIDER_DEBOUNCE_MS);
    },
    [sendColorTemp],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <div className="device-card device-card--led-strip device-card--kind-light">
      <div className="card-header">
        <div className="device-icon-wrap" aria-hidden>
          <BulbOutlined />
        </div>
        <div className="led-strip-card__header-text">
          <div className="device-name">{title}</div>
          <div className="device-meta">
            <span>LED strip</span>
            <span>{sliderBusy ? "Đang gửi…" : displayOn ? "Bật" : "Tắt"}</span>
          </div>
        </div>
      </div>

      <div className="led-strip-card__slider-block">
        <div className="led-strip-card__slider-label">
          <span>Nhiệt độ màu</span>
          <strong className="led-strip-card__slider-value">{displayTemp}</strong>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={displayTemp}
          disabled={sliderBusy}
          tooltip={{ formatter: (v) => (v != null ? String(v) : "") }}
          className="led-strip-card__antd-slider"
          aria-label="Nhiệt độ màu 0–100"
          onChange={(v) => {
            setLocalTemp(v);
            scheduleColorTemp(v);
          }}
        />
        <div className="led-strip-card__range-ticks" aria-hidden>
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      <div className="led-strip-card__switch-row">
        <span className="led-strip-card__switch-label">Bật / tắt</span>
        <button
          type="button"
          role="switch"
          aria-checked={displayOn}
          aria-busy={lightBusy}
          disabled={lightBusy}
          className={`led-strip-card__switch ${displayOn ? "led-strip-card__switch--on" : ""}`.trim()}
          onClick={() => void onToggleLight()}
        >
          <span className="led-strip-card__switch-knob" />
        </button>
      </div>

      <button
        type="button"
        className="led-strip-card__more-toggle"
        aria-expanded={moreOpen}
        onClick={() => setMoreOpen((v) => !v)}
      >
        <span>Tùy chọn thêm</span>
        <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <DownOutlined />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {moreOpen && (
          <motion.div
            className="led-strip-card__more-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="led-strip-card__more-text">
              Gợi ý: nhóm cảnh, hẹn giờ sáng, đồng bộ với cảm biến — sẽ kết nối khi bạn mở rộng tính năng.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
