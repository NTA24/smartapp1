/**
 * Điều khiển thiết bị từ mini-app — HTTP POST telemetry.
 * - Smart Switch: `postDeviceSharedScopeSwitchChannel` → SHARED_SCOPE `cmd-sw1`…`cmd-sw4` on/off.
 * - Đèn hành lang: `sendGatewayPlugHallwayControl` → SHARED_SCOPE `cmd-socket`.
 * Trạng thái: WebSocket subscribe (`state-sw*`, `state-plug`, …), không bật/tắt qua WS.
 */
import { addLog } from "../lib/debugLog";
import {
  postDeviceClientScopeStatePlug,
  postDeviceSharedScopeLedColorTemp,
  postDeviceSharedScopeLedLight,
  postDeviceSharedScopePower,
  postDeviceSharedScopeSocketPower,
  postDeviceSharedScopeSwitchChannel,
} from "./deviceSync";

export {
  postDeviceClientScopeStatePlug,
  postDeviceSharedScopeLedColorTemp,
  postDeviceSharedScopeLedLight,
  postDeviceSharedScopePower,
  postDeviceSharedScopeSwitchChannel,
};
export type { SmartSwitchChannel } from "./deviceSync";

/**
 * Đèn hành lang — giống widget ThingsBoard: **POST** `…/plugins/telemetry/DEVICE/{id}/SHARED_SCOPE`
 * body **`{ "cmd-socket": "on" | "off" }`** (không dùng WS để bật/tắt).
 */
export async function sendGatewayPlugHallwayControl(deviceId: string | null, on: boolean): Promise<void> {
  if (!deviceId?.trim()) return;
  const id = deviceId.trim();
  await postDeviceSharedScopeSocketPower(id, on);
  addLog("[hallway_plug]", id, on ? "on" : "off", "cmd-socket SHARED_SCOPE ok");
}
