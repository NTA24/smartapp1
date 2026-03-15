export interface GetLocationParams {
  enableHighAccuracy?: string;
  address?: boolean;
}

export interface LocationCoords {
  longitude: string;
  latitude: string;
  accuracy: string;
}

export interface LocationAddress {
  city: string;
  province: string;
  area: string;
  road: string;
  addressLine: string;
  cityCode?: string;
}

export interface GetLocationResult {
  coords: LocationCoords;
  address?: LocationAddress;
}

export const getLocation = (
  params: GetLocationParams = {}
): Promise<GetLocationResult> => {
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
      "WVLocation",
      "getLocation",
      params,
      (result: GetLocationResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get location"
          )
        );
      }
    );
  });
};
