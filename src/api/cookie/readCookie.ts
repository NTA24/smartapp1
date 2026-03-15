export interface ReadCookieParams {
  url: string;
}

export interface ReadCookieResult {
  value: Record<string, any>;
}

export const readCookie = (
  params: ReadCookieParams
): Promise<ReadCookieResult> => {
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
      "WVCookie",
      "read",
      params,
      (result: ReadCookieResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to read cookie"
          )
        );
      }
    );
  });
};
