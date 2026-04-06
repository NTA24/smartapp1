import { useCallback, useState } from "react";


export function useDevicePower(deviceId: string, defaultOn: boolean = false) {
  const [on, setOn] = useState<boolean>(() => defaultOn);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      if (typeof window !== "undefined" && window.JSBridge) {
        window.JSBridge.send("device/setPower", { deviceId, on: next }, () => {});
      }
      return next;
    });
  }, [deviceId]);

  const setPower = useCallback((value: boolean) => {
    setOn(value);
    if (typeof window !== "undefined" && window.JSBridge) {
      window.JSBridge.send("device/setPower", { deviceId, on: value }, () => {});
    }
  }, [deviceId]);

  return { on, toggle, setPower };
}
