export interface ListeningShakeParams {
  on: boolean;
  frequency?: number;
  shakeThreshold?: number;
  shakeNum?: number;
}

export const listeningShake = (params: ListeningShakeParams): Promise<void> => {
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
      "listeningShake",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to listen shake"
          )
        );
      }
    );
  });
};
