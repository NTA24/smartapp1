export interface ListenGyroParams {
  on: boolean;
  frequency?: number;
}

export const listenGyro = (params: ListenGyroParams): Promise<void> => {
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
      "listenGyro",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to listen gyro"
          )
        );
      }
    );
  });
};
