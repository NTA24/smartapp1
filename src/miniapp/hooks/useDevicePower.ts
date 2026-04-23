import { useCallback, useState } from "react";


export function useDevicePower(_deviceId: string, defaultOn: boolean = false) {
  const [on, setOn] = useState<boolean>(() => defaultOn);

  const toggle = useCallback(() => {
    setOn((prev) => !prev);
  }, []);

  const setPower = useCallback((value: boolean) => {
    setOn(value);
  }, []);

  return { on, toggle, setPower };
}
