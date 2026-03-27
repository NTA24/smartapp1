export interface SearchLocationParams {
  addrs: string;
}

export interface SearchLocationResult {
  longitude: string;
  latitude: string;
}

function getErrorMsg(error: unknown): string {
  if (error && typeof error === "object") {
    const maybeMsg = (error as Record<string, unknown>).msg;
    if (typeof maybeMsg === "string" && maybeMsg.trim()) return maybeMsg;
  }
  return JSON.stringify(error) || "Failed to search location";
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
      (error: unknown) => {
        reject(new Error(getErrorMsg(error)));
      }
    );
  });
};
