import { getSetting } from "./getSetting";

export type PermissionScope =
  | "location"
  | "camera"
  | "bluetooth"
  | "album"
  | "contacts"
  | "microphone"
  | "file"
  | "call"
  | "vibrate"
  | "screen";

/** Scope cho device (PermissionScope) hoặc user info (USER_NAME, USER_PHONE_NUMBER, ...) */
export type AuthorizeScope = PermissionScope | "USER_NAME" | "USER_PHONE_NUMBER" | string;

export interface AuthorizeResult {
  successScope: Record<string, boolean>;
  msg: string;
}

const hasPermission = async (scope: AuthorizeScope): Promise<boolean> => {
  try {
    const settings = await getSetting();
    const auth = settings.authSetting as Record<string, boolean> | undefined;
    return Boolean(auth?.[scope]);
  } catch (err) {
    console.warn("Unable to fetch permission settings:", err);
    return false;
  }
};

const buildSuccessResult = (
  scope: AuthorizeScope,
  msg = "Permission granted"
): AuthorizeResult => ({
  successScope: { [scope]: true },
  msg,
});

export const authorize = async (
  scope: AuthorizeScope
): Promise<AuthorizeResult> => {
  if (!window.WindVane) {
    throw new Error(
      "WindVane is not available. Please run in Mini App environment."
    );
  }

  if (await hasPermission(scope)) {
    return buildSuccessResult(scope, "Permission already granted");
  }

  return new Promise((resolve, reject) => {
    const wv = window.WindVane;
    if (!wv) {
      reject(new Error("WindVane is not available."));
      return;
    }
    wv.call(
      "wv",
      "authorize",
      { scope },
      (result: AuthorizeResult) => {
        resolve(result);
      },
      async (error: unknown) => {
        if (await hasPermission(scope)) {
          resolve(buildSuccessResult(scope, "Permission already granted"));
          return;
        }
        reject(new Error(JSON.stringify(error) || "Failed to authorize"));
      }
    );
  });
};
