export interface GetFileInfoParams {
  filePath: string;
}

export interface FileInfo {
  fileSize: string;
}

export const getFileInfo = (
  params: GetFileInfoParams
): Promise<FileInfo> => {
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
      "getFileInfo",
      params,
      (result: FileInfo) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get file info"
          )
        );
      }
    );
  });
};

