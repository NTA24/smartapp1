export interface AuthStatusResult {
  isAuthed: boolean; // 1: authorized, 0: not authorized
  status: number; // iOS: 0-Not Determined, 1-Restricted, 2-Denied, 3-Authorized
}

export const authStatus = (): Promise<AuthStatusResult> => {
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
      "WVContacts",
      "authStatus",
      {},
      (result: AuthStatusResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get contacts authorization status"
          )
        );
      }
    );
  });
};
