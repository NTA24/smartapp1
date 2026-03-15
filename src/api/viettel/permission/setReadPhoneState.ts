export interface SetReadPhoneStateResult {
  code: number;
  message: string;
  success: boolean;
}

export const setReadPhoneState = (): Promise<SetReadPhoneStateResult> => {
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
      "setReadPhoneState",
      {},
      (result: SetReadPhoneStateResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to set read phone state",
          ),
        );
      },
    );
  });
};
