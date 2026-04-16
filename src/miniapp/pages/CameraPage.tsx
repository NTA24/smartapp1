import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { useMiniApp } from "../context/MiniAppContext";
import { CAMERA_PREVIEW_IMAGES } from "../lib/cameraPreview";
import { labelForCameraUid } from "../lib/homeCamera";
import { useCameraSdkLoading } from "../hooks/useCameraSdkLoading";
import { runMakeCallFromCameraFlow, type CameraTypeView } from "../utils/cameraFlow";

export const CameraPage: React.FC = () => {
  const { cameraToken, cameraUIDs, devices, miniAppInitialized, sessionResyncLoading } = useMiniApp();
  const cameraListBlocked = !miniAppInitialized || sessionResyncLoading;

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
    if (uids.length === 0) return [];
    return uids.map((uid, i) => ({
      uid,
      label: labelForCameraUid(uid, devices),
      thumb: CAMERA_PREVIEW_IMAGES[i % CAMERA_PREVIEW_IMAGES.length],
    }));
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

  const activeRow = rows.length > 0 ? rows[Math.min(activeIndex, rows.length - 1)] : undefined;

  const token = String(cameraToken ?? "").trim();
  const hasToken = Boolean(token);

  const invokeMakeCallForUids = async (uids: string[], source: string, typeView: CameraTypeView = "LIVE") => {
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
    if (uids.length === 0) {
      setBanner({ type: "err", text: "Chưa có camera nào. Hãy đồng bộ đăng nhập khi có dữ liệu camera." });
      return;
    }
    void runWithLoading("MULTIVIEW", () => invokeMakeCallForUids(uids, "camera-page-multi-view", "MULTIVIEW"));
  };

  const onAddCamera = () => {
    void runWithLoading("ADDDEVICES", () => invokeMakeCallForUids([], "camera-page-add-device", "ADDDEVICES"));
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
        <div className="camera-page__toolbar">
          <button
            type="button"
            className="camera-page__add-btn"
            onClick={onAddCamera}
            disabled={cameraListBlocked || loadingUid === "ADDDEVICES"}
            aria-busy={loadingUid === "ADDDEVICES" || sessionResyncLoading}
            aria-label="Thêm camera"
          >
            <PlusOutlined className="camera-page__add-icon" />
            <span>{loadingUid === "ADDDEVICES" ? "Đang mở…" : "Thêm camera"}</span>
          </button>
          <button
            type="button"
            className="camera-page__multi-btn"
            onClick={onMultiView}
            disabled={cameraListBlocked || rows.length === 0}
          >
            <AppstoreOutlined className="camera-page__multi-icon" />
            <span>Xem nhiều màn hình</span>
          </button>
        </div>
      </header>

      {cameraListBlocked ? (
        <div className="camera-page__loading" role="status" aria-live="polite">
          <div className="miniapp-loading__spinner" aria-hidden />
          <p className="camera-page__loading-text">
            {!miniAppInitialized
              ? "Đang tải danh sách camera…"
              : "Đang cập nhật tên camera…"}
          </p>
        </div>
      ) : (
        <>
      {banner && (
        <div
          className={
            banner.type === "ok" ? "camera-page__banner camera-page__banner--ok" : "camera-page__banner camera-page__banner--err"
          }
        >
          {banner.text}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="camera-page__empty">
          <p className="camera-page__empty-title">Chưa có camera</p>
          <p className="camera-page__empty-desc">Khi đăng nhập đồng bộ thành công, danh sách camera sẽ hiển thị tại đây.</p>
        </div>
      ) : (
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
          {rows.map(({ uid, label, thumb }, index) => {
            const thumbKey = `strip-${uid}-${index}-${thumb}`;
            const hideImg = brokenThumbs[thumbKey];
            const isActive = index === activeIndex;
            return (
              <SwiperSlide key={`thumb-${uid}-${index}`} className="camera-page__slide-thumb">
                <div
                  className={`camera-feed-card camera-feed-card--thumb${
                    isActive ? " camera-feed-card--thumb-active" : ""
                  }`}
                  aria-label={`Chọn camera: ${label}`}
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
                    <span className="camera-feed-card__id camera-feed-card__id--thumb" title={label}>
                      {label}
                    </span>
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
              className={`camera-feed-card camera-feed-card--hero${
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
      )}
        </>
      )}
    </div>
  );
};
