export interface NotificationsParams {
  deviceId: string;
  serviceId: string;
  characteristicId: string;
}

export const startNotifications = (
  params: NotificationsParams
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
      "WVBluetooth",
      "startNotifications",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to start bluetooth notifications"
          )
        );
      }
    );
  });
};
