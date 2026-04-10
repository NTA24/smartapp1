import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getMiniAppAppId, getApiBase, saveAppId, STORAGE_KEY_APP_ID, DEFAULT_MINIAPP_APP_ID } from "../lib/config";
import { storeGet } from "../lib/store";
import { getAuthCode, onWindVaneReady } from "../services/auth";
import {
  getPhoneFromUserInfo,
  getUserInfoByAuthCode,
  type UserInfoResponse,
} from "../../api/authentication/getUserInfoByAuthCode";
import { getDevicesByUsername, type SmartBuildingDeviceRecord } from "../services/deviceSync";
import { extractCameraToken, extractCameraUIDs, MINIAPP_DEVICES_REFRESH_EVENT } from "../utils/cameraFlow";
import { labelForCameraUid } from "../lib/homeCamera";
import { ZYAPP_CAMERA_TOKEN_STORAGE_KEY } from "../lib/storageKeys";
import { tbWsManager } from "../lib/tbWebSocket";

const RESYNC_LOADING_MAX_MS = 12_000;

/** Chuỗi nhãn hiển thị theo thứ tự UID — dùng để biết tên camera đã đổi sau resync. */
function cameraListLabelSignature(uids: string[], devices: SmartBuildingDeviceRecord[]): string {
  return uids
    .map((u) => String(u).trim())
    .filter(Boolean)
    .map((uid) => labelForCameraUid(uid, devices))
    .join("\u0001");
}

interface MiniAppState {
  userPhone: string;
  cameraToken: string;
  cameraUIDs: string[];
  devices: SmartBuildingDeviceRecord[];
  appId: string;
  apiBase: string;
  authModalVisible: boolean;
  authLoading: boolean;
  authError: string;
  /** true sau khi lần khởi tạo miniapp (WindVane + auth) chạy xong — dùng cho UI loading trang Camera. */
  miniAppInitialized: boolean;
  /** true khi đang resync sau SDK — tắt khi chuỗi nhãn camera khác snapshot (hoặc hết thời gian chờ). */
  sessionResyncLoading: boolean;
}

interface MiniAppContextValue extends MiniAppState {
  setUserPhone: (phone: string) => void;
  setDevices: (devices: SmartBuildingDeviceRecord[]) => void;
  refreshDevices: () => Promise<void>;
  setAuthModalVisible: (v: boolean) => void;
  requestAuthAndPhone: () => Promise<void>;
  saveAppId: (id: string) => void;
  clearAuthError: () => void;
}

const initialState: MiniAppState = {
  userPhone: typeof window !== "undefined" ? (window.MINIAPP_USER_PHONE ?? "") : "",
  cameraToken: "",
  cameraUIDs: [],
  devices: [],
  appId: "",
  apiBase: getApiBase(),
  authModalVisible: false,
  authLoading: false,
  authError: "",
  miniAppInitialized: false,
  sessionResyncLoading: false,
};

const MiniAppContext = createContext<MiniAppContextValue | null>(null);

