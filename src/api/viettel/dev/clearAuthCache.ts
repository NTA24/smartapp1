export const clearAuthCache = (appId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment.",
        ),
      );
      return;
    }

    const params = {
      appId,
    };
    window.WindVane.call(
      "ViettelDevServices",
      "clearCache",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to clear Auth storage",
          ),
        );
      },
    );
  });
};
