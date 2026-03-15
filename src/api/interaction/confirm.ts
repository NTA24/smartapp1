export interface ConfirmParams {
  message: string;
  okbutton: string;
  cancelbutton: string;
  _index: number;
}

export const confirm = (params: ConfirmParams): Promise<void> => {
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
      "confirm",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to show confirm dialog")
        );
      }
    );
  });
};

