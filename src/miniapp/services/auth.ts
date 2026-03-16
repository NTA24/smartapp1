import { getApiBase, getMiniAppAppId, DEFAULT_SCOPES } from "../lib/config";
import { addLog } from "../lib/debugLog";
import { getAuthCode as apiGetAuthCode } from "../../api/authentication/getAuthCode";
import { authorize } from "../../api/permissions/authorize";
import { getLocation } from "../../api/location/getLocation";

const WV_READY_TIMEOUT_MS = 12000; // Đợi tối đa 12s (CDN load + super app inject)
const WV_POLL_INTERVAL_MS = 150;  // Kiểm tra mỗi 150ms

export function isWindVaneReady(): boolean {
  return typeof window !== "undefined" && !!window.WindVane && typeof window.WindVane.call === "function";
}

export function onWindVaneReady(): Promise<void> {
  return new Promise((resolve) => {
    if (isWindVaneReady()) {
      addLog("onWindVaneReady: WindVane đã có sẵn");
      return resolve();
    }

    addLog("onWindVaneReady: đợi event + poll", WV_POLL_INTERVAL_MS + "ms, timeout", WV_READY_TIMEOUT_MS + "ms");
    let done = false;
    const finish = (by: string) => {
      if (done) return;
      done = true;
      addLog("onWindVaneReady: kết thúc —", by, "| WindVane?", !!window.WindVane, "| .call?", typeof window.WindVane?.call);
      resolve();
    };

    // 1. Lắng nghe event WindVaneReady (super app có thể fire khi inject xong)
    if (typeof document !== "undefined") {
      document.addEventListener("WindVaneReady", () => finish("event WindVaneReady"), { once: true });
    }

    // 2. Poll kiểm tra window.WindVane
    const pollStart = Date.now();
    const pollId = setInterval(() => {
      if (done) {
        clearInterval(pollId);
        return;
      }
      if (isWindVaneReady()) {
        clearInterval(pollId);
        finish("poll");
      } else if (Date.now() - pollStart >= WV_READY_TIMEOUT_MS) {
        clearInterval(pollId);
        finish("timeout " + WV_READY_TIMEOUT_MS + "ms");
      }
    }, WV_POLL_INTERVAL_MS);

    // 3. Timeout tổng
    setTimeout(() => {
      clearInterval(pollId);
      if (!done) finish("setTimeout " + WV_READY_TIMEOUT_MS + "ms");
    }, WV_READY_TIMEOUT_MS);
  });
}

/** Một số nền tảng (Tammi) chỉ chấp nhận scope "auth_user" thay vì USER_NAME/USER_PHONE_NUMBER */
const FALLBACK_SCOPES = ["auth_user"];

