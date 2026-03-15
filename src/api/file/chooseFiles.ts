export interface ChooseFilesResult {
  files: Array<{
    path: string;
  }>;
}

export const chooseFiles = (): Promise<ChooseFilesResult> => {
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
      "chooseFiles",
      {},
      (result: ChooseFilesResult) => resolve(result),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to choose files"
          )
        );
      }
    );
  });
};

