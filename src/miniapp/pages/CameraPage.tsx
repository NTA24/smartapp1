import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMiniApp } from "../context/MiniAppContext";
import { CAMERA_PREVIEW_IMAGES } from "../lib/cameraPreview";
import { labelForCameraUid } from "../lib/homeCamera";
import { useCameraSdkLoading } from "../hooks/useCameraSdkLoading";
import { runMakeCallFromCameraFlow } from "../utils/cameraFlow";

const MOCK_CAMERA_ROWS: { uid: string; label: string; thumb: string }[] = [
  { uid: "T3T20240045025", label: "Front Gate Camera", thumb: CAMERA_PREVIEW_IMAGES[0] },
  { uid: "T3T20240045026", label: "Front Gate Camera 2", thumb: CAMERA_PREVIEW_IMAGES[1] },
];

export const CameraPage: React.FC = () => {
  const { cameraToken, cameraUIDs, devices } = useMiniApp();

  const { loadingUid, runWithLoading } = useCameraSdkLoading();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});
  /** Camera đang xem — không phụ thuộc Swiper chính (tránh lệch với module Thumbs / freeMode). */
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbSwiperRef = useRef<SwiperType | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

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

  const rowsSignature = useMemo(() => rows.map((r) => r.uid).join("\u0001"), [rows]);

  useEffect(() => {
    setActiveIndex(0);
  }, [rowsSignature]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  /** Khi đổi activeIndex (hoặc đồng bộ từ code), cuộn dải thumbnail cho khớp. */
  useEffect(() => {
    const t = thumbSwiperRef.current;
    if (!t || t.destroyed || rows.length === 0) return;
    if (t.activeIndex !== activeIndex) {
      t.slideTo(activeIndex);
    }
  }, [activeIndex, rows.length]);

  const activeRow = rows[activeIndex] ?? rows[0];

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

  /** Ảnh lớn: gọi JSAPI mở camera đang xem. */
  const onMainHeroClick = (uid: string) => {
    void runWithLoading(uid, () => invokeMakeCallForUids([uid], "camera-page-hero", "LIVE"));
  };

  const onMultiView = () => {
    const uids = rows.map((r) => r.uid).filter(Boolean);
    void runWithLoading("MULTIVIEW", () => invokeMakeCallForUids(uids, "camera-page-multi-view", "MULTIVIEW"));
  };

  const onThumbSwiper = useCallback((swiper: SwiperType) => {
    thumbSwiperRef.current = swiper;
    swiper.slideTo(activeIndexRef.current);
  }, []);

  const onThumbSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  }, []);

  const onThumbSwiperClick = useCallback((swiper: SwiperType) => {
    const i = swiper.clickedIndex;
    if (typeof i === "number" && i >= 0) {
      setActiveIndex(i);
    }
  }, []);

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

      {rows.some((r) => r.isMock) && (
        <p className="camera-page__mock-banner">Đang hiển thị dữ liệu mẫu — đồng bộ đăng nhập để dùng camera thật.</p>
      )}

      <div className="camera-page__carousel-wrap">
        {/* Dải thumbnail: bấm / vuốt cập nhật activeIndex (không dùng freeMode — tránh lệch index). */}
        <Swiper
          onSwiper={onThumbSwiper}
          onSlideChange={onThumbSlideChange}
          onClick={onThumbSwiperClick}
          slidesPerView="auto"
          spaceBetween={10}
          slideToClickedSlide
          watchSlidesProgress
          preventClicks={false}
          preventClicksPropagation={false}
          className="camera-page__swiper-thumbs"
        >
          {rows.map(({ uid, label, thumb, isMock }, index) => {
            const thumbKey = `strip-${uid}-${index}-${thumb}`;
            const hideImg = brokenThumbs[thumbKey];
            const isActive = index === activeIndex;
            return (
              <SwiperSlide key={`thumb-${uid}-${index}`} className="camera-page__slide-thumb">
                <div
                  className={`camera-feed-card camera-feed-card--thumb${isMock ? " camera-feed-card--mock" : ""}${
                    isActive ? " camera-feed-card--thumb-active" : ""
                  }`}
                  role="presentation"
                >
                  <div className="camera-feed-card__preview camera-feed-card__preview--thumb">
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
                  </div>
                  <div className="camera-feed-card__bar camera-feed-card__bar--thumb">
                    <span className="camera-feed-card__id camera-feed-card__id--thumb">{label}</span>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Một hero duy nhất — luôn render đúng rows[activeIndex]. */}
        {activeRow && (
          <div className="camera-page__hero-wrap">
            <motion.article
              key={`${activeRow.uid}-${activeIndex}`}
              className={`camera-feed-card camera-feed-card--hero${activeRow.isMock ? " camera-feed-card--mock" : ""}${
                loadingUid === activeRow.uid ? " camera-feed-card--sdk-loading-active" : ""
              }`}
              role="button"
              tabIndex={0}
              aria-busy={loadingUid === activeRow.uid}
              layout
              transition={{ layout: { duration: 0.25 } }}
              onClick={() => onMainHeroClick(activeRow.uid)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onMainHeroClick(activeRow.uid);
              }}
              aria-label={`Mở camera (JSAPI): ${activeRow.label}`}
            >
              <div className="camera-feed-card__preview camera-feed-card__preview--hero">
                {brokenThumbs[`main-${activeRow.uid}-${activeIndex}-${activeRow.thumb}`] ? (
                  <div className="camera-feed-card__preview-fallback" aria-hidden />
                ) : (
                  <img
                    className="camera-feed-card__thumb"
                    src={activeRow.thumb}
                    alt=""
                    loading="lazy"
                    onError={() => onThumbError(`main-${activeRow.uid}-${activeIndex}-${activeRow.thumb}`)}
                  />
                )}
                {loadingUid === activeRow.uid && (
                  <div className="camera-feed-card__loading-overlay" role="status">
                    Đang mở…
                  </div>
                )}
              </div>
              <div className="camera-feed-card__bar">
                <span className="camera-feed-card__id">{activeRow.label}</span>
                <span className="camera-feed-card__status-badge">Trực tuyến</span>
              </div>
            </motion.article>
          </div>
        )}
      </div>
    </div>
  );
};
