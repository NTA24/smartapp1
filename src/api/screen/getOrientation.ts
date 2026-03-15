export interface OrientationResult {
  orientation: string;
}

export const getOrientation = (): Promise<OrientationResult> => {
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
      "WVScreen",
      "getOrientation",
      {},
      (result: OrientationResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get orientation"
          )
        );
      }
    );
  });
};
