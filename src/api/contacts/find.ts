export interface FindContactsParams {
  filter: {
    name?: string;
    phone?: string;
  };
}

export interface Contact {
  name: string;
  phone: string;
}

export interface FindContactsResult {
  contacts: Contact[];
}

export const find = (
  params: FindContactsParams
): Promise<FindContactsResult> => {
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
      "find",
      params,
      (result: FindContactsResult) => {
        resolve(result);
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to find contacts"
          )
        );
      }
    );
  });
};
