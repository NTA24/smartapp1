export interface ActionSheetParams {
  title: string;
  _index: number;
  buttons: string[];
}

export const showActionSheet = (params: ActionSheetParams): Promise<void> => {
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
      "WVUIActionSheet",
      "show",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(JSON.stringify(error) || "Failed to show action sheet")
        );
      }
    );
  });
};
