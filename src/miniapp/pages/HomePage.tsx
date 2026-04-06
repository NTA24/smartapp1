import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { LedStripCard } from "../components/LedStripCard";
import { SmokeSensorCard } from "../components/SmokeSensorCard";
import { HumanSensorCard } from "../components/HumanSensorCard";
import { useMiniApp } from "../context/MiniAppContext";
import { useAuthLoading } from "../hooks/useAuthLoading";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import {
  fetchSmartHomeDevicesFromNewgen,
} from "../services/deviceSync";
import { postDeviceSharedScopeSwitchChannel, sendGatewayPlugHallwayControl } from "../services/deviceControlHttp";
import { buildDevicePresentationModel } from "../lib/devicePresentation";

function formatPhone(phone: string): string {
  const raw = String(phone || "").trim();
  if (!raw) return "";

  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  // Bỏ mã quốc gia lặp để tránh dạng (+84) 84xxxx...
  while (digits.startsWith("84")) digits = digits.slice(2);
  // Dữ liệu nội địa thường bắt đầu bằng 0
  if (digits.startsWith("0")) digits = digits.slice(1);
  while (digits.startsWith("84")) digits = digits.slice(2);

  return `(+84) ${digits}`;
}

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userPhone } = useMiniApp();
  const loadingUser = useAuthLoading(userPhone);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  /** Smart Home: chỉ NewGen — không gọi campus `by-username`. */
  const [smartHomeDevices, setSmartHomeDevices] = useState<SmartBuildingDeviceRecord[]>([]);

  const loadSmartHomeDevices = useCallback(async () => {
    const list = await fetchSmartHomeDevicesFromNewgen();
    setSmartHomeDevices(list);
  }, []);

  useEffect(() => {
    void loadSmartHomeDevices();
  }, [loadSmartHomeDevices]);

  const userLabel = userPhone ? formatPhone(userPhone) : "…";

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await loadSmartHomeDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  const deviceRows = useMemo(
    () =>
      smartHomeDevices.map((d: SmartBuildingDeviceRecord, i: number) => {
        const model = buildDevicePresentationModel(d, i);
        const {
          id,
          name,
          kind,
          meta,
          icon,
          useNewgenSwitchPower,
          useSmokeSensor,
          useHumanSensor,
          useLedStrip,
          useGatewaySocket,
        } = model;

        if (useSmokeSensor) {
          return <SmokeSensorCard key={`smoke-${id}`} deviceId={id} title={name} />;
        }
        if (useHumanSensor) {
          return <HumanSensorCard key={`human-${id}`} deviceId={id} title={name} />;
        }
        if (useLedStrip) {
          return <LedStripCard key={`led-${id}`} deviceId={id} title={name} />;
        }

        return (
          <DeviceCard
            key={id}
            deviceId={id}
            name={name}
            meta={meta}
            statusLabel="Tắt"
            icon={icon}
            defaultOn={false}
            deviceKind={kind}
            onRemoteSwitchChannelChange={
              useNewgenSwitchPower
                ? (channel, nextOn) => postDeviceSharedScopeSwitchChannel(id, channel, nextOn)
                : undefined
            }
            onRemotePowerChange={
              useGatewaySocket
                ? (nextOn) => sendGatewayPlugHallwayControl(id, nextOn)
                : undefined
            }
            initialRemotePowerSource={useGatewaySocket ? "gateway-plug" : undefined}
          />
        );
      }),
    [smartHomeDevices],
  );

  return (
    <div className="home-page">
      {loadingUser && (
        <div className="miniapp-loading__overlay">
          <div className="miniapp-loading__spinner" />
          <div className="miniapp-loading__text">Đang tải thông tin...</div>
        </div>
      )}

      <div className="home-page__user-id" id="user-id">{userLabel}</div>
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
        {deviceRows}
      </div>
      <div className="home-page__edit-wrap">
        <Link to="/edit-room" className="home-page__edit-btn">
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
};
