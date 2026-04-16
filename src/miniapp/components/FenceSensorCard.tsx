import React from "react";
import { useSensorTelemetryHttpFallback } from "../hooks/useSensorTelemetryHttpFallback";
import { useFenceSensorWs } from "../lib/tbWebSocket";
import { fetchDeviceFenceSensorLatest } from "../services/deviceSync";
import { SensorAlarmCard } from "./SensorAlarmCard";

function FenceNormalIcon() {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--safe">
      <rect x="10" y="16" width="44" height="32" rx="6" fill="#ecfdf5" stroke="#047857" strokeWidth="2.5" />
      <path d="M16 30h32M16 24h32M16 36h32M16 42h32" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FenceAlarmIcon() {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--alarm">
      <rect x="10" y="16" width="44" height="32" rx="6" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2.5" />
      <path d="M16 30h32M16 24h32M16 36h32M16 42h32" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 12l6 8M52 12l-6 8" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export interface FenceSensorCardProps {
  deviceId: string;
  title: string;
  channel?: 1 | 2;
}

export const FenceSensorCard: React.FC<FenceSensorCardProps> = ({ deviceId, title, channel = 1 }) => {
  const { alarm: wsAlarm, wsRev } = useFenceSensorWs(deviceId, channel);
  const displayAlarm = useSensorTelemetryHttpFallback(
    wsAlarm,
    deviceId,
    (id) => fetchDeviceFenceSensorLatest(id, channel),
  );

  return (
    <SensorAlarmCard
      deviceId={deviceId}
      title={title}
      wsState={displayAlarm}
      wsRev={wsRev}
      variant="alarm"
      alarmTheme="smoke"
      NormalIcon={FenceNormalIcon}
      AlarmIcon={FenceAlarmIcon}
      alarmLabel="Alarm"
      normalLabel="Good"
      ariaPrefix="Fence sensor"
    />
  );
};
