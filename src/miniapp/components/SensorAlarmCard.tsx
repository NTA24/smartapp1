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

  /** `human`: nền đỏ khi phát hiện (cảm biến người); `smoke`: nền báo động mặc định */
  alarmTheme?: "smoke" | "human";
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
  alarmTheme = "smoke",
}) => {
  const navigate = useNavigate();

  const loaded = wsState !== undefined;
  const showAlarm = variant === "alarm" && loaded && wsState === true;
  const presenceActive = variant === "presence" && loaded && wsState === true;
  const isAlarmVisual = variant === "presence" ? presenceActive : showAlarm;

  const bannerTone = !loaded ? "loading" : isAlarmVisual ? "alarm" : "ok";
  const humanRedAlarm = alarmTheme === "human" && bannerTone === "alarm";

  return (
    <article
      className={`smoke-sensor-card${alarmTheme === "human" ? " smoke-sensor-card--human" : ""}`.trim()}
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
        className={`smoke-sensor-card__banner smoke-sensor-card__banner--${bannerTone}${
          humanRedAlarm ? " smoke-sensor-card__banner--alarm-human" : ""
        }`.trim()}
      >
        {!loaded ? (
          <div className="smoke-sensor-card__loading">Đang chờ WebSocket…</div>
        ) : (
          <>
            <div className="smoke-sensor-card__icon-wrap">
              {variant === "presence" ? (presenceActive ? <AlarmIcon /> : <NormalIcon />) : showAlarm ? <AlarmIcon /> : <NormalIcon />}
            </div>
            <div
              className={`smoke-sensor-card__status smoke-sensor-card__status--${bannerTone === "alarm" ? "alarm" : "ok"}`}
            >
              {variant === "presence" ? (presenceActive ? alarmLabel : normalLabel) : showAlarm ? alarmLabel : normalLabel}
            </div>
          </>
        )}
      </div>
    </article>
  );
};
