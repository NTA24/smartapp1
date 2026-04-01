import type { SmartBuildingDeviceRecord } from "../services/deviceSync";

export function labelForCameraUid(uid: string, devices: SmartBuildingDeviceRecord[]): string {
  const d = devices.find((x) => String(x.deviceId ?? x.device?.id?.id ?? "").trim() === uid);
  return String(d?.name ?? d?.label ?? "").trim() || uid;
}

export function labelForHomeDevice(d: SmartBuildingDeviceRecord): string {
  return (
    String(d.label ?? d.name ?? d.device?.label ?? d.device?.name ?? "").trim() ||
    String(d.deviceId ?? d.device?.id?.id ?? "").trim() ||
    "Camera"
  );
}

/** Coi là camera nếu UID nằm trong danh sách từ user-info hoặc type/tên gợi ý camera. */
export function isHomeCameraDevice(d: SmartBuildingDeviceRecord, cameraUidSet: Set<string>): boolean {
  const id = String(d.deviceId ?? d.device?.id?.id ?? "").trim();
  if (id && cameraUidSet.has(id)) return true;
  const t = String(d.deviceType ?? d.device?.type ?? "").toLowerCase();
  const n = labelForHomeDevice(d).toLowerCase();
  if (/camera|ipc|cctv|webcam|nvr|dvr/.test(t)) return true;
  if (/camera|cctv|máy\s*ảnh|webcam/.test(n)) return true;
  return false;
}
