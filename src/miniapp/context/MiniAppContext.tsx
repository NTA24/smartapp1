import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMiniAppAppId, getApiBase, saveAppId, STORAGE_KEY_APP_ID, DEFAULT_MINIAPP_APP_ID } from "../lib/config";
import { storeGet } from "../lib/store";
import { loginMiniApp, getPhoneFromLoginResult, onWindVaneReady } from "../services/auth";

interface MiniAppState {
  userPhone: string;
  appId: string;
  apiBase: string;
  authModalVisible: boolean;
}

interface MiniAppContextValue extends MiniAppState {
  setUserPhone: (phone: string) => void;
  setAuthModalVisible: (v: boolean) => void;
  requestAuthAndPhone: () => Promise<void>;
  saveAppId: (id: string) => void;
}

const initialState: MiniAppState = {
  userPhone: typeof window !== "undefined" ? (window.MINIAPP_USER_PHONE ?? "") : "",
  appId: "",
  apiBase: getApiBase(),
  authModalVisible: true,
};

const MiniAppContext = createContext<MiniAppContextValue | null>(null);

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MiniAppState>(() => ({
    ...initialState,
    appId: getMiniAppAppId(),
  }));

  const setUserPhone = useCallback((phone: string) => {
    setState((s) => ({ ...s, userPhone: phone }));
    if (typeof window !== "undefined") (window as unknown as { MINIAPP_USER_PHONE?: string }).MINIAPP_USER_PHONE = phone;
  }, []);

  const setAuthModalVisible = useCallback((v: boolean) => {
    setState((s) => ({ ...s, authModalVisible: v }));
  }, []);

  const requestAuthAndPhone = useCallback(async () => {
    try {
      const data = await loginMiniApp();
      const phone = getPhoneFromLoginResult(data);
      if (phone) setUserPhone(phone);
    } catch {
      // ignore
    }
  }, [setUserPhone]);

  const saveAppIdCallback = useCallback((id: string) => {
    saveAppId(id);
    setState((s) => ({ ...s, appId: getMiniAppAppId() }));
  }, []);

  // Khi mở từ super app: đợi WindVane → đảm bảo appId → gọi auth (getAuthCode + superapp-login) và author (getSetting)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    (async () => {
      try {
        await onWindVaneReady();
        if (cancelled) return;
        if (!window.WindVane?.call) return; // Không chạy trong super app → bỏ qua

        // Đảm bảo appId dùng 1512032299590111735808 khi chưa có
        const current = getMiniAppAppId();
        if (!current || current.trim() === "") {
          saveAppId(DEFAULT_MINIAPP_APP_ID);
          setState((s) => ({ ...s, appId: DEFAULT_MINIAPP_APP_ID }));
        }

        // Auth: getAuthCode + superapp-login để lấy thông tin user (số ĐT, v.v.)
        const data = await loginMiniApp();
        if (cancelled) return;
        const phone = getPhoneFromLoginResult(data);
        if (phone) setUserPhone(phone);

        // Author: đồng bộ trạng thái quyền thiết bị (getSetting)
        const P = window.MiniAppPermissions;
        if (P?.getSetting) {
          const settings = await P.getSetting().catch(() => null);
          if (!cancelled && settings?.authSetting && P.setPermissionStatus) {
            P.setPermissionStatus(settings.authSetting);
          }
        }
      } catch {
        // User hủy / không có WindVane / mạng lỗi → bỏ qua
      }
    })();
    return () => { cancelled = true; };
  }, [setUserPhone]);

  const value: MiniAppContextValue = {
    ...state,
    appId: state.appId || getMiniAppAppId(),
    setUserPhone,
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
