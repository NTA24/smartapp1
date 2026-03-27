import { USER_INFO_URL } from "../../miniapp/lib/config";

export interface UserInfoResponse {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  msisdn?: string;
  user?: {
    phoneNumber?: string;
    msisdn?: string;
    [key: string]: unknown;
  };
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
  const userRecord = asRecord(record.user);
  return {
    ...record,
    ...(typeof record.username === "string" ? { username: record.username } : {}),
    ...(typeof record.email === "string" ? { email: record.email } : {}),
    ...(typeof record.fullName === "string" ? { fullName: record.fullName } : {}),
    ...(typeof record.phone === "string" ? { phone: record.phone } : {}),
    ...(typeof record.phoneNumber === "string" ? { phoneNumber: record.phoneNumber } : {}),
    ...(typeof record.msisdn === "string" ? { msisdn: record.msisdn } : {}),
    ...(userRecord
      ? {
          user: {
            ...userRecord,
            ...(typeof userRecord.phoneNumber === "string" ? { phoneNumber: userRecord.phoneNumber } : {}),
            ...(typeof userRecord.msisdn === "string" ? { msisdn: userRecord.msisdn } : {}),
          },
        }
      : {}),
  };
}

export function getPhoneFromUserInfo(data: UserInfoResponse): string {
  const candidates = [
    data.phone,
    data.phoneNumber,
    data.msisdn,
    data.user?.phoneNumber,
    data.user?.msisdn,
    data.username,
  ];
  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
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

