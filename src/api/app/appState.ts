export interface AppStateResult {
  state: "active" | "inactive" | "background" | "unknown";
}

export const appState = (): Promise<AppStateResult> => {
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
      "WVApplication",
      "appState",
      {},
      (result: AppStateResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get app state"
          )
        );
      }
    );
  });
};
