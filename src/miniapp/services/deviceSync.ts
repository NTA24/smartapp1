import { NEWGEN_DEVICE_WITH_CREDENTIALS_URL, SMART_BUILDING_BASE_URL } from "../lib/config";

export interface TbEntityId {
  id: string;
  entityType: string;
}

export interface TbDevice {
  id: TbEntityId;
  createdTime?: number;
  tenantId?: TbEntityId;
  customerId?: TbEntityId;
  name?: string;
  type?: string;
  label?: string;
  deviceProfileId?: TbEntityId;
  firmwareId?: TbEntityId;
  softwareId?: TbEntityId;
  version?: number;
  additionalInfo?: Record<string, unknown>;
  deviceData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SmartBuildingDeviceRecord {
  createdTime?: number;
  device?: TbDevice;
  deviceEntityType?: string;
  deviceId?: string;
  deviceType?: string;
  label?: string;
  name?: string;
  storedAt?: string;
  username?: string;
  [key: string]: unknown;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function readMessage(data: unknown): string {
  const record = asRecord(data);
  if (!record) return "";
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  return "";
}

function parseTbDevice(data: unknown): TbDevice | null {
  const record = asRecord(data);
  if (!record) return null;
  const id = asRecord(record.id);
  if (!id || typeof id.id !== "string" || typeof id.entityType !== "string") return null;
  return {
    ...(record as TbDevice),
    id: { id: id.id, entityType: id.entityType },
  };
}

function parseSmartBuildingDeviceRecord(data: unknown): SmartBuildingDeviceRecord | null {
  const record = asRecord(data);
  if (!record) return null;
  return record as SmartBuildingDeviceRecord;
}

function getNewGenApiKey(): string {
  const env = typeof import.meta !== "undefined"
    ? (import.meta.env as Record<string, unknown>).VITE_NEWGEN_API_KEY
    : undefined;
  return String(env ?? "").trim();
}

export async function createDeviceInNewGen(body: Record<string, unknown>): Promise<TbDevice> {
  const apiKey = getNewGenApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_NEWGEN_API_KEY");
  }

  const res = await fetch(NEWGEN_DEVICE_WITH_CREDENTIALS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ThingsBoard/NewGen usually accepts Bearer token in X-Authorization
      "X-Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `NewGen HTTP ${res.status}`);
  }
  const parsed = parseTbDevice(data);
  if (!parsed) throw new Error("Invalid NewGen device response");
  return parsed;
}

export async function saveDeviceToSmartBuilding(username: string, device: TbDevice): Promise<SmartBuildingDeviceRecord> {
  const res = await fetch(`${SMART_BUILDING_BASE_URL}/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, device }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(readMessage(data) || `Save device HTTP ${res.status}`);
  }
  const parsed = parseSmartBuildingDeviceRecord(data);
  if (!parsed) throw new Error("Invalid SmartBuilding save response");
  return parsed;
}

export async function getDevicesByUsername(username: string): Promise<SmartBuildingDeviceRecord[]> {
  const url = `${SMART_BUILDING_BASE_URL}/devices/by-username?username=${encodeURIComponent(username)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(`Get devices HTTP ${res.status}`);
  }
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => parseSmartBuildingDeviceRecord(item))
    .filter((item): item is SmartBuildingDeviceRecord => item !== null);
}

// Step 6 + Step 7 helper: create in NewGen then persist to SmartBuilding.
export async function createAndStoreDevice(
  username: string,
  newGenRequestBody: Record<string, unknown>,
): Promise<SmartBuildingDeviceRecord> {
  const created = await createDeviceInNewGen(newGenRequestBody);
  return saveDeviceToSmartBuilding(username, created);
}

