export interface WriteFileParams {
  mode: "write" | "append" | "overwrite";
  data: string;
  fileName: string;
  share: string;
}

export const writeFile = (params: WriteFileParams): Promise<void> => {
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
      "write",
      params,
      () => resolve(),
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to write file"
          )
        );
      }
    );
  });
};

