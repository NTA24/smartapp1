export interface AskAuthResult {
  isAuthed: number; // 1: authorized, 0: not authorized
}

export const askAuth = (): Promise<AskAuthResult> => {
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
      "askAuth",
      {},
      (result: AskAuthResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to request contacts authorization"
          )
        );
      }
    );
  });
};
