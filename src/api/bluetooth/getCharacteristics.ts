export interface GetCharacteristicsParams {
  deviceId: string;
  serviceId: string;
}

export interface CharacteristicsResult {
  characteristics: Array<{ characteristicId: string }>;
}

export const getCharacteristics = (
  params: GetCharacteristicsParams
): Promise<CharacteristicsResult> => {
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
      "getCharacteristics",
      params,
      (result: CharacteristicsResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to get bluetooth characteristics"
          )
        );
      }
    );
  });
};
