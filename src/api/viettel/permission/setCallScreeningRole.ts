export interface SetCallScreeningRoleResult {
  code: number;
  message: string;
  success: boolean;
}

export const setCallScreeningRole = (): Promise<SetCallScreeningRoleResult> => {
  return new Promise((resolve, reject) => {
    if (!window.WindVane) {
      reject(
        new Error(
          "WindVane is not available. Please run in Mini App environment.",
        ),
      );
      return;
    }

    window.WindVane.call(
      "AppVTService",
      "setCallScreeningRole",
      {},
      (result: SetCallScreeningRoleResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg ||
              JSON.stringify(error) ||
              "Failed to set call screening role",
          ),
        );
      },
    );
  });
};
