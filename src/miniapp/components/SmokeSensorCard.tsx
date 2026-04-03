/** Render theo WS trước; HTTP chỉ khi chưa có bản tin WS. */
import React from "react";
import { useSensorTelemetryHttpFallback } from "../hooks/useSensorTelemetryHttpFallback";
import { useSmokeDetectedWs } from "../lib/tbWebSocket";
import { fetchDeviceSmokeDetectedLatest } from "../services/deviceSync";
import { SensorAlarmCard } from "./SensorAlarmCard";

function LeafNormalIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden
      className="smoke-sensor-card__leaf-svg"
    >
      <circle cx="32" cy="32" r="26" fill="#166534" />
      <path
        fill="#ffffff"
        d="M32 17c-6 6-9 16-7 24 1 4 4 7 7 7s6-3 7-7c2-8-1-18-7-24z"
      />
    </svg>
  );
}

function FireAlarmIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden
      className="smoke-sensor-card__fire-svg"
    >
      <path
        fill="#ffffff"
        d="M38.6 5.8c.8 7-2.2 10.7-6.4 15.6-4.9 5.7-9 9.8-9 17.4 0 10 7.9 17 16.7 17 9.6 0 16.8-7.6 16.8-16.8 0-11-7.2-16.7-13.1-23.4-2.1-2.3-4.1-5-4.8-8.2z"
      />
      <path
        fill="#ffffff"
        opacity="0.88"
        d="M25.7 37.6c-1.1 2.4-1.9 4.7-1.9 7.2 0 7 6.1 12.3 13.1 12.3 7.4 0 13-5.7 13-13.3 0-5-2.3-8.3-5.7-11.8.2 1.7-.2 3.2-.9 4.7-1.2 2.5-3.9 5-6.7 5.1-3.1.1-6.3-1.8-8-4.2z"
      />
    </svg>
  );
}

export interface SmokeSensorCardProps {
  deviceId: string;
  title: string;
}

export const SmokeSensorCard: React.FC<SmokeSensorCardProps> = ({ deviceId, title }) => {
  const { alarm: wsAlarm, wsRev } = useSmokeDetectedWs(deviceId);
  const displayState = useSensorTelemetryHttpFallback(wsAlarm, deviceId, fetchDeviceSmokeDetectedLatest);
  return (
    <SensorAlarmCard
      deviceId={deviceId}
      title={title}
      wsState={displayState}
      wsRev={wsRev}
      variant="alarm"
      NormalIcon={LeafNormalIcon}
      AlarmIcon={FireAlarmIcon}
      alarmLabel="Fire alarm"
      normalLabel="Normal"
      ariaPrefix="Cảm biến khói"
    />
  );
};
