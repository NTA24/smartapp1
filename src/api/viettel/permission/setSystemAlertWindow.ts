export interface SetSystemAlertWindowResult {
  code: number;
  message: string;
  success: boolean;
}

export const setSystemAlertWindow = (): Promise<SetSystemAlertWindowResult> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment.",
        ),
      );
      return;
    }

    window.WindVane.call(
      "AppVTService",
      "setSystemAlertWindow",
      {},
      (result: SetSystemAlertWindowResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to set system alert window",
          ),
        );
      },
    );
  });
};
