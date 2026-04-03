import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { LedStripCard } from "../components/LedStripCard";
import { SmokeSensorCard } from "../components/SmokeSensorCard";
import { HumanSensorCard } from "../components/HumanSensorCard";
import {
  deviceCardIconForKind,
  deviceCardKindMeta,
  inferDeviceCardKind,
} from "../lib/deviceCardKind";
import { useMiniApp } from "../context/MiniAppContext";
import {
  isGatewaySocketTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isLedStripTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  isSmartSwitchTelemetryDevice,
} from "../services/deviceSync";
import { sendGatewayPlugHallwayControl } from "../services/deviceControlHttp";
import { postDeviceSharedScopeSwitchChannel } from "../services/deviceControlHttp";

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
            devices.map((d, i) => {
              const rawType = String(d.deviceType ?? d.device?.type ?? "Thiết bị");
              const kind = inferDeviceCardKind(d);
              const icon = deviceCardIconForKind(kind);
              const meta = deviceCardKindMeta(kind, rawType);
              const name =
                String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
                `Thiết bị ${i + 1}`;
              const id = String(d.deviceId ?? d.device?.id?.id ?? `${i + 1}`);
              const tbUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
              const isSw = isSmartSwitchTelemetryDevice(d);
              const useNewgenSwitchPower = tbUuid && isSw;
              const useSmokeSensor = tbUuid && !isSw && isSmokeSensorTelemetryDevice(d);
              const useHumanSensor = tbUuid && !isSw && !useSmokeSensor && isHumanSensorTelemetryDevice(d);
              const useLedStrip =
                tbUuid && !isSw && !useSmokeSensor && !useHumanSensor && isLedStripTelemetryDevice(d);
              const useGatewaySocket =
                tbUuid &&
                !isSw &&
                !useSmokeSensor &&
                !useHumanSensor &&
                !useLedStrip &&
                isGatewaySocketTelemetryDevice(d);
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
                      ? async (nextOn) => {
                          await sendGatewayPlugHallwayControl(id, nextOn);
                        }
                      : undefined
                  }
                  initialRemotePowerSource={useGatewaySocket ? "gateway-plug" : undefined}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

