interface AppInfo {
  ios: string;
  android: string;
}

interface IsAppsInstalledParams {
  [appName: string]: AppInfo;
}

interface IsAppsInstalledResult {
  [appName: string]: boolean;
}

export const isAppsInstalled = (
  params: IsAppsInstalledParams
): Promise<IsAppsInstalledResult> => {
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
      "isAppsInstalled",
      params,
      (result: IsAppsInstalledResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to check apps"));
      }
    );
  });
};
