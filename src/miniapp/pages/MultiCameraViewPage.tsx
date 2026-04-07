import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FullscreenOutlined, LeftOutlined, PlusOutlined, ReloadOutlined, UnorderedListOutlined } from "@ant-design/icons";

const MV_RED = "#e31837";

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
];

export type MultiViewSlotStatus = "connecting" | "active" | "empty";

export interface MultiViewGridSlot {
  id: string;
  status: MultiViewSlotStatus;
  progress?: number;
  thumbnail?: string | null;
}

export const MOCK_MULTI_VIEW_GRID: MultiViewGridSlot[] = [
  { id: "JS202500000323", status: "connecting", progress: 99 },
  { id: "T3T20240045025", status: "active", thumbnail: PREVIEW_IMAGES[0] },
  { id: "JS202500000290", status: "active", thumbnail: PREVIEW_IMAGES[1] },
  { id: "CAM004", status: "active", thumbnail: PREVIEW_IMAGES[0] },
  { id: "CAM005", status: "active", thumbnail: PREVIEW_IMAGES[1] },
  { id: "CAM006", status: "empty" },
  { id: "CAM007", status: "empty" },
  { id: "CAM008", status: "empty" },
  { id: "CAM009", status: "empty" },
];

type HouseTab = "all" | "mine";

export const MultiCameraViewPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [tab, setTab] = useState<HouseTab>("mine");
  const [selectedId, setSelectedId] = useState<string>("JS202500000323");
  const [brokenThumb, setBrokenThumb] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const cols = 2;
  const pageSize = 4; // default layout 2x2
  const pageCount = Math.max(1, Math.ceil(MOCK_MULTI_VIEW_GRID.length / pageSize));

  const visibleSlots = useMemo(
    () => MOCK_MULTI_VIEW_GRID.slice(page * pageSize, page * pageSize + pageSize),
    [page],
  );

  useEffect(() => {
    setSelectedId((prev) => {
      if (visibleSlots.some((s) => s.id === prev)) return prev;
      const first = visibleSlots.find((s) => s.status !== "empty") ?? visibleSlots[0];
      return first?.id ?? prev;
    });
  }, [visibleSlots]);

  const onFullscreenClick = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  }, []);

  const onSlotClick = useCallback(
    (id: string, status: MultiViewSlotStatus) => {
      if (status === "empty") return;
      if (status === "active") {
        navigate(`/zyapp/camera/${encodeURIComponent(id)}`);
        return;
      }
      setSelectedId(id);
    },
    [navigate],
  );

  const goPrevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNextPage = useCallback(() => setPage((p) => Math.min(pageCount - 1, p + 1)), [pageCount]);

  const onGridTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  }, []);

  const onGridTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const startX = touchStartXRef.current;
      const endX = e.changedTouches[0]?.clientX ?? null;
      if (startX == null || endX == null) return;
      const delta = endX - startX;
      if (Math.abs(delta) < 36) return;
      if (delta < 0) goNextPage();
      else goPrevPage();
    },
    [goNextPage, goPrevPage],
  );

  return (
    <div className="multi-view-page" ref={rootRef}>
      <header className="multi-view-page__bar">
        <Link to="/zyapp" className="multi-view-page__back" aria-label="Quay lại">
          <LeftOutlined />
        </Link>
        <h1 className="multi-view-page__title">Xem nhiều màn hình</h1>
        <span className="multi-view-page__bar-spacer" aria-hidden />
      </header>

      <div className="multi-view-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "all"}
          className={`multi-view-page__tab${tab === "all" ? " multi-view-page__tab--active" : ""}`}
          onClick={() => setTab("all")}
        >
          Tất cả nhà
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mine"}
          className={`multi-view-page__tab${tab === "mine" ? " multi-view-page__tab--active" : ""}`}
          onClick={() => setTab("mine")}
        >
          Nhà của tôi
        </button>
      </div>

      <div className="multi-view-page__pager">
        <button type="button" className="multi-view-page__pager-btn" onClick={goPrevPage} disabled={page === 0}>
          Trang trước
        </button>
        <span className="multi-view-page__pager-text">Trang {page + 1}/{pageCount}</span>
        <button
          type="button"
          className="multi-view-page__pager-btn"
          onClick={goNextPage}
          disabled={page >= pageCount - 1}
        >
          Trang sau
        </button>
      </div>

      <div
        className="multi-view-page__grid"
        onTouchStart={onGridTouchStart}
        onTouchEnd={onGridTouchEnd}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {visibleSlots.map((slot) => {
          const selected = selectedId === slot.id && slot.status !== "empty";
          return (
            <button
              key={slot.id}
              type="button"
              className={`multi-view-page__cell multi-view-page__cell--${slot.status}${
                selected ? " multi-view-page__cell--selected" : ""
              }`}
              onClick={() => onSlotClick(slot.id, slot.status)}
            >
              {slot.status === "connecting" && (
                <>
                  <div className="multi-view-page__brand">Viettel Home</div>
                  <ReloadOutlined className="multi-view-page__reload" />
                  <span className="multi-view-page__reload-label">Tải lại</span>
                  <span className="multi-view-page__label">{slot.id}</span>
                </>
              )}
              {slot.status === "active" && (
                <>
                  {!brokenThumb[slot.id] && slot.thumbnail ? (
                    <img
                      className="multi-view-page__thumb"
                      src={slot.thumbnail}
                      alt=""
                      onError={() => setBrokenThumb((p) => ({ ...p, [slot.id]: true }))}
                    />
                  ) : (
                    <div className="multi-view-page__thumb-fallback" />
                  )}
                  <span className="multi-view-page__label">{slot.id}</span>
                </>
              )}
              {slot.status === "empty" && (
                <>
                  <div className="multi-view-page__brand multi-view-page__brand--corner">Viettel Home</div>
                  <PlusOutlined className="multi-view-page__add-icon" />
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="multi-view-page__toolbar">
        <button type="button" className="multi-view-page__playlist" onClick={() => {}}>
          <UnorderedListOutlined style={{ color: MV_RED }} />
          <span>Danh sách phát</span>
        </button>
        <div className="multi-view-page__toolbar-icons">
          <button
            type="button"
            className="multi-view-page__icon-btn"
            aria-label="Toàn màn hình"
            onClick={() => void onFullscreenClick()}
          >
            <FullscreenOutlined />
          </button>
        </div>
      </div>
    </div>
  );
};
