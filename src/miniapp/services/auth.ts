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

/** Đợi WindVane, authorize từng scope (API), rồi gọi API getAuthCode. Retry tối đa 3 lần khi WindVane chưa sẵn sàng. */
export function getAuthCode(scopes: string[] = [...DEFAULT_SCOPES]): Promise<{ authCode: string }> {
  const tryOnce = (attempt: number): Promise<{ authCode: string }> =>
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
        const ensureLocationAndConsent = async () => {
          try {
            addLog("getAuthCode: authorize location (API)");
            await authorize("location");
            addLog("getAuthCode: authorize location OK");
          } catch (e) {
            addLog("getAuthCode: authorize location lỗi (bỏ qua)", e);
          }
          try {
            addLog("getAuthCode: gọi getLocation (API)");
            await getLocation({});
            addLog("getAuthCode: getLocation OK");
          } catch (e) {
            addLog("getAuthCode: getLocation lỗi (bỏ qua)", e);
          }
          for (const scope of scopes) {
            try {
              addLog("getAuthCode: authorize scope=" + scope);
              await authorize(scope);
              addLog("getAuthCode: authorize OK scope=" + scope);
            } catch (e) {
              addLog("getAuthCode: authorize lỗi scope=" + scope + " (bỏ qua)", e);
            }
          }
        };

        await ensureLocationAndConsent();

        const callGetAuthCode = () => apiGetAuthCode(appId, scopes);

        try {
          addLog("getAuthCode: gọi API getAuthCode appId=" + appId.slice(0, 8) + "...");
          const result = await callGetAuthCode();
          return { authCode: result.authCode };
        } catch (firstErr: unknown) {
          const firstMsg = String((firstErr as Error)?.message ?? "");
          const isLocationOrConsentError =
            /no location permission|No consent data available|consent|HY_FAILED/i.test(firstMsg);
          if (isLocationOrConsentError) {
            addLog("getAuthCode: lỗi consent/location, thử lại sau getLocation + authorize...", firstMsg);
            await ensureLocationAndConsent();
            addLog("getAuthCode: retry getAuthCode lần 2");
            try {
              const result = await callGetAuthCode();
              return { authCode: result.authCode };
            } catch (retryErr: unknown) {
              addLog("getAuthCode: retry vẫn lỗi", retryErr);
              throw new Error(
                "Chưa có quyền truy cập. Vui lòng vào Cài đặt Tammi / Mini App → bật quyền Vị trí và quyền lấy Số điện thoại cho ứng dụng này, rồi thử lại."
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
        addLog("getAuthCode: thất bại —", msg, err);
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
  addLog("loginMiniApp: gọi API", apiBase + "/auth/superapp-login");
  const res = await fetch(`${apiBase}/auth/superapp-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      authCode: auth.authCode,
      scopes,
      appId: getMiniAppAppId(),
    }),
  });
  const data = (await res.json()) as SuperAppLoginResult;
  if (data?.success) {
    addLog("loginMiniApp: OK, có số ĐT?", !!getPhoneFromLoginResult(data));
  } else {
    addLog("loginMiniApp: API lỗi/success=false", data?.error ?? data?.message ?? data);
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
