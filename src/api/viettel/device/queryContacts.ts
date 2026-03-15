export interface QueryContactsParams {
  name?: string;
  phoneNumber?: string;
  limit?: number;
  anchor?: number;
}

export interface QueryContactsResult {
  contacts: Array<{
    name: string;
    phoneNumber: string;
  }>;
}

export const queryContacts = (
  params: QueryContactsParams,
): Promise<QueryContactsResult> => {
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
      "VTDeviceService",
      "queryContacts",
      params,
      (result: QueryContactsResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to query contacts",
          ),
        );
      },
    );
  });
};
