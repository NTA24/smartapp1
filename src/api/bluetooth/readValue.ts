export interface ReadValueParams {
  deviceId: string;
  serviceId: string;
  characteristicId: string;
}

export const readValue = (params: ReadValueParams): Promise<void> => {
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
      "readValue",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to read bluetooth value"
          )
        );
      }
    );
  });
};
