interface IsInstallParams {
  ios: string;
  android: string;
}

export const isInstall = (params: IsInstallParams): Promise<boolean> => {
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
      "WVBase",
      "isInstall",
      params,
      () => {
        resolve(true);
      },
      () => {
        resolve(false);
      }
    );
  });
};
