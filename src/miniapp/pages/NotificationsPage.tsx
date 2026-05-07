import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";

interface AlarmItemView {
  id: string;
  title: string;
  tsLabel: string;
}

function parseLaunchParams(): { alarmId?: string; items: AlarmItemView[] } {
  if (typeof window === "undefined") return { items: [] };
  const raw = window.MINIAPP_PARAMS as MiniAppLaunchParams | undefined;
  const alarmId = typeof raw?.alarmId === "string" ? raw.alarmId : undefined;
  const list = Array.isArray(raw?.listIdByAlarm) ? raw!.listIdByAlarm! : [];

  const items: AlarmItemView[] = list.map((item, idx) => {
    const id = String(item.id ?? alarmId ?? idx + 1);
    const title = String(item.title ?? item.tittle ?? "").trim() || "Alarm";
    const tsNum =
      typeof item.ts === "number"
        ? item.ts
        : typeof item.ts === "string"
          ? Number(item.ts)
          : NaN;
    const date =
      Number.isFinite(tsNum) && tsNum > 0
        ? new Date(tsNum).toLocaleString("vi-VN")
        : "";
    return {
      id,
      title,
      tsLabel: date,
    };
  });

  return { alarmId, items };
}

export const NotificationsPage: React.FC = () => {
  const { alarmId, items } = useMemo(parseLaunchParams, []);

  return (
    <div className="page-profile-sub notifications-page">
      <header className="sub-page-header">
        <Link to="/" className="back btn-back" aria-label="Quay lại">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="sub-page-title">Thông báo</h1>
      </header>
      <div className="profile-sub-body">
        {alarmId && (
          <p className="notifications-page__subtitle">
            Alarm ID: <code>{alarmId}</code>
          </p>
        )}
        {items.length === 0 ? (
          <p className="notifications-page__empty">Chưa nhận được thông báo nào từ super app.</p>
        ) : (
          <ul className="notifications-page__list">
            {items.map((item) => (
              <li key={`${item.id}-${item.tsLabel}`} className="notifications-page__item">
                <div className="notifications-page__item-main">
                  <div className="notifications-page__item-title">{item.title}</div>
                  {item.tsLabel && (
                    <div className="notifications-page__item-time">{item.tsLabel}</div>
                  )}
                </div>
                <div className="notifications-page__item-id">#{item.id}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

