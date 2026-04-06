import React, { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { LedStripCard } from "../components/LedStripCard";
import { SmokeSensorCard } from "../components/SmokeSensorCard";
import { HumanSensorCard } from "../components/HumanSensorCard";
import { useMiniApp } from "../context/MiniAppContext";
import { useAuthLoading } from "../hooks/useAuthLoading";
import {
  deviceCardIconForKind,
  deviceCardKindMeta,
  inferDeviceCardKind,
} from "../lib/deviceCardKind";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import {
  fetchSmartHomeDevicesFromNewgen,
  isGatewaySocketTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isLedStripTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  isSmartSwitchTelemetryDevice,
} from "../services/deviceSync";
import { sendGatewayPlugHallwayControl } from "../services/deviceControlHttp";
import { postDeviceSharedScopeSwitchChannel } from "../services/deviceControlHttp";

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

  const formatPhone = (phone: string) => {
    const raw = String(phone || "").trim();
    if (!raw) return "";

    let digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";

    while (digits.startsWith("84")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    while (digits.startsWith("84")) digits = digits.slice(2);

    return `(+84) ${digits}`;
  };

  const userLabel = userPhone ? formatPhone(userPhone) : "…";

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await loadSmartHomeDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  const renderDeviceRow = (d: SmartBuildingDeviceRecord, i: number) => {
    const rawType = String(d.deviceType ?? d.device?.type ?? "Thiết bị");
    const kind = inferDeviceCardKind(d);
    const icon = deviceCardIconForKind(kind);
    const meta = deviceCardKindMeta(kind, rawType);
    const name =
      String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
      `Thiết bị ${i + 1}`;
    const id =
      String(d.deviceId ?? d.device?.id?.id ?? `${i + 1}`).trim() ||
      `${i + 1}`;

    const isSwitch = isSmartSwitchTelemetryDevice(d);
    const tbUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const useNewgenSwitchPower = tbUuid && isSwitch;
    const useSmokeSensor = tbUuid && !isSwitch && isSmokeSensorTelemetryDevice(d);
    const useHumanSensor = tbUuid && !isSwitch && !useSmokeSensor && isHumanSensorTelemetryDevice(d);
    const useLedStrip =
      tbUuid && !isSwitch && !useSmokeSensor && !useHumanSensor && isLedStripTelemetryDevice(d);
    const useGatewaySocket =
      tbUuid &&
      !isSwitch &&
      !useSmokeSensor &&
      !useHumanSensor &&
      !useLedStrip &&
      isGatewaySocketTelemetryDevice(d);

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
            ? async (nextOn) => {
                await sendGatewayPlugHallwayControl(id, nextOn);
              }
            : undefined
        }
        initialRemotePowerSource={useGatewaySocket ? "gateway-plug" : undefined}
      />
    );
  };

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
        {smartHomeDevices.map((d, i) => renderDeviceRow(d, i))}
      </div>
      <div className="home-page__edit-wrap">
        <Link to="/edit-room" className="home-page__edit-btn">
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
};
