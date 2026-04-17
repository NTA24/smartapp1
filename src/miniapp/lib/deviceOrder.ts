import { inferDeviceCardKind } from "./deviceCardKind";
import {
  isDoorSensorTelemetryDevice,
  isFenceSensorTelemetryDevice,
  isHumanSensorTelemetryDevice,
  isSmokeSensorTelemetryDevice,
  type SmartBuildingDeviceRecord,
} from "../services/deviceSync";

const KIND_PRIORITY: Record<string, number> = {
  sensor: 0,
  switch: 1,
  light: 2,
  gateway: 3,
  other: 4,
};

function deviceDisplayName(d: SmartBuildingDeviceRecord): string {
  return String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim().toLowerCase();
}

function deviceStableId(d: SmartBuildingDeviceRecord): string {
  return String(d.deviceId ?? d.device?.id?.id ?? "").trim().toLowerCase();
}

function sensorPriority(d: SmartBuildingDeviceRecord): number {
  if (isDoorSensorTelemetryDevice(d)) return 0;
  if (isFenceSensorTelemetryDevice(d)) return 1;
  if (isHumanSensorTelemetryDevice(d)) return 2;
  if (isSmokeSensorTelemetryDevice(d)) return 3;
  return 4;
}

export function sortDevicesForUi(devices: SmartBuildingDeviceRecord[]): SmartBuildingDeviceRecord[] {
  return [...devices].sort((a, b) => {
    const ka = inferDeviceCardKind(a);
    const kb = inferDeviceCardKind(b);
    const pa = KIND_PRIORITY[ka] ?? 99;
    const pb = KIND_PRIORITY[kb] ?? 99;
    if (pa !== pb) return pa - pb;
    if (ka === "sensor" && kb === "sensor") {
      const sa = sensorPriority(a);
      const sb = sensorPriority(b);
      if (sa !== sb) return sa - sb;
    }

    const na = deviceDisplayName(a);
    const nb = deviceDisplayName(b);
    if (na !== nb) return na.localeCompare(nb, "vi");

    const ia = deviceStableId(a);
    const ib = deviceStableId(b);
    return ia.localeCompare(ib);
  });
}
