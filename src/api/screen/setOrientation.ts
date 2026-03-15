export type OrientationType =
  | "default"
  | "landscape"
  | "portrait"
  | "landscapeRight"
  | "landscapeLeft"
  | "portraitUpsideDown"
  | "auto";

export interface SetOrientationParams {
  orientation: OrientationType;
}

export const setOrientation = (params: SetOrientationParams): Promise<void> => {
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
      "setOrientation",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to set orientation"
          )
        );
      }
    );
  });
};
