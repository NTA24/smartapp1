export interface UploadFileParams {
  url: string;
  filePath: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface UploadFileResult {
  data: string;
  headers: string;
}

export const uploadFile = (
  params: UploadFileParams
): Promise<UploadFileResult> => {
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
      "WVFile",
      "uploadFile",
      params,
      (result: UploadFileResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to upload file"
          )
        );
      }
    );
  });
};

