export const setItem = (key: string, value: string): Promise<void> => {
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
      "setItem",
      { key, value },
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(error?.msg || JSON.stringify(error) || "Failed to set item")
        );
      }
    );
  });
};

