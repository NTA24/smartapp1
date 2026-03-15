export interface AuthCodeResponse {
  authCode: string;
  [key: string]: any;
}

export const getAuthCode = (
  appId: string,
  scopes: string[] = ["auth_user"]
): Promise<AuthCodeResponse> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    const params = {
      appId,
      scopes,
    };

    window.WindVane.call(
      "wv",
      "getAuthCode",
      params,
      (result: AuthCodeResponse) => {
        if (result?.authCode) {
          resolve(result);
        } else {
          reject(new Error("No auth code returned"));
        }
      },
      (error: any) => {
        reject(new Error(JSON.stringify(error) || "Failed to get auth code"));
      }
    );
  });
};

