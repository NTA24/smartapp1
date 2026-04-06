import React, { useCallback, useEffect, useState } from "react";
import { Typography } from "antd";
import { Link, NavLink } from "react-router-dom";
import { MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { SmartHomeDeviceRow } from "../components/SmartHomeDeviceRow";
import { useMiniApp } from "../context/MiniAppContext";
import { useAuthLoading } from "../hooks/useAuthLoading";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import { fetchSmartHomeDevicesFromNewgen } from "../services/deviceSync";
import { formatPhone } from "../utils/phone";

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userPhone } = useMiniApp();
  const loadingUser = useAuthLoading(userPhone);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  
  const [smartHomeDevices, setSmartHomeDevices] = useState<SmartBuildingDeviceRecord[]>([]);

  const loadSmartHomeDevices = useCallback(async () => {
    const list = await fetchSmartHomeDevicesFromNewgen();
    setSmartHomeDevices(list);
  }, []);

  useEffect(() => {
    void loadSmartHomeDevices();
  }, [loadSmartHomeDevices]);

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await loadSmartHomeDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  return (
    <div className="home-page">
      {loadingUser && (
        <div className="miniapp-loading__overlay">
          <div className="miniapp-loading__spinner" />
          <div className="miniapp-loading__text">Đang tải thông tin...</div>
        </div>
      )}

      <div className="home-page__user-block" id="user-id">
        <Typography.Title level={4} className="home-page__user-greeting" style={{ margin: 0 }}>
          Nhà của tôi
        </Typography.Title>
        {userPhone ? (
          <Typography.Text type="secondary" className="home-page__user-phone">
            {formatPhone(userPhone)}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" italic className="home-page__user-phone">
            Đang đăng nhập…
          </Typography.Text>
        )}
      </div>
      <div className="home-page__tabs">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
          Smart Home
        </NavLink>
        <NavLink to="/shared" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Đã chia sẻ
        </NavLink>
        <button
          type="button"
          className="home-page__icon-menu"
          id="btn-menu"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
        >
          <MenuOutlined />
        </button>
      </div>
      <div
        className={`home-page__menu-dropdown ${menuOpen ? "open" : ""}`}
        id="home-menu"
        aria-hidden={!menuOpen}
      >
        <Link to="/" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          Smart Home
        </Link>
        <Link to="/shared" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          Đã chia sẻ
        </Link>
        <Link to="/nav-settings" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          <span>Cài đặt điều hướng</span>
          <span className="home-page__menu-icon">
            <SettingOutlined />
          </span>
        </Link>
        <Link to="/my-devices" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          <span>Thiết bị của tôi</span>
          <span className="home-page__menu-icon">
            <SearchOutlined />
          </span>
        </Link>
      </div>
      <div
        className={`home-page__menu-overlay ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <div className="home-page__quick-actions">
        <Link to="/add-device" className="home-page__primary-btn">
          Thêm thiết bị
        </Link>
        <button
          type="button"
          onClick={handleRefreshDevices}
          disabled={refreshingDevices}
          className="home-page__secondary-btn"
        >
          {refreshingDevices ? "Đang làm mới..." : "Làm mới thiết bị"}
        </button>
      </div>

      <div className="home-page__device-cards">
        {smartHomeDevices.map((d, i) => (
          <SmartHomeDeviceRow
            key={`${String(d.deviceId ?? d.device?.id?.id ?? `row-${i}`)}-${i}`}
            device={d}
            index={i}
          />
        ))}
      </div>
      <div className="home-page__edit-wrap">
        <Link to="/edit-room" className="home-page__edit-btn">
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
};
