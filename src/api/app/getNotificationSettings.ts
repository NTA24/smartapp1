export interface NotificationSettingsResult {
  status: "authorized" | "denied" | "notDetermined" | "unknown";
}

export const getNotificationSettings =
  (): Promise<NotificationSettingsResult> => {
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
        "WVApplication",
        "getNotificationSettings",
        {},
        (result: NotificationSettingsResult) => {
          resolve(result);
        },
        (error: any) => {
          reject(
            new Error(
              error?.msg ||
                JSON.stringify(error) ||
                "Failed to get notification settings"
            )
          );
        }
      );
    });
  };
