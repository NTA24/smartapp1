export interface OpenSettingsParams {
  type?: "Notification";
}

export const openSettings = (
  params: OpenSettingsParams = {}
): Promise<void> => {
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
      "WVApplication",
      "openSettings",
      params,
      () => {
        resolve();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to open settings"
          )
        );
      }
    );
  });
};
