export interface BatteryInfo {
  level: string;
  isCharging: string;
  chargingType: string;
}

export const getBatteryInfo = (): Promise<BatteryInfo> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    window.WindVane.call(
      "WVBattery",
      "getBatteryInfo",
      {},
      (result: BatteryInfo) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get battery info"
          )
        );
      }
    );
  });
};
