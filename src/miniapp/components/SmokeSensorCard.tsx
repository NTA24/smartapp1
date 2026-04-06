
import React from "react";
import { useSensorTelemetryHttpFallback } from "../hooks/useSensorTelemetryHttpFallback";
import { useSmokeDetectedWs } from "../lib/tbWebSocket";
import { fetchDeviceSmokeDetectedLatest } from "../services/deviceSync";
import { SensorAlarmCard } from "./SensorAlarmCard";

/** Trạng thái bình thường: khói nhẹ + máy dò (không dùng icon giọt/lá gây nhầm độ ẩm). */
function SmokeSafeIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={56}
      height={56}
      aria-hidden
      className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--safe"
    >
      <circle cx="32" cy="36" r="18" fill="#ecfdf5" stroke="#047857" strokeWidth="2" />
      <rect x="22" y="38" width="20" height="10" rx="2" fill="#047857" />
      <circle cx="32" cy="41" r="2" fill="#ecfdf5" />
      <path
        fill="none"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
        d="M18 22c4-4 8-4 12 0s8 4 12 0M22 16c3-3 7-3 10 0M30 12c2-2 5-2 7 0"
      />
    </svg>
  );
}

function FireAlarmIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      width={56}
      height={56}
      aria-hidden
      className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--alarm"
    >
      <path
        fill="#b91c1c"
        d="M38.6 5.8c.8 7-2.2 10.7-6.4 15.6-4.9 5.7-9 9.8-9 17.4 0 10 7.9 17 16.7 17 9.6 0 16.8-7.6 16.8-16.8 0-11-7.2-16.7-13.1-23.4-2.1-2.3-4.1-5-4.8-8.2z"
      />
      <path
        fill="#fecaca"
        opacity="0.95"
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
      NormalIcon={SmokeSafeIcon}
      AlarmIcon={FireAlarmIcon}
      alarmLabel="Fire alarm"
      normalLabel="Normal"
      ariaPrefix="Cảm biến khói"
    />
  );
};
