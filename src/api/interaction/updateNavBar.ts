export interface NavBarUpdateParams {
  title?: string;
  titleColor?: string;
  barStyle?: "float" | "normal";
  backgroundColor?: string;
  hideBackButton?: string;
  theme?: "light" | "dark";
}

export const updateNavBar = (params: NavBarUpdateParams): Promise<void> => {
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
      "update",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to update navigation bar")
        );
      }
    );
  });
};

