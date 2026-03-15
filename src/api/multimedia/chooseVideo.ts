export interface ChooseVideoParams {
  mode?: "camera" | "video" | "both";
  compatible?: boolean;
}

export interface ChooseVideoResult {
  path: string;
  fileSize: string;
  duration: string;
  width: string;
  height: string;
}

export const chooseVideo = (
  params: ChooseVideoParams = { mode: "both" }
): Promise<ChooseVideoResult> => {
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
      "WVVideo",
      "chooseVideo",
      params,
      (result: ChooseVideoResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to choose video"
          )
        );
      }
    );
  });
};

