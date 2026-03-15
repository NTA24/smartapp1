export interface AddPhoneContactParams {
  lastName: string;
  firstName: string;
  middleName?: string;
  nickName?: string;
  remark?: string;
  mobilePhoneNumber?: string;
  hostNumber?: string;
  address?: string;
  email?: string;
  organization?: string;
  title?: string;
  photoPath?: string;
}

export const addPhoneContact = (
  params: AddPhoneContactParams
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
      "WVContacts",
      "addPhoneContact",
      params,
      () => {
        resolve();
      },
      (error: any) => {
        reject(
          new Error(
            error?.msg || JSON.stringify(error) || "Failed to add contact"
          )
        );
      }
    );
  });
};
