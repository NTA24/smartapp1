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
  postDeviceSharedScopeSocketPower,
  postDeviceSharedScopeSwitchChannel,
};
export type { SmartSwitchChannel } from "./deviceSync";

export async function sendGatewayPlugHallwayControl(deviceId: string | null, on: boolean): Promise<void> {
  if (!deviceId?.trim()) return;
  const id = deviceId.trim();
  await postDeviceSharedScopeSocketPower(id, on);
  addLog("[hallway_plug]", id, on ? "on" : "off", "cmd-socket SHARED_SCOPE ok");
}
