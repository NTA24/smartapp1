import React from "react";
import { useDevicePower } from "../hooks/useDevicePower";

const POWER_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12L12 4A8 8 0 1 1 11.98 4" />
  </svg>
);

interface DeviceCardProps {
  deviceId: string;
  name: string;
  meta: string;
  statusLabel: string;
  icon: React.ReactNode;
  defaultOn?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  deviceId,
  name,
  meta,
  statusLabel: _statusLabel,
  icon,
  defaultOn = false,
}) => {
  const { on, toggle } = useDevicePower(deviceId, defaultOn);

  return (
    <div
      className="device-card"
      data-device-id={deviceId}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest(".power-btn")) {
          window.location.hash = `#/device/${deviceId}`;
        }
      }}
    >
      <div className="card-header">
        <div className="device-icon-wrap">
          {icon}
        </div>
        <button
          type="button"
          className={`power-btn ${on ? "on" : ""}`}
          aria-label={on ? "Tắt" : "Bật"}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <span className="power-symbol">{POWER_SVG}</span>
        </button>
      </div>
      <div className="device-name">{name}</div>
      <div className="device-meta">
        <span>{meta}</span>
        <span>{on ? "Bật" : "Tắt"}</span>
      </div>
    </div>
  );
};
