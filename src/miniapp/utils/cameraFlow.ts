import { addLog } from "../lib/debugLog";
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

interface CameraJsapiResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return JSON.stringify(err ?? {});
}

export function callMakeCallFromCamera(token: string, cameraUIDs: string[] = []): Promise<unknown> {
  const normalizedUIDs = Array.isArray(cameraUIDs)
    ? cameraUIDs.map((v) => String(v).trim()).filter(Boolean)
    : [];
  return new Promise((resolve, reject) => {
    addLog("[CHECK][JSAPI_PAYLOAD] IOTPlatFormService.makeCallFromCamera", {
      tokenPreview: token.slice(0, 8) + "…",
      cameraUIDCount: normalizedUIDs.length,
    });
    const call = window.WindVane?.call;
    if (typeof call !== "function") {
      reject(new Error("WindVane.call không khả dụng (không chạy trong SuperApp/WebView?)"));
      return;
    }
    call(
      "IOTPlatFormService",
      "makeCallFromCamera",
      { token, cameraUIDs: normalizedUIDs },
      (res: unknown) => {
        const payload = (res && typeof res === "object" ? res : {}) as CameraJsapiResponse;
        if (payload.success !== true) {
          const msg = String(payload.message ?? "") || "makeCallFromCamera failed";
          addLog("[CHECK][JSAPI_CALL] failed", payload);
          reject(new Error(msg));
          return;
        }
        addLog("[CHECK][JSAPI_CALL] success", payload);
        resolve(payload);
      },
      (err: unknown) => {
        const msg = getErrorMessage(err);
        addLog("[CHECK][JSAPI_CALL] error callback", msg);
        reject(new Error(msg || "makeCallFromCamera failed"));
      },
    );
  });
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

export function extractCameraUIDs(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const raw = p.cameraUIDs;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      return String((item as Record<string, unknown>).deviceId ?? "").trim();
    })
    .filter(Boolean);
}
