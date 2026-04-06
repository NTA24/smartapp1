import type { ReactNode } from "react";
import {
  deviceCardIconForKind,
  deviceCardKindMeta,
  inferDeviceCardKind,
} from "./deviceCardKind";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import {
  isGatewaySocketTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isLedStripTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  isSmartSwitchTelemetryDevice,
} from "../services/deviceSync";

const TB_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DevicePresentationModel {
  id: string;
  name: string;
  kind: ReturnType<typeof inferDeviceCardKind>;
  meta: string;
  icon: ReactNode;
  useNewgenSwitchPower: boolean;
  useSmokeSensor: boolean;
  useHumanSensor: boolean;
  useLedStrip: boolean;
  useGatewaySocket: boolean;
}

export function buildDevicePresentationModel(
  device: SmartBuildingDeviceRecord,
  index: number,
): DevicePresentationModel {
  const rawType = String(device.deviceType ?? device.device?.type ?? "Thiết bị");
  const kind = inferDeviceCardKind(device);
  const icon = deviceCardIconForKind(kind);
  const meta = deviceCardKindMeta(kind, rawType);
  const name =
    String(device.label ?? device.device?.label ?? device.name ?? device.device?.name ?? "").trim() ||
    `Thiết bị ${index + 1}`;
  const id =
    String(device.deviceId ?? device.device?.id?.id ?? `${index + 1}`).trim() ||
    `${index + 1}`;

  const tbUuid = TB_UUID_PATTERN.test(id);
  const isSwitch = isSmartSwitchTelemetryDevice(device);
  const useNewgenSwitchPower = tbUuid && isSwitch;
  const useSmokeSensor = tbUuid && !isSwitch && isSmokeSensorTelemetryDevice(device);
  const useHumanSensor = tbUuid && !isSwitch && !useSmokeSensor && isHumanSensorTelemetryDevice(device);
  const useLedStrip =
    tbUuid && !isSwitch && !useSmokeSensor && !useHumanSensor && isLedStripTelemetryDevice(device);
  const useGatewaySocket =
    tbUuid &&
    !isSwitch &&
    !useSmokeSensor &&
    !useHumanSensor &&
    !useLedStrip &&
    isGatewaySocketTelemetryDevice(device);

  return {
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
  };
}
