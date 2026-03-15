export interface SystemInfo {
  model: string;
  brand: string;
  platform: string;
  system: string;
  screenWidth: string;
  screenHeight: string;
  density: string;
  dpi: string;
  appLanguage: string;
  systemLanguage: string;
  currentBattery: string;
  storage: string;
}

export const getSystemInfo = (): Promise<SystemInfo> => {
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
      "WVSystem",
      "getSystemInfo",
      {},
      (result: SystemInfo) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get system info"
          )
        );
      }
    );
  });
};

export const getSystemInfoSync = (): Promise<SystemInfo> => {
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
      "WVSystem",
      "getSystemInfoSync",
      {},
      (result: SystemInfo) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get system info sync"
          )
        );
      }
    );
  });
};
