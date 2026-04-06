import React from "react";
import { FireOutlined } from "@ant-design/icons";
import { DeviceCard } from "./DeviceCard";
import { LedStripCard } from "./LedStripCard";
import { SmokeSensorCard } from "./SmokeSensorCard";
import { HumanSensorCard } from "./HumanSensorCard";
import {
  deviceCardIconForKind,
  deviceCardKindMeta,
  inferDeviceCardKind,
} from "../lib/deviceCardKind";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import {
  isGatewaySocketTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isLedStripTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  isSmartSwitchTelemetryDevice,
} from "../services/deviceSync";
import { postDeviceSharedScopeSwitchChannel, sendGatewayPlugHallwayControl } from "../services/deviceSync";
import { TB_UUID_RE } from "../utils/tbDeviceUuid";

export interface SmartHomeDeviceRowProps {
  device: SmartBuildingDeviceRecord;
  index: number;
}

export function SmartHomeDeviceRow({ device: d, index: i }: SmartHomeDeviceRowProps): React.ReactElement {
  const rawType = String(d.deviceType ?? d.device?.type ?? "Thiết bị");
  const kind = inferDeviceCardKind(d);
  const icon = isSmokeSensorTelemetryDevice(d) ? <FireOutlined /> : deviceCardIconForKind(kind);
  const meta = deviceCardKindMeta(kind, rawType);
  const name =
    String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
    `Thiết bị ${i + 1}`;
  const id =
    String(d.deviceId ?? d.device?.id?.id ?? `${i + 1}`).trim() ||
    `${i + 1}`;

  const isSwitch = isSmartSwitchTelemetryDevice(d);
  const tbUuid = TB_UUID_RE.test(id);
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
    return <SmokeSensorCard deviceId={id} title={name} />;
  }
  if (useHumanSensor) {
    return <HumanSensorCard deviceId={id} title={name} />;
  }
  if (useLedStrip) {
    return <LedStripCard deviceId={id} title={name} />;
  }

  return (
    <DeviceCard
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
}
