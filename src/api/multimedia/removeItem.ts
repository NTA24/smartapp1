export const removeItem = (key: string): Promise<void> => {
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
      "removeItem",
      { key },
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to remove item"
          )
        );
      }
    );
  });
};

