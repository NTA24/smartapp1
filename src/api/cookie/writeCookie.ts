export interface WriteCookieParams {
  cookieKey: string;
  domain: string;
  "max-age"?: string;
  path?: string;
}

export const writeCookie = (params: WriteCookieParams): Promise<void> => {
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
      "write",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to write cookie"
          )
        );
      }
    );
  });
};
