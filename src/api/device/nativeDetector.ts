export interface IsSimulatorResult {
  isSimulator: boolean;
}

export interface CurrentUsageResult {
  cpuUsage: string;
  memoryUsage: string;
  usedMemory: string;
  totalMemory: string;
}

export interface DeviceYearResult {
  deviceYear: number;
}

export interface ModelInfoResult {
  brand: string;
  model: string;
  platform?: string;
  platformName?: string;
}

export interface SafeAreaInsetsResult {
  top: number;
  left: number;
  bottom: number;
  right: number;
  cssAvaliable: boolean;
}

export const isSimulator = (): Promise<IsSimulatorResult> => {
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
      "WVNativeDetector",
      "isSimulator",
      {},
      (result: IsSimulatorResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to check simulator"
          )
        );
      }
    );
  });
};

export const getCurrentUsage = (): Promise<CurrentUsageResult> => {
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
      "WVNativeDetector",
      "getCurrentUsage",
      {},
      (result: CurrentUsageResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get current usage"
          )
        );
      }
    );
  });
};

export const getDeviceYear = (): Promise<DeviceYearResult> => {
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
      "WVNativeDetector",
      "getDeviceYear",
      {},
      (result: DeviceYearResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get device year"
          )
        );
      }
    );
  });
};

export const getModelInfo = (): Promise<ModelInfoResult> => {
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
      "WVNativeDetector",
      "getModelInfo",
      {},
      (result: ModelInfoResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get model info"
          )
        );
      }
    );
  });
};

export const getSafeAreaInsets = (): Promise<SafeAreaInsetsResult> => {
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
      "WVNativeDetector",
      "getSafeAreaInsets",
      {},
      (result: SafeAreaInsetsResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get safe area insets"
          )
        );
      }
    );
  });
};
