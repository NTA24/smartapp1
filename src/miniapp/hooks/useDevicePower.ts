import { useCallback, useState } from "react";
import { Store } from "../lib/store";

const POWER_KEY = "devicePower:";

function getStoredPower(deviceId: string, defaultOn: boolean): boolean {
  const v = Store.get(POWER_KEY + deviceId, "");
  return v === "on" ? true : v === "off" ? false : defaultOn;
}

function setStoredPower(deviceId: string, on: boolean): void {
  Store.set(POWER_KEY + deviceId, on ? "on" : "off");
}

export function useDevicePower(deviceId: string, defaultOn: boolean = false) {
  const [on, setOn] = useState<boolean>(() => getStoredPower(deviceId, defaultOn));

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      setStoredPower(deviceId, next);
      if (typeof window !== "undefined" && window.JSBridge) {
        window.JSBridge.send("device/setPower", { deviceId, on: next }, () => {});
      }
      return next;
    });
  }, [deviceId]);

  const setPower = useCallback((value: boolean) => {
    setOn(value);
    setStoredPower(deviceId, value);
    if (typeof window !== "undefined" && window.JSBridge) {
      window.JSBridge.send("device/setPower", { deviceId, on: value }, () => {});
    }
  }, [deviceId]);

  return { on, toggle, setPower };
}
