export interface GetServicesParams {
  deviceId: string;
}

export interface ServicesResult {
  services: string[];
}

export const getServices = (
  params: GetServicesParams
): Promise<ServicesResult> => {
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
      "WVBluetooth",
      "getServices",
      params,
      (result: ServicesResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get bluetooth services"
          )
        );
      }
    );
  });
};
