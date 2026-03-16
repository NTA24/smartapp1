export interface BluetoothAuthResult {
  state: string;
}

export const requestAuthorization = (): Promise<BluetoothAuthResult> => {
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
      "WVBluetooth",
      "requestAuthorization",
      {},
      (result: BluetoothAuthResult) => {
        resolve(result);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to request bluetooth authorization"
          )
        );
      }
    );
  });
};
