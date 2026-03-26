import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getMiniAppAppId, getApiBase, saveAppId, STORAGE_KEY_APP_ID, DEFAULT_MINIAPP_APP_ID } from "../lib/config";
import { storeGet } from "../lib/store";
import { getAuthCode, onWindVaneReady } from "../services/auth";
import { addLog } from "../lib/debugLog";
import { getUserInfoByAuthCode } from "../../api/authentication/getUserInfoByAuthCode";
import { getDevicesByUsername, type SmartBuildingDeviceRecord } from "../services/deviceSync";

const ZYAPP_CAMERA_TOKEN_STORAGE_KEY = "zyapp_camera_token_response";

function extractCameraToken(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  const tokenCandidates = [
    p.cameraToken,
    p.token,
    (p.data as Record<string, unknown> | undefined)?.cameraToken,
    (p.data as Record<string, unknown> | undefined)?.token,
    (p.result as Record<string, unknown> | undefined)?.cameraToken,
    (p.result as Record<string, unknown> | undefined)?.token,
  ];
  for (const candidate of tokenCandidates) {
    const v = String(candidate ?? "").trim();
    if (v) return v;
  }
  return "";
}

interface MiniAppState {
  userPhone: string;
  devices: SmartBuildingDeviceRecord[];
  appId: string;
  apiBase: string;
  authModalVisible: boolean;
}

interface MiniAppContextValue extends MiniAppState {
  setUserPhone: (phone: string) => void;
  setDevices: (devices: SmartBuildingDeviceRecord[]) => void;
  refreshDevices: () => Promise<void>;
  setAuthModalVisible: (v: boolean) => void;
  requestAuthAndPhone: () => Promise<void>;
  saveAppId: (id: string) => void;
}

const initialState: MiniAppState = {
  userPhone: typeof window !== "undefined" ? (window.MINIAPP_USER_PHONE ?? "") : "",
  devices: [],
  appId: "",
  apiBase: getApiBase(),
  authModalVisible: false,
};

const MiniAppContext = createContext<MiniAppContextValue | null>(null);

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>(() => ({
    ...initialState,
    appId: getMiniAppAppId(),
  }));

  const didRequestRef = useRef(false);

  const setUserPhone = useCallback((phone: string) => {
    setState((s) => ({ ...s, userPhone: phone }));
    if (typeof window !== "undefined") (window as unknown as { MINIAPP_USER_PHONE?: string }).MINIAPP_USER_PHONE = phone;
  }, []);

  const setDevices = useCallback((devices: SmartBuildingDeviceRecord[]) => {
    setState((s) => ({ ...s, devices }));
  }, []);

  const setAuthModalVisible = useCallback((v: boolean) => {
    setState((s) => ({ ...s, authModalVisible: v }));
  }, []);

  const refreshDevices = useCallback(async () => {
    const username = String((window as unknown as { MINIAPP_USER_PHONE?: string }).MINIAPP_USER_PHONE ?? state.userPhone ?? "").trim();
    if (!username) {
      setDevices([]);
      return;
    }
    try {
      const devices = await getDevicesByUsername(username);
      setDevices(devices);
      addLog("refreshDevices: fetched", devices.length, "devices for", username);
    } catch (e) {
      addLog("refreshDevices: error", e);
    }
  }, [setDevices, state.userPhone]);

  const requestAuthAndPhone = useCallback(async () => {
    addLog("[CHECK][AUTH_CODE] start getAuthCode via wv.getAuthCode");
    try {
      const auth = await getAuthCode(["USER_NAME", "USER_EMAIL"]);
      addLog("[CHECK][AUTH_CODE] success", {
        hasAuthCode: Boolean(String(auth?.authCode ?? "").trim()),
        authCodePreview: String(auth?.authCode ?? "").slice(0, 8) + "…",
      });
      addLog("[CHECK][USER_INFO_API] request POST /api/v1/mini-app/oauth/user-info", {
        hasAuthCode: Boolean(String(auth?.authCode ?? "").trim()),
      });
      const info = await getUserInfoByAuthCode(auth.authCode);
      addLog("[CHECK][USER_INFO_API] response", info);
      try {
        sessionStorage.setItem(ZYAPP_CAMERA_TOKEN_STORAGE_KEY, JSON.stringify(info));
        const token = extractCameraToken(info);
        addLog("[CHECK][USER_INFO_API] cameraToken extracted", {
          hasCameraToken: Boolean(token),
          tokenPreview: token ? token.slice(0, 8) + "…" : "",
        });
      } catch (e) {
        addLog("[CHECK][USER_INFO_API] store response error", e);
      }

      // Theo thực tế của bạn: username trả về chính là số điện thoại.
      const phone = String(info?.username ?? "").trim();
      if (phone) {
        addLog("requestAuthAndPhone: OK, số ĐT=", phone);
        setUserPhone(phone);
        try {
          const devices = await getDevicesByUsername(phone);
          setDevices(devices);
          addLog("requestAuthAndPhone: fetched", devices.length, "devices");
        } catch (e) {
          addLog("requestAuthAndPhone: get devices error", e);
        }
      } else {
        addLog("[CHECK][USER_INFO_API] username missing in response", info);
      }
      // Author: đồng bộ trạng thái quyền sau khi auth xong
      const P = window.MiniAppPermissions;
      if (P?.getSetting) {
        const settings = await P.getSetting().catch((e) => {
          addLog("requestAuthAndPhone: getSetting lỗi", e);
          return null;
        });
        if (settings?.authSetting && P.setPermissionStatus) {
          P.setPermissionStatus(settings.authSetting);
          addLog("requestAuthAndPhone: đã đồng bộ quyền thiết bị");
        }
      }
    } catch (e) {
      addLog("[CHECK][AUTH_FLOW] error", e);
    }
  }, [setDevices, setUserPhone]);

  const saveAppIdCallback = useCallback((id: string) => {
    saveAppId(id);
    setState((s) => ({ ...s, appId: getMiniAppAppId() }));
  }, []);

  // Khi mở app: đợi WindVane rồi gọi flow lấy user ngay
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    (async () => {
      await onWindVaneReady();
      if (cancelled) return;

      if (!window.WindVane?.call) {
        // Không chạy trong super app → bỏ qua auth
        setState((s) => ({ ...s, authModalVisible: false }));
        return;
      }

      const current = getMiniAppAppId();
      if (!current || current.trim() === "") {
        saveAppId(DEFAULT_MINIAPP_APP_ID);
        setState((s) => ({ ...s, appId: DEFAULT_MINIAPP_APP_ID }));
      }

      if (!didRequestRef.current) {
        didRequestRef.current = true;
        await requestAuthAndPhone();
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value: MiniAppContextValue = {
    ...state,
    appId: state.appId || getMiniAppAppId(),
    setUserPhone,
    setDevices,
    refreshDevices,
    setAuthModalVisible,
    requestAuthAndPhone,
    saveAppId: saveAppIdCallback,
  };

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
}

export function useMiniApp() {
  const ctx = useContext(MiniAppContext);
  if (!ctx) throw new Error("useMiniApp must be used within MiniAppProvider");
  return ctx;
}

export function getStoredAppId(): string {
  return storeGet(STORAGE_KEY_APP_ID) ?? "";
}
