/// <reference types="react" />
export {};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { icon?: string },
        HTMLElement
      >;
    }
  }
}

declare global {
  interface MiniAppAlarmItem {
    id?: string;
    title?: string;
    tittle?: string;
    ts?: string | number;
  }

  interface MiniAppLaunchParams {
    alarmId?: string;
    listIdByAlarm?: MiniAppAlarmItem[];
    [key: string]: unknown;
  }

  interface ErudaApi {
    init: (opts?: Record<string, unknown>) => void;
  }

  interface VConsoleCtor {
    new (opts?: Record<string, unknown>): unknown;
  }

  interface BarcodeDetectorLike {
    detect: (input: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
  }

  interface BarcodeDetectorCtorLike {
    new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  }

  interface Window {
    WindVane?: {
      call: <TSuccess = unknown, TError = unknown>(
        module: string,
        method: string,
        params: unknown,
        onSuccess?: (res: TSuccess) => void,
        onFail?: (err: TError) => void
      ) => void;
    };
    eruda?: ErudaApi;
    VConsole?: VConsoleCtor;
    vConsole?: unknown;
    __miniapp_vconsole__?: unknown;
    __miniapp_fetch_wrapped__?: boolean;
    __miniapp_wv_wrapped__?: boolean;
    BarcodeDetector?: BarcodeDetectorCtorLike;
    JSBridge?: {
      send: (path: string, data: unknown, callback?: (res: unknown) => void) => void;
    };
    MiniAppPermissions?: {
      getSetting: () => Promise<{ authSetting: Record<string, boolean> }>;
      authorize: (scope: string) => Promise<{ successScope: Record<string, boolean> }>;
      setPermissionStatus: (auth: Record<string, boolean>) => void;
      getPermissionStatus: () => Record<string, boolean>;
    };
    MINIAPP_APP_ID?: string;
    APP_ID?: string;
    MINIAPP_USER_PHONE?: string;
    APP_API_BASE_URL?: string;
    THINGSBOARD_TOKEN?: string;
    THINGSBOARD_DEVICE_ID?: string;
    MINIAPP_PARAMS?: MiniAppLaunchParams;
    NativeBridge?: { call: (a: unknown, b: unknown) => void };
    webkit?: {
      messageHandlers?: { JSBridge?: unknown };
    };
  }
}
