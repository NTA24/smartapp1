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

export interface AuthorizeResult {
  successScope: Record<string, boolean>;
  msg: string;
}

const hasPermission = async (scope: PermissionScope): Promise<boolean> => {
  try {
    const settings = await getSetting();
    return Boolean(settings.authSetting?.[scope]);
  } catch (err) {
    console.warn("Unable to fetch permission settings:", err);
    return false;
  }
};

const buildSuccessResult = (
  scope: PermissionScope,
  msg = "Permission granted"
): AuthorizeResult => ({
  successScope: { [scope]: true },
  msg,
});

export const authorize = async (
  scope: PermissionScope
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
    window.WindVane.call(
      "wv",
      "authorize",
      { scope },
      (result: AuthorizeResult) => {
        resolve(result);
      },
      async (error: any) => {
        if (await hasPermission(scope)) {
          resolve(buildSuccessResult(scope, "Permission already granted"));
          return;
        }
        reject(new Error(JSON.stringify(error) || "Failed to authorize"));
      }
    );
  });
};
