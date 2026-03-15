export interface StartAccelerometerParams {
  interval?: "ui" | "game" | "normal";
}

export const startAccelerometer = (
  params: StartAccelerometerParams = {}
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
      "WVMotion",
      "startAccelerometer",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to start accelerometer"
          )
        );
      }
    );
  });
};

export const stopAccelerometer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.WindVane) {
      resolve();
      return;
    }

    window.WindVane.call("WVMotion", "stopAccelerometer", {}, () => resolve());
  });
};
