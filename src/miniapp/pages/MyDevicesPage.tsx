import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { LedStripCard } from "../components/LedStripCard";
import { SmokeSensorCard } from "../components/SmokeSensorCard";
import { HumanSensorCard } from "../components/HumanSensorCard";
import { useMiniApp } from "../context/MiniAppContext";
import { sendGatewayPlugHallwayControl } from "../services/deviceControlHttp";
import { postDeviceSharedScopeSwitchChannel } from "../services/deviceControlHttp";
import { buildDevicePresentationModel } from "../lib/devicePresentation";

export const MyDevicesPage: React.FC = () => {
  const { devices, refreshDevices, userPhone } = useMiniApp();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const username = useMemo(() => String(userPhone || "").trim(), [userPhone]);

  const handleRefresh = async () => {
    setErrorText("");
    setLoading(true);
    try {
      await refreshDevices();
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const deviceRows = useMemo(
    () =>
      devices.map((d, i) => {
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
          return <SmokeSensorCard key={`${id}-${i}`} deviceId={id} title={name} />;
        }
        if (useHumanSensor) {
          return <HumanSensorCard key={`human-${id}-${i}`} deviceId={id} title={name} />;
        }
        if (useLedStrip) {
          return <LedStripCard key={`led-${id}-${i}`} deviceId={id} title={name} />;
        }
        return (
          <DeviceCard
            key={`${id}-${i}`}
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
    [devices],
  );

  return (
    <div className="page-profile-sub">
      <div className="sub-page-header">
        <Link to="/" className="back btn-back">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="sub-page-title">Thiết bị của tôi</h1>
      </div>

      <div className="profile-sub-body">
        <button
          type="button"
          className="my-devices-bar"
          onClick={handleRefresh}
          style={{ border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
        >
          <span className="bar-text">
            {loading ? "Đang đồng bộ danh sách..." : "Đồng bộ từ SmartBuilding"}
          </span>
          <span className="bar-arrow">
            <RightOutlined />
          </span>
        </button>

        <div style={{ marginBottom: 12, color: "#637083", fontSize: 12 }}>
          Username: <strong>{username || "Chưa có"}</strong>
        </div>

        {errorText && (
          <div style={{ marginBottom: 12, color: "#d93025", fontWeight: 600 }}>
            {errorText}
          </div>
        )}

        <div className="my-devices-list">
          {devices.length === 0 ? (
            <div style={{ color: "#637083", padding: "12px 2px" }}>
              Chưa có thiết bị nào. Bạn vào màn Thêm thiết bị để tạo mới.
            </div>
          ) : (
            deviceRows
          )}
        </div>
      </div>
    </div>
  );
};
