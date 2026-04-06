import { useCallback, useEffect, useRef, useState } from "react";
import { useGatewayPlugStateWs } from "../lib/tbWebSocket";
import { fetchDeviceGatewayPlugState } from "../services/deviceSync";

/**
 * Đèn hành lang: đọc WS `state-plug`; GET nếu lâu không có push. Bật/tắt: HTTP `deviceControlHttp.sendGatewayPlugHallwayControl` (không qua WS).
 */
export function useGatewayPlugStateWithFallback(
  deviceId: string | null,
  delayMs = 1200,
): {
  live: boolean | undefined;
  refreshFromHttp: () => Promise<void>;
} {
  const { on: wsState, wsRev } = useGatewayPlugStateWs(deviceId);
  const [httpState, setHttpState] = useState<boolean | undefined>(undefined);
  /** Snapshot GET sau POST / khi mở lại app — ghi đè WS cho tới khi có push mới (wsRev đổi). */
  const [manualHttp, setManualHttp] = useState<boolean | undefined>(undefined);
  const wsSeen = useRef(false);
  const lastWsRev = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    lastWsRev.current = 0;
  }, [deviceId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    wsSeen.current = wsState !== undefined;
    if (wsState !== undefined) setHttpState(undefined);
  }, [wsState]);

  useEffect(() => {
    if (wsRev === lastWsRev.current) return;
    lastWsRev.current = wsRev;
    setManualHttp(undefined);
  }, [wsRev]);

  useEffect(() => {
    if (!deviceId) {
      setHttpState(undefined);
      return;
    }
    let cancelled = false;
    setHttpState(undefined);
    const t = window.setTimeout(() => {
      if (wsSeen.current) return;
      void fetchDeviceGatewayPlugState(deviceId).then((v) => {
        if (!cancelled && v !== null && !wsSeen.current && mountedRef.current) setHttpState(v);
      });
    }, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [deviceId, delayMs]);

  const refreshFromHttp = useCallback(async () => {
    if (!deviceId) return;
    const v = await fetchDeviceGatewayPlugState(deviceId);
    if (v !== null && mountedRef.current) setManualHttp(v);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void refreshFromHttp();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [deviceId, refreshFromHttp]);

  let live: boolean | undefined;
  if (manualHttp !== undefined) live = manualHttp;
  else if (wsState !== undefined) live = wsState;
  else live = httpState;

  return { live, refreshFromHttp };
}
