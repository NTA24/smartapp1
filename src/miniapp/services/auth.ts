import { getApiBase, getMiniAppAppId, DEFAULT_SCOPES } from "../lib/config";

const WV_READY_TIMEOUT_MS = 8000;  // Đợi tối đa 8s cho super app inject WindVane
const WV_POLL_INTERVAL_MS = 300;   // Kiểm tra mỗi 300ms
const WV_EXTRA_DELAY_MS = 600;     // Delay thêm sau khi thấy WindVane (để native kịp xử lý)

function isWindVaneReady(): boolean {
  return typeof window !== "undefined" && !!window.WindVane && typeof window.WindVane.call === "function";
}

export function onWindVaneReady(): Promise<void> {
  return new Promise((resolve) => {
    if (isWindVaneReady()) {
      return resolve();
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    // 1. Lắng nghe event WindVaneReady (super app có thể fire khi inject xong)
    if (typeof document !== "undefined") {
      document.addEventListener("WindVaneReady", finish, { once: true });
    }

    // 2. Poll kiểm tra window.WindVane mỗi 300ms (phòng event không fire hoặc chậm)
    const pollStart = Date.now();
    const pollId = setInterval(() => {
      if (done) {
        clearInterval(pollId);
        return;
      }
      if (isWindVaneReady()) {
        clearInterval(pollId);
        finish();
      } else if (Date.now() - pollStart >= WV_READY_TIMEOUT_MS) {
        clearInterval(pollId);
        finish(); // Hết thời gian vẫn resolve để caller tự check lại
      }
    }, WV_POLL_INTERVAL_MS);

    // 3. Timeout tổng: sau 8s chưa có thì vẫn resolve (caller sẽ check window.WindVane?.call)
    setTimeout(() => {
      clearInterval(pollId);
      finish();
    }, WV_READY_TIMEOUT_MS);
  });
}

function getAuthCodeOnce(scopes: string[]): Promise<{ authCode: string }> {
  return onWindVaneReady()
    .then(() => new Promise<void>((r) => setTimeout(r, WV_EXTRA_DELAY_MS)))
    .then(
      () =>
        new Promise((resolve, reject) => {
          if (!isWindVaneReady()) {
            reject(new Error("WindVane chưa sẵn sàng"));
            return;
          }
          const appId = getMiniAppAppId();
          if (!appId) {
            reject(new Error("appId đang rỗng"));
            return;
          }
          window.WindVane!.call(
            "wv",
            "getAuthCode",
            { appId, scopes },
            (res: unknown) => {
              const r = res as { authCode?: string };
              if (!r?.authCode) reject(new Error("Không nhận được authCode"));
              else resolve({ authCode: r.authCode });
            },
            (err: unknown) => reject(err ?? new Error("getAuthCode fail"))
          );
        })
    );
}

export function getAuthCode(scopes: string[] = [...DEFAULT_SCOPES]): Promise<{ authCode: string }> {
  return getAuthCodeOnce(scopes).catch((err) => {
    // Retry 1 lần sau 1.5s nếu lỗi "WindVane chưa sẵn sàng" (native có thể inject chậm)
    const msg = err?.message ?? "";
    if (msg.includes("WindVane chưa sẵn sàng") || msg.includes("chưa sẵn sàng")) {
      return new Promise<void>((r) => setTimeout(r, 1500))
        .then(() => getAuthCodeOnce(scopes));
    }
    throw err;
  });
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
  const auth = await getAuthCode(scopes);
  const apiBase = getApiBase();
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
