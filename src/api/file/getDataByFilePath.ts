export interface GetDataByFilePathParams {
  path: string;
}

export interface GetDataByFilePathResult {
  base64Data: string;
}

export const getDataByFilePath = (
  params: GetDataByFilePathParams
): Promise<GetDataByFilePathResult> => {
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
      "getDataByFilePath",
      params,
      (result: GetDataByFilePathResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to get file data"
          )
        );
      }
    );
  });
};

