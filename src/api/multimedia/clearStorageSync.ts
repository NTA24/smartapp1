export const clearStorageSync = (): Promise<void> => {
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
      "WVStorage",
      "clearStorageSync",
      {},
      () => {
        resolve();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to clear storage sync"
          )
        );
      }
    );
  });
};

