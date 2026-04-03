import React from "react";
import { useNavigate } from "react-router-dom";

export interface SensorAlarmCardProps {
  deviceId: string;
  title: string;
  /**
   * Giá trị hiển thị (smoke/human): **WebSocket trước**; HTTP chỉ dự phòng khi WS chưa có.
   * - `undefined` — chưa có WS (và có thể chưa hết thời gian chờ HTTP) → “Đang chờ WebSocket…”
   */
  wsState: boolean | undefined;
  /** Tăng mỗi lần WS push (để gắn `data-*` / debug). */
  wsRev?: number;
  /** Icon hiển thị khi trạng thái bình thường (green banner). */
  NormalIcon: React.FC;
  /** Icon hiển thị khi có cảnh báo (red banner). */
  AlarmIcon: React.FC;
  /** Nhãn trạng thái cảnh báo (ví dụ "Fire alarm", "Detected"). */
  alarmLabel?: string;
  /** Nhãn trạng thái bình thường (mặc định "Normal"). */
  normalLabel?: string;
  /** aria-label prefix (ví dụ "Cảm biến khói", "Cảm biến người"). */
  ariaPrefix?: string;
  /**
   * `alarm` (mặc định): `true` = banner đỏ cảnh báo (khói, báo động).
   * `presence`: hiển thị hiện diện — `true`/`false` đều banner xanh, khác icon/nhãn (PIR / có người).
   */
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
