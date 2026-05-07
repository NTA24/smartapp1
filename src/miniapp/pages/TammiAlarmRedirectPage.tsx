import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeParamsFromUrl(search: string): MiniAppLaunchParams | null {
  const q = new URLSearchParams(search);
  const alarmId = q.get("alarmId") ?? undefined;

  const listRaw =
    q.get("listIdByAlarm") ??
    q.get("miniappParams") ??
    q.get("miniappPatrams") ??
    q.get("params");

  let listIdByAlarm: MiniAppAlarmItem[] | undefined;
  if (listRaw) {
    const parsed = safeJsonParse<unknown>(listRaw);
    if (Array.isArray(parsed)) {
      listIdByAlarm = parsed as MiniAppAlarmItem[];
    } else if (parsed && typeof parsed === "object") {
      const rec = parsed as Record<string, unknown>;
      if (Array.isArray(rec.listIdByAlarm)) {
        listIdByAlarm = rec.listIdByAlarm as MiniAppAlarmItem[];
      }
    }
  }

  if (!alarmId && !listIdByAlarm) return null;
  return { alarmId, listIdByAlarm };
}

export const TammiAlarmRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fromUrl = normalizeParamsFromUrl(location.search);
    if (fromUrl) {
      window.MINIAPP_PARAMS = {
        ...(window.MINIAPP_PARAMS ?? {}),
        ...fromUrl,
      };
    }
    navigate("/notifications", { replace: true });
  }, [location.search, navigate]);

  return (
    <div className="notifications-page">
      <p className="notifications-page__empty">Đang chuyển tới danh sách thông báo…</p>
    </div>
  );
};

