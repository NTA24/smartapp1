export const closeMiniApp = (): Promise<void> => {
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
      "WVMiniApp",
      "close",
      {},
      () => {
        resolve();
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to close MiniApp"));
      }
    );
  });
};
