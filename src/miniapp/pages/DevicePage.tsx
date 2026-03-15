import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDevicePower } from "../hooks/useDevicePower";
import { Store } from "../lib/store";
import { IconifyIcon } from "../components/IconifyIcon";

const POWER_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12L12 4A8 8 0 1 1 11.98 4" />
  </svg>
);

export const DevicePage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const id: string = deviceId ?? Store.get("currentDeviceId", "1") ?? "1";
  const isLight = id === "2";
  const { on, toggle } = useDevicePower(id, id === "1");

  useEffect(() => {
    Store.set("currentDeviceId", id);
  }, [id]);

  const title = isLight ? "Đèn thông minh" : "Máy lọc không khí thông minh";

  return (
    <div className={`page-device ${isLight ? "page-device--light" : ""}`}>
      <div className="nav-bar">
        <Link to="/" className="back btn-back">
          <span className="btn-back-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </span>
        </Link>
        <span className="title">{title}</span>
        <span className="menu-dots">
          <IconifyIcon icon="ant-design:ellipsis-outlined" />
        </span>
      </div>
      {isLight ? (
        <>
          <div className="device-light-body">
            <div className="device-icon-wrap device-light-icon">
              <IconifyIcon icon="ant-design:bulb-outlined" />
            </div>
            <div className="power-control" id="device-power" onClick={toggle}>
              <div className={`power-icon ${on ? "on" : ""}`}>
                <span className="power-symbol">{POWER_SVG}</span>
              </div>
              <span className="power-label">{on ? "Tắt" : "Bật"}</span>
            </div>
          </div>
          <div className="device-actions-section">
            <Link to={`/device/${id}/timer`} className="feature-card">
              <div className="feature-icon"><IconifyIcon icon="ant-design:clock-circle-outlined" /></div>
              <div className="feature-content">
                <div className="feature-title">Hẹn giờ</div>
                <div className="feature-desc">Bật/tắt thiết bị theo lịch</div>
              </div>
              <span className="feature-arrow">›</span>
            </Link>
            <Link to={`/device/${id}/automation`} className="feature-card">
              <div className="feature-icon"><IconifyIcon icon="ant-design:thunderbolt-outlined" /></div>
              <div className="feature-content">
                <div className="feature-title">Tự động hóa</div>
                <div className="feature-desc">Thiết lập kịch bản tự động</div>
              </div>
              <span className="feature-arrow">›</span>
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="air-quality-section">
            <div className="air-quality-glow-wrap">
              <div className="air-quality-glow" />
              <div className="air-quality-text">
                <div className="air-quality-label">Chất lượng không khí trong nhà kết hợp</div>
                <div className="air-quality-value" id="aq-value">Trung bình</div>
                <div className="air-quality-env">Nhiệt độ: 23°C | Độ ẩm: 62%</div>
              </div>
            </div>
          </div>
          <div className="power-control" id="device-power" onClick={toggle}>
            <div className={`power-icon ${on ? "on" : ""}`}>
              <span className="power-symbol">{POWER_SVG}</span>
            </div>
            <span className="power-label">{on ? "Tắt" : "Bật"}</span>
          </div>
          <div className="device-actions-section">
            <Link to={`/device/${id}/timer`} className="feature-card">
              <div className="feature-icon"><IconifyIcon icon="ant-design:clock-circle-outlined" /></div>
              <div className="feature-content">
                <div className="feature-title">Hẹn giờ</div>
                <div className="feature-desc">Bật/tắt thiết bị theo lịch</div>
              </div>
              <span className="feature-arrow">›</span>
            </Link>
            <Link to={`/device/${id}/automation`} className="feature-card">
              <div className="feature-icon"><IconifyIcon icon="ant-design:thunderbolt-outlined" /></div>
              <div className="feature-content">
                <div className="feature-title">Tự động hóa</div>
                <div className="feature-desc">Thiết lập kịch bản tự động</div>
              </div>
              <span className="feature-arrow">›</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
