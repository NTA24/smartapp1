/** Render theo WS trước; HTTP chỉ khi chưa có bản tin WS. */
import React from "react";
import { useSensorTelemetryHttpFallback } from "../hooks/useSensorTelemetryHttpFallback";
import { useHumanDetectedWs } from "../lib/tbWebSocket";
import { fetchDeviceHumanSensorLatest } from "../services/deviceSync";
import { SensorAlarmCard } from "./SensorAlarmCard";

function HumanNormalIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden
      className="smoke-sensor-card__leaf-svg"
    >
      <circle cx="32" cy="32" r="26" fill="#166534" />
      {/* đầu */}
      <circle cx="32" cy="21" r="6" fill="#ffffff" />
      {/* thân */}
      <path fill="#ffffff" d="M20 48c0-7 5.4-12 12-12s12 5 12 12H20z" />
    </svg>
  );
}

function HumanDetectedIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden
      className="smoke-sensor-card__fire-svg"
    >
      {/* đầu */}
      <circle cx="32" cy="14" r="7" fill="#ffffff" />
      {/* thân chạy nghiêng */}
      <path
        fill="#ffffff"
        d="M32 23c-4 0-7 2-8 6l-4 10 4 2 3-7v7l-5 12 5 2 4-9 4 9 5-2-5-12v-7l3 7 4-2-4-10c-1-4-4-6-6-6z"
      />
      {/* dấu chấm than */}
      <rect x="54" y="8" width="4" height="11" rx="2" fill="#ffffff" />
      <circle cx="56" cy="24" r="2.5" fill="#ffffff" />
    </svg>
  );
}

export interface HumanSensorCardProps {
  deviceId: string;
  title: string;
}

export const HumanSensorCard: React.FC<HumanSensorCardProps> = ({ deviceId, title }) => {
  const { alarm: wsAlarm, wsRev } = useHumanDetectedWs(deviceId);
  const displayState = useSensorTelemetryHttpFallback(wsAlarm, deviceId, fetchDeviceHumanSensorLatest);
  return (
    <SensorAlarmCard
      deviceId={deviceId}
      title={title}
      wsState={displayState}
      wsRev={wsRev}
      variant="alarm"
      NormalIcon={HumanNormalIcon}
      AlarmIcon={HumanDetectedIcon}
      alarmLabel="Detected"
      normalLabel="Normal"
      ariaPrefix="Cảm biến người"
    />
  );
};
