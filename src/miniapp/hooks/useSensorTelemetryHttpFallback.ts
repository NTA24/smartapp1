import { useEffect, useRef, useState } from "react";

/**
 * Smoke / Human sensor: **luôn ưu tiên giá trị từ WebSocket** (`wsState`) để render.
 * Chỉ khi chưa từng nhận WS (`undefined`) thì sau `delayMs` mới dùng GET timeseries làm dự phòng.
 * Ref `wsRef` cập nhật mỗi render — tránh GET trả về muộn ghi đè sau khi đã có push WS.
 */
export function useSensorTelemetryHttpFallback(
  wsState: boolean | undefined,
  deviceId: string,
  fetchLatest: (id: string) => Promise<boolean | null>,
  delayMs = 2000,
): boolean | undefined {
  const [httpAlarm, setHttpAlarm] = useState<boolean | undefined>(undefined);
  /** Luôn = wsState mới nhất — dùng trong callback async để không áp HTTP nếu WS đã có. */
  const wsRef = useRef<boolean | undefined>(undefined);
  const fetchLatestRef = useRef(fetchLatest);
  wsRef.current = wsState;

  useEffect(() => {
    fetchLatestRef.current = fetchLatest;
  }, [fetchLatest]);

  useEffect(() => {
    if (wsState !== undefined) setHttpAlarm(undefined);
  }, [wsState]);

  useEffect(() => {
    if (!deviceId) {
      setHttpAlarm(undefined);
      return;
    }
    let cancelled = false;
    setHttpAlarm(undefined);
    const t = window.setTimeout(() => {
      if (wsRef.current !== undefined) return;
      void fetchLatestRef.current(deviceId).then((v) => {
        if (!cancelled && v !== null && wsRef.current === undefined) setHttpAlarm(v);
      });
    }, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [deviceId, delayMs]);

  if (wsState !== undefined) return wsState;
  return httpAlarm;
}
