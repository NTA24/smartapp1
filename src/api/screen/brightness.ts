export interface SetBrightnessParams {
  brightness: number;
}

export interface BrightnessResult {
  brightness: string;
}

export const setScreenBrightness = (
  params: SetBrightnessParams
): Promise<void> => {
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
      "WVScreen",
      "setScreenBrightness",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to set screen brightness"
          )
        );
      }
    );
  });
};

export const getScreenBrightness = (): Promise<BrightnessResult> => {
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
      "WVScreen",
      "getScreenBrightness",
      {},
      (result: BrightnessResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get screen brightness"
          )
        );
      }
    );
  });
};
