export interface ChooseContactResult {
  name: string;
  phone: string;
}

export const choose = (): Promise<ChooseContactResult> => {
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
      "WVContacts",
      "choose",
      {},
      (result: ChooseContactResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to choose contact"
          )
        );
      }
    );
  });
};
