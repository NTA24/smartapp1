export interface DownloadFileParams {
  url: string;
  name?: string;
}

export interface DownloadFileResult {
  filePath: string;
}

export const downloadFile = (
  params: DownloadFileParams
): Promise<DownloadFileResult> => {
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
      "downloadFile",
      params,
      (result: DownloadFileResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to download file"
          )
        );
      }
    );
  });
};

