import React, { useEffect } from "react";
import { useSensorTelemetryHttpFallback } from "../hooks/useSensorTelemetryHttpFallback";
import { addLog } from "../lib/debugLog";
import { useDoorSensorWs } from "../lib/tbWebSocket";
import { fetchDeviceDoorSensorLatest } from "../services/deviceSync";
import { SensorAlarmCard } from "./SensorAlarmCard";

function DoorClosedIcon() {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--safe">
      <rect x="18" y="10" width="28" height="44" rx="4" fill="#ecfdf5" stroke="#047857" strokeWidth="2.5" />
      <circle cx="40" cy="32" r="2.5" fill="#047857" />
    </svg>
  );
}

function DoorOpenIcon() {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden className="smoke-sensor-card__state-svg smoke-sensor-card__state-svg--alarm">
      <path d="M16 10h24a4 4 0 0 1 4 4v40H16z" fill="#fee2e2" stroke="#b91c1c" strokeWidth="2.5" />
      <path d="M40 14l10 4v34l-10 2z" fill="#b91c1c" opacity="0.9" />
      <circle cx="36" cy="32" r="2.5" fill="#b91c1c" />
    </svg>
  );
}

export interface DoorSensorCardProps {
  deviceId: string;
  title: string;
}

export const DoorSensorCard: React.FC<DoorSensorCardProps> = ({ deviceId, title }) => {
  const { open: wsOpen, wsRev } = useDoorSensorWs(deviceId);
  const displayOpen = useSensorTelemetryHttpFallback(wsOpen, deviceId, fetchDeviceDoorSensorLatest);

  useEffect(() => {
    addLog("[door_card]", `mount id=${deviceId}`, `ws=${wsOpen}`, `display=${displayOpen}`, `rev=${wsRev}`);
  }, [deviceId, wsOpen, displayOpen, wsRev]);

  return (
    <SensorAlarmCard
      deviceId={deviceId}
      title={title}
      wsState={displayOpen}
      wsRev={wsRev}
      variant="alarm"
      alarmTheme="smoke"
      NormalIcon={DoorClosedIcon}
      AlarmIcon={DoorOpenIcon}
      alarmLabel="Open"
      normalLabel="Closed"
      ariaPrefix="Cảm biến cửa"
    />
  );
};
