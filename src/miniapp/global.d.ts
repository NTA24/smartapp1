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
  interface Window {
    WindVane?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call: (module: string, method: string, params: unknown, onSuccess?: (res: any) => void, onFail?: (err: any) => void) => void;
    };
    JSBridge?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: (path: string, data: unknown, callback?: (res: any) => void) => void;
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
    NativeBridge?: { call: (a: unknown, b: unknown) => void };
    webkit?: {
      messageHandlers?: { JSBridge?: unknown };
    };
  }
}
