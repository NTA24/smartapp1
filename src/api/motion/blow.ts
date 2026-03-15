export interface ListenBlowParams {
  time?: number;
}

export const listenBlow = (params: ListenBlowParams = {}): Promise<void> => {
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
      "WVMotion",
      "listenBlow",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to listen blow"
          )
        );
      }
    );
  });
};

export const stopListenBlow = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.WindVane) {
      resolve();
      return;
    }

    window.WindVane.call("WVMotion", "stopListenBlow", {}, () => resolve());
  });
};
