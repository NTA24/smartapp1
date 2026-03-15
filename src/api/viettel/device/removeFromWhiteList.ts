export interface RemoveFromWhiteListParams {
  miniAppId: string;
}

export const removeFromWhiteList = (
  params: RemoveFromWhiteListParams,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment.",
        ),
      );
      return;
    }

    window.WindVane.call(
      "VTDeviceService",
      "removeFromWhiteList",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to remove from white list",
          ),
        );
      },
    );
  });
};
