export const openBrowser = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    const params = {
      url,
    };

    window.WindVane.call(
      "WVBase",
      "openBrowser",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to open browser"));
      }
    );
  });
};
