export interface NavigateToMiniappParams {
  appId: string;
  path?: string;
  extraData?: Record<string, any>;
}

export const navigateToMiniapp = (
  params: NavigateToMiniappParams
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

    if (!params.appId) {
      reject(new Error("appId is required"));
      return;
    }

    window.WindVane.call(
      "WVMiniApp",
      "navigateToMiniApp",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to navigate to MiniApp"
          )
        );
      }
    );
  });
};
