export interface AlertParams {
  message: string;
  okbutton: string;
  identifier?: string;
}

export const alert = (params: AlertParams): Promise<void> => {
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
      "WVUIDialog",
      "alert",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to show alert"));
      }
    );
  });
};