function hydrateStoredCameraData(): { cameraToken: string; cameraUIDs: string[] } {
  try {
    const raw = sessionStorage.getItem(ZYAPP_CAMERA_TOKEN_STORAGE_KEY);
    if (!raw) return { cameraToken: "", cameraUIDs: [] };
    const parsed = JSON.parse(raw) as unknown;
    return {
      cameraToken: extractCameraToken(parsed),
      cameraUIDs: extractCameraUIDs(parsed),
    };
  } catch {
    return { cameraToken: "", cameraUIDs: [] };
  }
}

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>(() => ({
    ...initialState,
    appId: getMiniAppAppId(),
    ...hydrateStoredCameraData(),
  }));

  const didRequestRef = useRef(false);
  const miniAppInitializedRef = useRef(false);
  miniAppInitializedRef.current = state.miniAppInitialized;
  const resyncLabelSnapshotRef = useRef("");

  useEffect(() => {
    tbWsManager.ensureConnected();
  }, []);

  const setUserPhone = useCallback((phone: string) => {
    setState((s) => ({ ...s, userPhone: phone }));
    if (typeof window !== "undefined") window.MINIAPP_USER_PHONE = phone;
  }, []);

  const setDevices = useCallback((devices: SmartBuildingDeviceRecord[]) => {
    setState((s) => ({ ...s, devices }));
  }, []);

  /** Cập nhật cameraToken / cameraUIDs / phone / devices / session từ payload oauth/user-info. */
  const applyUserInfoFromOAuthResponse = useCallback(
    async (info: UserInfoResponse) => {
      const phone = getPhoneFromUserInfo(info);
      const camToken = extractCameraToken(info);
      const camUIDs = extractCameraUIDs(info);

      if (camToken || camUIDs.length > 0) {
        setState((s) => ({ ...s, cameraToken: camToken, cameraUIDs: camUIDs }));
        try {
          sessionStorage.setItem(ZYAPP_CAMERA_TOKEN_STORAGE_KEY, JSON.stringify(info));
        } catch {}
      }

      if (phone) {
        setUserPhone(phone);
        try {
          const devices = await getDevicesByUsername(phone);
          setDevices(devices);
        } catch {}
      }
      const P = window.MiniAppPermissions;
      if (P?.getSetting) {
        const settings = await P.getSetting().catch(() => null);
        if (settings?.authSetting && P.setPermissionStatus) {
          P.setPermissionStatus(settings.authSetting);
        }
      }
    },
    [setDevices, setUserPhone],
  );

  const setAuthModalVisible = useCallback((v: boolean) => {
    setState((s) => ({ ...s, authModalVisible: v }));
  }, []);

  const clearAuthError = useCallback(() => {
    setState((s) => ({ ...s, authError: "" }));
  }, []);

  const refreshDevices = useCallback(async () => {
    const username = String(window.MINIAPP_USER_PHONE ?? state.userPhone ?? "").trim();
    if (!username) {
      setDevices([]);
      return;
    }
    try {
      const devices = await getDevicesByUsername(username);
      setDevices(devices);
    } catch {}
  }, [setDevices, state.userPhone]);

  const refreshOAuthUserInfo = useCallback(async () => {
    setState((s) => {
      resyncLabelSnapshotRef.current = cameraListLabelSignature(s.cameraUIDs, s.devices);
      return { ...s, sessionResyncLoading: true };
    });
    try {
      const auth = await getAuthCode(["USER_NAME", "USER_EMAIL"]);
      const info = await getUserInfoByAuthCode(auth.authCode);
      await applyUserInfoFromOAuthResponse(info);
    } catch {
      await refreshDevices();
    }
  }, [applyUserInfoFromOAuthResponse, refreshDevices]);

  const refreshOAuthUserInfoRef = useRef(refreshOAuthUserInfo);
  refreshOAuthUserInfoRef.current = refreshOAuthUserInfo;

  useEffect(() => {
    if (!state.sessionResyncLoading) return;
    const now = cameraListLabelSignature(state.cameraUIDs, state.devices);
    if (now !== resyncLabelSnapshotRef.current) {
      setState((s) => (s.sessionResyncLoading ? { ...s, sessionResyncLoading: false } : s));
    }
  }, [state.cameraUIDs, state.devices, state.sessionResyncLoading]);

  useEffect(() => {
    if (!state.sessionResyncLoading) return;
    const id = window.setTimeout(() => {
      setState((s) => (s.sessionResyncLoading ? { ...s, sessionResyncLoading: false } : s));
    }, RESYNC_LOADING_MAX_MS);
    return () => window.clearTimeout(id);
  }, [state.sessionResyncLoading]);

  /**
   * Sau khi đóng SDK / quay lại WebView: gọi lại oauth/user-info (getAuthCode + POST user-info), rồi đồng bộ camera + devices.
   * Ngoài ra vẫn bắt event từ JSAPI makeCallFromCamera settle.
   */
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const DEBOUNCE_MS = 400;
    let debounceId: number | null = null;
    const schedule = () => {
      if (debounceId !== null) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        debounceId = null;
        if (!miniAppInitializedRef.current) return;
        void refreshOAuthUserInfoRef.current();
      }, DEBOUNCE_MS);
    };

    const onRefreshEvent = () => {
      schedule();
    };
    window.addEventListener(MINIAPP_DEVICES_REFRESH_EVENT, onRefreshEvent);

    let wasHidden = document.visibilityState === "hidden";
    const onVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      if (!hidden && wasHidden) schedule();
      wasHidden = hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    let shellBlurred = false;
    const onBlur = () => {
      shellBlurred = true;
    };
    const onFocus = () => {
      if (shellBlurred) {
        shellBlurred = false;
        schedule();
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) schedule();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener(MINIAPP_DEVICES_REFRESH_EVENT, onRefreshEvent);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      if (debounceId !== null) window.clearTimeout(debounceId);
    };
  }, []);

  const requestAuthAndPhone = useCallback(async () => {
    setState((s) => ({ ...s, authLoading: true, authError: "" }));
    try {
      const auth = await getAuthCode(["USER_NAME", "USER_EMAIL"]);
      const info = await getUserInfoByAuthCode(auth.authCode);
      await applyUserInfoFromOAuthResponse(info);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setState((s) => ({ ...s, authError: msg || "Auth flow failed" }));
      throw e;
    } finally {
      setState((s) => ({ ...s, authLoading: false }));
    }
  }, [applyUserInfoFromOAuthResponse]);

  const initializeMiniApp = useCallback(async (): Promise<void> => {
    await onWindVaneReady();

    if (!window.WindVane?.call) {
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
  }, [requestAuthAndPhone]);

  const saveAppIdCallback = useCallback((id: string) => {
    saveAppId(id);
    setState((s) => ({ ...s, appId: getMiniAppAppId() }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    void (async () => {
      try {
        await initializeMiniApp();
      } catch {
        /* lỗi đã log trong requestAuthAndPhone / auth */
      } finally {
        setState((s) => ({ ...s, miniAppInitialized: true }));
      }
    })();
    return undefined;
  }, [initializeMiniApp]);

  const value: MiniAppContextValue = {
    ...state,
    appId: state.appId || getMiniAppAppId(),
    setUserPhone,
    setDevices,
    refreshDevices,
    setAuthModalVisible,
    requestAuthAndPhone,
    saveAppId: saveAppIdCallback,
    clearAuthError,
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
