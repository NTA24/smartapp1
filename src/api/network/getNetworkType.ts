export interface GetNetworkTypeParams {
  wifiStatus?: boolean;
  wifiList?: boolean;
}

export interface WifiInfo {
  ssid: string;
  bssid: string;
}

export interface NetworkTypeResult {
  type: string;
  message: string;
  ssid?: string;
  bssid?: string;
  wifiList?: WifiInfo[];
}

export const getNetworkType = (
  params: GetNetworkTypeParams = {}
): Promise<NetworkTypeResult> => {
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
      "WVNetwork",
      "getNetworkType",
      params,
      (result: NetworkTypeResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get network type"
          )
        );
      }
    );
  });
};
