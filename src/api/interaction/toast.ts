export interface ToastParams {
  message: string;
  duration?: number;
}

export const toast = (params: ToastParams): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    const toastParams = {
      message: params.message,
      duration: params.duration || 0.8,
    };

    window.WindVane.call(
      "WVUIToast",
      "toast",
      toastParams,
      () => {
        resolve();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to show toast"));
      }
    );
  });
};
