export const hideKeyboard = (): Promise<void> => {
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
      "WVUI",
      "hideKeyboard",
      {},
      () => {
        resolve();
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to hide keyboard"));
      }
    );
  });
};
