export const copyToClipboard = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment."
        )
      );
      return;
    }

    const params = {
      text,
    };

    window.WindVane.call(
      "WVBase",
      "copyToClipboard",
      params,
      () => {
        resolve();
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to copy to clipboard")
        );
      }
    );
  });
};
