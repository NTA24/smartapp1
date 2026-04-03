import React from "react";
import {
  AlertOutlined,
  BulbOutlined,
  CloudOutlined,
  CloudServerOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import { isSmartSwitchTelemetryDevice, type SmartBuildingDeviceRecord } from "../services/deviceSync";

export type DeviceCardKind = "sensor" | "switch" | "light" | "gateway" | "other";

function combinedText(d: SmartBuildingDeviceRecord): string {
  return [
    d.label,
    d.name,
    d.device?.label,
    d.device?.name,
    d.deviceType,
    d.device?.type,
  ]
    .map((x) => String(x ?? "").toLowerCase())
    .join(" ");
}

/**
 * Phân loại thẻ thiết bị (không gồm camera — camera dùng HomeCameraCard).
 * Thứ tự: công tắc đa kênh (state-sw*) → cảm biến → đèn → gateway / nút on-off hành lang → khác.
 */
export function inferDeviceCardKind(d: SmartBuildingDeviceRecord): DeviceCardKind {
  if (isSmartSwitchTelemetryDevice(d)) return "switch";

  const t = combinedText(d);

  if (
    /\b(sensor|cảm biến|cam bien|smoke|human|motion|door|window|temp|humidity|leak|pir|radar|occupancy)\b/.test(
      t,
    ) ||
    /khói|khoi|chuyển động|chuyen dong/.test(t)
  ) {
    return "sensor";
  }

  if (/\b(light|đèn|den|bulb|lamp|dimmer|led)\b/.test(t)) {
    return "light";
  }

  if (
    /\b(gateway|hub|bridge|coordinator|zigbee|mqtt broker|điều khiển trung tâm)\b/.test(t) ||
    /^home assistant$/i.test(String(d.label ?? d.device?.label ?? "").trim())
  ) {
    return "gateway";
  }

  return "other";
}

export function deviceCardKindLabel(kind: DeviceCardKind): string {
  switch (kind) {
    case "sensor":
      return "Cảm biến";
    case "switch":
      return "Công tắc";
    case "light":
      return "Đèn";
    case "gateway":
      return "Đèn hành lang (bật/tắt)";
    default:
      return "Thiết bị";
  }
}

export function deviceCardKindMeta(kind: DeviceCardKind, rawType: string): string {
  const raw = String(rawType ?? "").trim();
  const base = deviceCardKindLabel(kind);
  if (!raw || raw.toLowerCase() === "home assistant") return base;
  if (kind === "other") return raw || base;
  return `${base} · ${raw}`;
}

export function deviceCardIconForKind(kind: DeviceCardKind): React.ReactNode {
  switch (kind) {
    case "sensor":
      return <AlertOutlined />;
    case "switch":
      return <ControlOutlined />;
    case "light":
      return <BulbOutlined />;
    case "gateway":
      return <CloudServerOutlined />;
    default:
      return <CloudOutlined />;
  }
}

