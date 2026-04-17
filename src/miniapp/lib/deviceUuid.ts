import type { SmartBuildingDeviceRecord } from "../services/deviceSync";

export function getDeviceUuid(device: SmartBuildingDeviceRecord): string {
  const rec = device as Record<string, unknown>;
  const direct = String(rec.deviceId ?? "").trim();
  if (direct) return direct;
  const uuid = String(rec.uuid ?? "").trim();
  if (uuid) return uuid;
  const wsDeviceId = String(rec.wsDeviceId ?? "").trim();
  if (wsDeviceId) return wsDeviceId;
  return String(device.device?.id?.id ?? "").trim();
}
