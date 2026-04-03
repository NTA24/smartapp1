import React, { useMemo, useState, useCallback } from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import { useMiniApp } from "../context/MiniAppContext";
import { CAMERA_PREVIEW_IMAGES } from "../lib/cameraPreview";
import { labelForCameraUid } from "../lib/homeCamera";
import { useCameraSdkLoading } from "../hooks/useCameraSdkLoading";
import { runMakeCallFromCameraFlow } from "../utils/cameraFlow";

/** Hai camera mẫu — dùng khi API chưa trả `cameraUIDs` (xem layout / demo). */
const MOCK_CAMERA_ROWS: { uid: string; label: string; thumb: string }[] = [
  { uid: "T3T20240045025", label: "Front Gate Camera", thumb: CAMERA_PREVIEW_IMAGES[0] },
  { uid: "T3T20240045026", label: "Front Gate Camera", thumb: CAMERA_PREVIEW_IMAGES[1] },
];

/** Trang Camera (`/zyapp`) — bấm thumbnail → gọi JSAPI `makeCallFromCamera` cho camera đó. */
export const CameraPage: React.FC = () => {
  const { cameraToken, cameraUIDs, devices, requestAuthAndPhone, authLoading } = useMiniApp();

  const { loadingUid, runWithLoading } = useCameraSdkLoading();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  const onThumbError = useCallback((key: string) => {
    setBrokenThumbs((prev) => ({ ...prev, [key]: true }));
  }, []);

  const rows = useMemo(() => {
    const uids = cameraUIDs.map((u) => String(u).trim()).filter(Boolean);
    if (uids.length > 0) {
      return uids.map((uid, i) => ({
        uid,
        label: labelForCameraUid(uid, devices),
        thumb: CAMERA_PREVIEW_IMAGES[i % CAMERA_PREVIEW_IMAGES.length],
        isMock: false,
      }));
    }
    return MOCK_CAMERA_ROWS.map((row) => ({ ...row, isMock: true as const }));
  }, [cameraUIDs, devices]);

  const token = String(cameraToken ?? "").trim();
  const hasToken = Boolean(token);

  const invokeMakeCallForUids = async (uids: string[], source: string, typeView: "LIVE" | "MULTIVIEW" = "LIVE") => {
    if (!hasToken) {
      setBanner({ type: "err", text: "Chưa có cameraToken. Hãy đăng nhập lại." });
      return;
    }

    setBanner(null);

    try {
      await runMakeCallFromCameraFlow(token, uids, source, typeView);
      setBanner({ type: "ok", text: "Đã gọi makeCallFromCamera." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setBanner({ type: "err", text: msg });
    }
  };

  const onThumbnailClick = (uid: string) => {
    void runWithLoading(uid, () => invokeMakeCallForUids([uid], "camera-page-thumb", "LIVE"));
  };

  const onMultiView = () => {
    const uids = rows.map((r) => r.uid).filter(Boolean);
    void runWithLoading("MULTIVIEW", () => invokeMakeCallForUids(uids, "camera-page-multi-view", "MULTIVIEW"));
  };

  const onRefreshAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshMsg("");
    setBanner(null);
    try {
      await requestAuthAndPhone();
      setRefreshMsg("Đã cập nhật danh sách camera.");
    } catch (err) {
      setRefreshMsg(`Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="camera-page">
      <header className="camera-page__header">
        <h1 className="camera-page__heading">Camera</h1>
        <div className="camera-page__header-actions">
          <button type="button" className="camera-page__multi-btn" onClick={onMultiView}>
            <AppstoreOutlined className="camera-page__multi-icon" />
            <span>Xem nhiều màn hình</span>
          </button>
        </div>
      </header>

      {banner && (
        <div
          className={
            banner.type === "ok" ? "camera-page__banner camera-page__banner--ok" : "camera-page__banner camera-page__banner--err"
          }
        >
          {banner.text}
        </div>
      )}

      <div className="camera-page__list">
        {rows.some((r) => r.isMock) && (
          <p className="camera-page__mock-banner">Đang hiển thị dữ liệu mẫu — đồng bộ đăng nhập để dùng camera thật.</p>
        )}
        {rows.map(({ uid, label, thumb, isMock }) => {
          const thumbKey = `${uid}-${thumb}`;
          const hideImg = brokenThumbs[thumbKey];
          const busy = loadingUid === uid;
          return (
            <article
              key={uid}
              className={`camera-feed-card${isMock ? " camera-feed-card--mock" : ""}${
                busy ? " camera-feed-card--sdk-loading-active" : ""
              }`}
              role="button"
              tabIndex={0}
              aria-busy={busy}
              onClick={() => onThumbnailClick(uid)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onThumbnailClick(uid);
              }}
              aria-label={`Mở camera (JSAPI): ${label}`}
            >
              <div className="camera-feed-card__preview">
                {hideImg ? (
                  <div className="camera-feed-card__preview-fallback" aria-hidden />
                ) : (
                  <img
                    className="camera-feed-card__thumb"
                    src={thumb}
                    alt=""
                    loading="lazy"
                    onError={() => onThumbError(thumbKey)}
                  />
                )}
                {busy && (
                  <div className="camera-feed-card__loading-overlay" role="status">
                    Đang mở…
                  </div>
                )}
              </div>
              <div className="camera-feed-card__bar">
                <span className="camera-feed-card__id">{label}</span>
                <span className="camera-feed-card__status">
                  <span className="camera-feed-card__dot" />
                  Trực tuyến
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <form className="camera-page__footer-auth" onSubmit={(e) => void onRefreshAuth(e)}>
        <button type="submit" className="camera-page__footer-auth-btn" disabled={authLoading}>
          {authLoading ? "Đang đồng bộ…" : "Đồng bộ đăng nhập / danh sách"}
        </button>
        {!!refreshMsg && <p className="camera-page__footer-msg">{refreshMsg}</p>}
      </form>
    </div>
  );
};
