import { useCallback, useEffect, useState } from "react";
import { SDK_LOADING_UI_RELEASE_MS } from "../lib/cameraPreview";

/** Loading + timeout + visibility/focus — dùng chung Camera / Smart Home khi gọi makeCallFromCamera. */
export function useCameraSdkLoading() {
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  useEffect(() => {
    const releaseLoading = () => setLoadingUid(null);
    const onVisibility = () => {
      if (document.visibilityState === "visible") releaseLoading();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", releaseLoading);
    window.addEventListener("pageshow", releaseLoading);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", releaseLoading);
      window.removeEventListener("pageshow", releaseLoading);
    };
  }, []);

  const runWithLoading = useCallback(async (uid: string, action: () => Promise<void>) => {
    setLoadingUid(uid);
    const safetyTimer = window.setTimeout(() => setLoadingUid(null), SDK_LOADING_UI_RELEASE_MS);
    try {
      await action();
    } finally {
      window.clearTimeout(safetyTimer);
      setLoadingUid(null);
    }
  }, []);

  return { loadingUid, runWithLoading };
}
