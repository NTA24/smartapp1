export interface NavBarHeightResult {
  height: number;
  screenWidth: number;
  screenHeight: number;
}

export const getNavBarHeight = (): Promise<NavBarHeightResult> => {
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
      "WVNavigationBar",
      "getHeight",
      {},
      (result: NavBarHeightResult) => {
        resolve(result);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(
            JSON.stringify(error) || "Failed to get navigation bar height"
          )
        );
      }
    );
  });
};

