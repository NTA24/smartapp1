interface SetBackgroundColorParams {
  color: string;
  alpha?: number;
}

export const setBackgroundColor = (
  params: SetBackgroundColorParams
): Promise<void> => {
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
      "WVBase",
      "setBackgroundColor",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to set background color")
        );
      }
    );
  });
};
