export interface BeepParams {
  count?: number;
}

export const beep = (params: BeepParams = { count: 1 }): Promise<void> => {
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
      "WVNotification",
      "beep",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to play beep"
          )
        );
      }
    );
  });
};
