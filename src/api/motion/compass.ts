export interface StartCompassParams {
  interval?: "ui" | "game" | "normal";
}

export const startCompass = (
  params: StartCompassParams = {}
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
      "startCompass",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to start compass"
          )
        );
      }
    );
  });
};

export const stopCompass = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.WindVane) {
      resolve();
      return;
    }

    window.WindVane.call("WVMotion", "stopCompass", {}, () => resolve());
  });
};
