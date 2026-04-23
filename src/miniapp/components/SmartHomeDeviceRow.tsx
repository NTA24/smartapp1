import React from "react";
import { FireOutlined } from "@ant-design/icons";
import { DeviceCard } from "./DeviceCard";
import { LedStripCard } from "./LedStripCard";
import { SmokeSensorCard } from "./SmokeSensorCard";
import { HumanSensorCard } from "./HumanSensorCard";
import { DoorSensorCard } from "./DoorSensorCard";
import { FenceSensorCard } from "./FenceSensorCard";
import { SirenCard } from "./SirenCard";
import {
  deviceCardIconForKind,
  deviceCardKindMeta,
  inferDeviceCardKind,
} from "../lib/deviceCardKind";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import {
  isGatewaySocketTelemetryDevice,
  isDoorSensorTelemetryDevice,
  isFenceSensorTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isLedStripTelemetryDevice,
  isSirenTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  isSmartSwitchTelemetryDevice,
} from "../services/deviceSync";
import {
  postDeviceSharedScopePower,
  postDeviceSharedScopeSwitchChannel,
  sendGatewayPlugHallwayControl,
} from "../services/deviceSync";
import { TB_UUID_RE } from "../utils/tbDeviceUuid";
import { getDeviceUuid } from "../lib/deviceUuid";

export interface SmartHomeDeviceRowProps {
  device: SmartBuildingDeviceRecord;
  index: number;
}

const HIDDEN_DEVICE_NAME_RE = /^\s*smart\s*building\s*$/i;

export function SmartHomeDeviceRow({ device: d, index: i }: SmartHomeDeviceRowProps): React.ReactElement {
  const rawType = String(d.deviceType ?? d.device?.type ?? "Thiết bị");
  const kind = inferDeviceCardKind(d);
  const icon = isSmokeSensorTelemetryDevice(d) ? <FireOutlined /> : deviceCardIconForKind(kind);
  const meta = deviceCardKindMeta(kind, rawType);
  const name =
    String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
    `Thiết bị ${i + 1}`;

  if (HIDDEN_DEVICE_NAME_RE.test(name)) return <></>;

  const resolvedId = getDeviceUuid(d).trim();
  const id = resolvedId || `${i + 1}`;
  const fenceChannel = d.fenceChannel === 2 ? 2 : 1;
  const fenceTitle = fenceChannel === 2 ? "Fence2" : "Fence1";

  const isSwitch = isSmartSwitchTelemetryDevice(d);
  const canControlByHttp = TB_UUID_RE.test(resolvedId);
  const useNewgenSwitchPower = canControlByHttp && isSwitch;
  const useSmokeSensor = !isSwitch && isSmokeSensorTelemetryDevice(d);
  const useHumanSensor = !isSwitch && !useSmokeSensor && isHumanSensorTelemetryDevice(d);
  const useDoorSensor =
    !isSwitch && !useSmokeSensor && !useHumanSensor && isDoorSensorTelemetryDevice(d);
  const useFenceSensor =
    !isSwitch && !useSmokeSensor && !useHumanSensor && !useDoorSensor && isFenceSensorTelemetryDevice(d);
  const useSiren =
    !isSwitch &&
    !useSmokeSensor &&
    !useHumanSensor &&
    !useDoorSensor &&
    !useFenceSensor &&
    isSirenTelemetryDevice(d);
  const useLedStrip =
    !isSwitch &&
    !useSmokeSensor &&
    !useHumanSensor &&
    !useDoorSensor &&
    !useFenceSensor &&
    !useSiren &&
    isLedStripTelemetryDevice(d);
  const useGatewaySocket =
    !isSwitch &&
    !useSmokeSensor &&
    !useHumanSensor &&
    !useDoorSensor &&
    !useFenceSensor &&
    !useSiren &&
    !useLedStrip &&
    isGatewaySocketTelemetryDevice(d);
  const useGenericHttpPower = canControlByHttp && !useNewgenSwitchPower && !useGatewaySocket;

  if (useSmokeSensor) {
    return <SmokeSensorCard deviceId={id} title={name} />;
  }
  if (useHumanSensor) {
    return <HumanSensorCard deviceId={id} title={name} />;
  }
  if (useDoorSensor) {
    return <DoorSensorCard deviceId={id} title={name} />;
  }
  if (useFenceSensor) {
    return <FenceSensorCard deviceId={id} title={fenceTitle} channel={fenceChannel} />;
  }
  if (useSiren) {
    return <SirenCard deviceId={id} title={name} />;
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
        useGatewaySocket && canControlByHttp
          ? async (nextOn) => {
              await sendGatewayPlugHallwayControl(resolvedId, nextOn);
            }
          : useGenericHttpPower
            ? async (nextOn) => {
                await postDeviceSharedScopePower(resolvedId, nextOn);
              }
            : undefined
      }
      initialRemotePowerSource={useGatewaySocket && canControlByHttp ? "gateway-plug" : undefined}
    />
  );
}
