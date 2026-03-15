export interface AddToWhiteListParams {
  miniAppId: string;
}

export const addToWhiteList = (params: AddToWhiteListParams): Promise<void> => {
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
      "addToWhiteList",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to add to white list",
          ),
        );
      },
    );
  });
};