/** Đợi WindVane, authorize từng scope (API), rồi gọi API getAuthCode. Retry tối đa 3 lần khi WindVane chưa sẵn sàng. */
export function getAuthCode(scopes: string[] = [...DEFAULT_SCOPES]): Promise<{ authCode: string; scopes: string[] }> {
  const tryOnce = (attempt: number): Promise<{ authCode: string; scopes: string[] }> =>
    onWindVaneReady()
      .then(() => {
        if (!isWindVaneReady()) {
          addLog("getAuthCode: WindVane chưa sẵn sàng sau khi đợi");
          throw new Error("WindVane chưa sẵn sàng");
        }
        const appId = getMiniAppAppId();
        if (!appId) {
          addLog("getAuthCode: appId rỗng");
          throw new Error("appId đang rỗng");
        }
        return appId;
      })
      .then(async (appId) => {
        const API_AUTHORIZE = "WindVane.call('wv','authorize',{scope})";
        const API_GET_LOCATION = "WindVane.call('WVLocation','getLocation',params)";
        const ensureLocationAndConsent = async () => {
          try {
            addLog("[API] authorize — " + API_AUTHORIZE + " scope=location");
            await authorize("location");
            addLog("[API] authorize OK — " + API_AUTHORIZE);
          } catch (e) {
            addLog("[API] LỖI authorize — " + API_AUTHORIZE + " | ", e);
          }
          try {
            addLog("[API] getLocation — " + API_GET_LOCATION);
            await getLocation({});
            addLog("[API] getLocation OK — " + API_GET_LOCATION);
          } catch (e) {
            addLog("[API] LỖI getLocation — " + API_GET_LOCATION + " | ", e);
          }
          for (const scope of scopes) {
            try {
              addLog("[API] authorize — " + API_AUTHORIZE + " scope=" + scope);
              await authorize(scope);
              addLog("[API] authorize OK — " + API_AUTHORIZE);
            } catch (e) {
              addLog("[API] LỖI authorize scope=" + scope + " — " + API_AUTHORIZE + " | ", e);
            }
          }
        };

        await ensureLocationAndConsent();

        const API_GET_AUTH_CODE = "WindVane.call('wv','getAuthCode',{appId,scopes})";
        const tryWithScopes = async (scopeList: string[]) => {
          addLog("[API] getAuthCode — " + API_GET_AUTH_CODE + " appId=" + appId.slice(0, 12) + ".. scopes=" + scopeList.join(","));
          const result = await apiGetAuthCode(appId, scopeList);
          addLog("[API] getAuthCode OK — " + API_GET_AUTH_CODE);
          return { authCode: result.authCode, scopes: scopeList };
        };

        try {
          return await tryWithScopes(scopes);
        } catch (firstErr: unknown) {
          const firstMsg = String((firstErr as Error)?.message ?? "");
          const isLocationOrConsentError =
            /no location permission|No consent data available|consent|HY_FAILED/i.test(firstMsg);

          if (isLocationOrConsentError) {
            addLog("[API] LỖI getAuthCode — " + API_GET_AUTH_CODE + " | " + firstMsg);
            addLog("[API] Retry: getLocation + authorize rồi gọi lại getAuthCode...");
            await ensureLocationAndConsent();
            try {
              return await tryWithScopes(scopes);
            } catch (retryErr: unknown) {
              const usedFallback = !scopes.includes("auth_user");
              if (usedFallback) {
                addLog("[API] Thử fallback authorize + getAuthCode với scope auth_user");
                try {
                  addLog("[API] authorize — " + API_AUTHORIZE + " scope=auth_user");
                  await authorize("auth_user");
                  return await tryWithScopes(FALLBACK_SCOPES);
                } catch (authUserErr: unknown) {
                  addLog("[API] LỖI getAuthCode (auth_user) — " + API_GET_AUTH_CODE + " | ", authUserErr);
                }
              }
              addLog("[API] LỖI cuối — getAuthCode — " + API_GET_AUTH_CODE + " | ", retryErr);
              throw new Error(
                "Chưa có quyền truy cập (No consent data available). Vui lòng vào Tammi → Cài đặt → Quyền Mini App → bật Vị trí và Số điện thoại cho app này, rồi mở lại và bấm Cho phép."
              );
            }
          }
          throw firstErr;
        }
      })
      .catch((err) => {
        const msg = err?.message ?? "";
        const isNotReady = msg.includes("WindVane") && (msg.includes("not available") || msg.includes("chưa sẵn sàng"));
        if (isNotReady && attempt < 3) {
          addLog("getAuthCode: retry", attempt + 1, "/ 3 —", msg);
          return new Promise<void>((r) => setTimeout(r, 400)).then(() => tryOnce(attempt + 1));
        }
        addLog("[API] LỖI getAuthCode (WindVane/retry) — " + msg, err);
        throw err;
      });

  return tryOnce(0);
}

export interface SuperAppLoginResult {
  success: boolean;
  data?: { phoneNumber?: string; user?: { phoneNumber?: string; msisdn?: string } };
  error?: string;
  message?: string;
}

export async function loginMiniApp(
  scopes: string[] = [...DEFAULT_SCOPES]
): Promise<SuperAppLoginResult> {
  addLog("loginMiniApp: bắt đầu scopes=", scopes.join(","));
  const auth = await getAuthCode(scopes);
  const apiBase = getApiBase();
  const superappLoginUrl = `${apiBase}/auth/superapp-login`;
  addLog("[API] superapp-login — POST " + superappLoginUrl + " | scopes=" + auth.scopes.join(","));
  const res = await fetch(superappLoginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authCode: auth.authCode,
      scopes: auth.scopes,
      appId: getMiniAppAppId(),
    }),
  });
  const data = (await res.json()) as SuperAppLoginResult;
  if (data?.success) {
    addLog("[API] superapp-login OK — " + superappLoginUrl + " | có số ĐT? " + !!getPhoneFromLoginResult(data));
  } else {
    addLog("[API] LỖI superapp-login — " + superappLoginUrl + " | " + (data?.error ?? data?.message ?? JSON.stringify(data)));
  }
  return data;
}

export function getPhoneFromLoginResult(data: SuperAppLoginResult): string {
  if (!data?.data) return "";
  const d = data.data;
  if (typeof d === "string") return d;
  if (d.phoneNumber) return d.phoneNumber;
  const u = d.user;
  if (u?.phoneNumber) return u.phoneNumber;
  if (u?.msisdn) return String(u.msisdn);
  return "";
}
