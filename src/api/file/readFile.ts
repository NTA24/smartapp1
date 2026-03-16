export interface ReadFileParams {
  fileName: string;
  share: string;
}

export interface ReadFileResult {
  data: string;
}

export const readFile = (params: ReadFileParams): Promise<ReadFileResult> => {
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
      "read",
      params,
      (result: ReadFileResult) => resolve(result),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to read file"
          )
        );
      }
    );
  });
};

