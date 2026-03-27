import { USER_INFO_URL } from "../../miniapp/lib/config";

export interface UserInfoResponse {
  username: string;
  email: string;
  fullName: string;
  // API có thể trả thêm field khác
  [key: string]: unknown;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function pickErrorMessage(data: unknown): string {
  const record = asRecord(data);
  if (!record) return "";
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  return "";
}

function parseUserInfoResponse(data: unknown): UserInfoResponse {
  const record = asRecord(data);
  if (!record) throw new Error("Invalid user info response");
  if (typeof record.username !== "string") throw new Error("Invalid user info: missing username");
  if (typeof record.email !== "string") throw new Error("Invalid user info: missing email");
  if (typeof record.fullName !== "string") throw new Error("Invalid user info: missing fullName");
  return {
    ...record,
    username: record.username,
    email: record.email,
    fullName: record.fullName,
  };
}

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
    const msg = pickErrorMessage(data) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return parseUserInfoResponse(data);
}

