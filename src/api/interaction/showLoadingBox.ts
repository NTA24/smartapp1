export const showLoadingBox = (): Promise<void> => {
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
      "showLoadingBox",
      {},
      () => {
        resolve();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to show loading box")
        );
      }
    );
  });
};

