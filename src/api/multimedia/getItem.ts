export const getItem = (key: string): Promise<string> => {
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
      "getItem",
      { key },
      (result: { data: string }) => {
        resolve(result.data);
      },
      (error: any) => {
        reject(
          new Error(error?.msg || JSON.stringify(error) || "Failed to get item")
        );
      }
    );
  });
};

