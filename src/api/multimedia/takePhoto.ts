export interface TakePhotoParams {
  mode?: "camera" | "photo" | "both";
  compatible?: boolean;
  mutipleSelection?: "0" | "1";
  maxSelect?: number;
  v?: string;
  needBase64?: boolean;
}

export interface PhotoImage {
  url: string;
  localPath: string;
}

export interface TakePhotoResult {
  url: string;
  localPath: string;
  identifier?: string;
  base64Data?: string;
  images?: PhotoImage[];
}

export const takePhoto = (
  params: TakePhotoParams = { mode: "both" }
): Promise<TakePhotoResult> => {
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
      "WVCamera",
      "takePhoto",
      params,
      (result: TakePhotoResult) => {
        resolve(result);
      },
      (error: any) => {
        // Handle cancellation
        if (
          error?.ret === "HY_RET_PHOTO_CANCLE" ||
          error?.ret === "HY_FAILED"
        ) {
          reject(new Error("Photo selection cancelled"));
        } else if (error?.msg === "NO_PERMISSION") {
          reject(new Error("No permission to access camera/album"));
        } else {
          reject(
            new Error(
              error?.errorMsg ||
                error?.msg ||
                JSON.stringify(error) ||
                "Failed to take photo"
            )
          );
        }
      }
    );
  });
};
