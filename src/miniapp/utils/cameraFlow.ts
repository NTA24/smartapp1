import { CAMERA_FLOW_TRACE_KEY } from "../lib/storageKeys";

export function updateCameraFlowTrace(patch: Record<string, unknown>): void {
  try {
    const prevRaw = sessionStorage.getItem(CAMERA_FLOW_TRACE_KEY);
    const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, unknown>) : {};
    sessionStorage.setItem(CAMERA_FLOW_TRACE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    // Ignore storage errors.
  }
}

export function extractCameraToken(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  const candidates = [
    p.cameraToken,
    p.token,
    (p.data as Record<string, unknown> | undefined)?.cameraToken,
    (p.data as Record<string, unknown> | undefined)?.token,
    (p.result as Record<string, unknown> | undefined)?.cameraToken,
    (p.result as Record<string, unknown> | undefined)?.token,
  ];
  for (const c of candidates) {
    const v = String(c ?? "").trim();
    if (v) return v;
  }
  return "";
}
