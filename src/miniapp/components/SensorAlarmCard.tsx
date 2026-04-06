import React from "react";
import { useNavigate } from "react-router-dom";

export interface SensorAlarmCardProps {
  deviceId: string;
  title: string;
  
  wsState: boolean | undefined;
  
  wsRev?: number;
  
  NormalIcon: React.FC;
  
  AlarmIcon: React.FC;
  
  alarmLabel?: string;
  
  normalLabel?: string;
  
  ariaPrefix?: string;
  
  variant?: "alarm" | "presence";
}

export const SensorAlarmCard: React.FC<SensorAlarmCardProps> = ({
  deviceId,
  title,
  wsState,
  wsRev,
  NormalIcon,
  AlarmIcon,
  alarmLabel = "Detected",
  normalLabel = "Normal",
  ariaPrefix = "Cảm biến",
  variant = "alarm",
}) => {
  const navigate = useNavigate();

  const loaded = wsState !== undefined;
  const showAlarm = variant === "alarm" && loaded && wsState === true;
  const presenceActive = variant === "presence" && loaded && wsState === true;

  return (
    <article
      className="smoke-sensor-card"
      data-device-id={deviceId}
      data-ws-rev={wsRev ?? undefined}
      data-presence={!loaded ? "loading" : wsState ? "detected" : "cleared"}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/device/${deviceId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/device/${deviceId}`);
      }}
      aria-label={`${ariaPrefix}: ${title} — ${
        !loaded ? "…" : variant === "presence" ? (wsState ? alarmLabel : normalLabel) : showAlarm ? alarmLabel : normalLabel
      }`}
    >
      <div className="smoke-sensor-card__title-line">{title}</div>
      <div
        className={
          !loaded
            ? "smoke-sensor-card__banner smoke-sensor-card__banner--loading"
            : variant === "presence"
              ? "smoke-sensor-card__banner smoke-sensor-card__banner--normal"
              : showAlarm
                ? "smoke-sensor-card__banner smoke-sensor-card__banner--alarm"
                : "smoke-sensor-card__banner smoke-sensor-card__banner--normal"
        }
      >
        {!loaded ? (
          <div className="smoke-sensor-card__loading">Đang chờ WebSocket…</div>
        ) : (
          <>
            <div className="smoke-sensor-card__icon-wrap">
              {variant === "presence" ? (presenceActive ? <AlarmIcon /> : <NormalIcon />) : showAlarm ? <AlarmIcon /> : <NormalIcon />}
            </div>
            <div
              className={
                variant === "presence"
                  ? "smoke-sensor-card__status smoke-sensor-card__status--normal"
                  : showAlarm
                    ? "smoke-sensor-card__status smoke-sensor-card__status--alarm"
                    : "smoke-sensor-card__status smoke-sensor-card__status--normal"
              }
            >
              {variant === "presence" ? (presenceActive ? alarmLabel : normalLabel) : showAlarm ? alarmLabel : normalLabel}
            </div>
          </>
        )}
      </div>
    </article>
  );
};
