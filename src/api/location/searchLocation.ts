export interface SearchLocationParams {
  addrs: string;
}

export interface SearchLocationResult {
  longitude: string;
  latitude: string;
}

export const searchLocation = (
  params: SearchLocationParams
): Promise<SearchLocationResult> => {
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
      "searchLocation",
      params,
      (result: SearchLocationResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to search location"
          )
        );
      }
    );
  });
};
