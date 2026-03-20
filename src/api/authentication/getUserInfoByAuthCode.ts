export interface UserInfoResponse {
  username: string;
  email: string;
  fullName: string;
  // API có thể trả thêm field khác
  [key: string]: unknown;
}

const USER_INFO_URL = "https://campus.iot-platform.io.vn/api/v1/mini-app/oauth/user-info";

export async function getUserInfoByAuthCode(authCode: string): Promise<UserInfoResponse> {
  const res = await fetch(USER_INFO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ authCode }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "detail" in data && typeof (data as any).detail === "string" && (data as any).detail) ||
      (data && typeof data === "object" && "message" in data && typeof (data as any).message === "string" && (data as any).message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as UserInfoResponse;
}

