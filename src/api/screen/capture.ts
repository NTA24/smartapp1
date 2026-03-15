export interface CaptureParams {
  inAlbum?: string;
  type?: "view" | "app";
}

export interface CaptureResult {
  url: string;
  localPath: string;
}

export const captureScreen = (
  params: CaptureParams = {}
): Promise<CaptureResult> => {
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
      "WVScreenCapture",
      "capture",
      params,
      (result: CaptureResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to capture screen"
          )
        );
      }
    );
  });
};
