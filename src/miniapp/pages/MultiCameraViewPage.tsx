import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppstoreOutlined,
  CheckOutlined,
  FullscreenOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { addLog } from "../lib/debugLog";

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

/** Pool tối đa 9 ô — slice theo bố cục đang chọn. */
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

export type MultiViewLayoutId = "2x1" | "2x2" | "2x3" | "2x4" | "3x3";

export const MULTI_VIEW_LAYOUTS: {
  id: MultiViewLayoutId;
  cols: number;
  rows: number;
  count: number;
  label: string;
}[] = [
  { id: "2x1", cols: 2, rows: 1, count: 2, label: "2 Camera (2x1)" },
  { id: "2x2", cols: 2, rows: 2, count: 4, label: "4 Camera (2x2)" },
  { id: "2x3", cols: 2, rows: 3, count: 6, label: "6 Camera (2x3)" },
  { id: "2x4", cols: 2, rows: 4, count: 8, label: "8 Camera (2x4)" },
  { id: "3x3", cols: 3, rows: 3, count: 9, label: "9 Camera (3x3)" },
];

function layoutLayoutById(id: MultiViewLayoutId) {
  return MULTI_VIEW_LAYOUTS.find((l) => l.id === id)!;
}

/** Icon mini-grid theo bố cục */
function LayoutPickerIcon({ layoutId }: { layoutId: MultiViewLayoutId }) {
  const { cols, rows, count } = layoutLayoutById(layoutId);
  return (
    <div
      className="layout-picker-icon"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="layout-picker-icon__cell" />
      ))}
    </div>
  );
}

type HouseTab = "all" | "mine";

export const MultiCameraViewPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [tab, setTab] = useState<HouseTab>("mine");
  const [layoutId, setLayoutId] = useState<MultiViewLayoutId>("2x2");
  const [layoutSheetOpen, setLayoutSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("JS202500000323");
  const [brokenThumb, setBrokenThumb] = useState<Record<string, boolean>>({});

  const { cols, count } = layoutLayoutById(layoutId);

  const visibleSlots = useMemo(() => MOCK_MULTI_VIEW_GRID.slice(0, count), [count]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (visibleSlots.some((s) => s.id === prev)) return prev;
      const first = visibleSlots.find((s) => s.status !== "empty") ?? visibleSlots[0];
      return first?.id ?? prev;
    });
  }, [layoutId, visibleSlots]);

  useEffect(() => {
    if (!layoutSheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLayoutSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layoutSheetOpen]);

  const onFullscreenClick = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        addLog("[MultiView] fullscreen: enter");
      } else {
        await document.exitFullscreen();
        addLog("[MultiView] fullscreen: exit");
      }
    } catch (err) {
      addLog("[MultiView] fullscreen error", err);
    }
  }, []);

  const onSlotClick = useCallback((id: string, status: MultiViewSlotStatus) => {
    if (status === "empty") {
      addLog("[MultiView] ô trống — thêm camera (chưa gắn)");
      return;
    }
    if (status === "active") {
      addLog("[MultiView] click camera → /zyapp/camera/" + id);
      navigate(`/zyapp/camera/${encodeURIComponent(id)}`);
      return;
    }
    setSelectedId(id);
    addLog("[MultiView] chọn camera", id);
  }, [navigate]);

  const pickLayout = (id: MultiViewLayoutId) => {
    setLayoutId(id);
    setLayoutSheetOpen(false);
    addLog("[MultiView] bố cục", id);
  };

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
          onClick={() => {
            setTab("all");
            addLog("[MultiView] tab Tất cả nhà");
          }}
        >
          Tất cả nhà
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mine"}
          className={`multi-view-page__tab${tab === "mine" ? " multi-view-page__tab--active" : ""}`}
          onClick={() => {
            setTab("mine");
            addLog("[MultiView] tab Nhà của tôi");
          }}
        >
          Nhà của tôi
        </button>
      </div>

      <div
        className="multi-view-page__grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
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
                  <div className="multi-view-page__brand">viettel home</div>
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
                  <div className="multi-view-page__brand multi-view-page__brand--corner">viettel home</div>
                  <PlusOutlined className="multi-view-page__add-icon" />
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="multi-view-page__toolbar">
        <button
          type="button"
          className="multi-view-page__playlist"
          onClick={() => addLog("[MultiView] Danh sách phát")}
        >
          <UnorderedListOutlined style={{ color: MV_RED }} />
          <span>Danh sách phát</span>
        </button>
        <div className="multi-view-page__toolbar-icons">
          <button
            type="button"
            className="multi-view-page__icon-btn"
            aria-label="Chọn bố cục hiển thị"
            onClick={() => setLayoutSheetOpen(true)}
          >
            <AppstoreOutlined />
          </button>
          <button type="button" className="multi-view-page__icon-btn" aria-label="Toàn màn hình" onClick={() => void onFullscreenClick()}>
            <FullscreenOutlined />
          </button>
        </div>
      </div>

      {layoutSheetOpen && (
        <div
          className="multi-view-sheet"
          role="presentation"
          onClick={() => setLayoutSheetOpen(false)}
        >
          <div
            className="multi-view-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multi-view-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="multi-view-sheet__handle" aria-hidden />
            <h2 id="multi-view-sheet-title" className="multi-view-sheet__title">
              Chọn bố cục hiển thị
            </h2>
            <ul className="multi-view-sheet__list">
              {MULTI_VIEW_LAYOUTS.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={`multi-view-sheet__option${layoutId === opt.id ? " multi-view-sheet__option--active" : ""}`}
                    onClick={() => pickLayout(opt.id)}
                  >
                    <LayoutPickerIcon layoutId={opt.id} />
                    <span className="multi-view-sheet__option-label">{opt.label}</span>
                    {layoutId === opt.id ? (
                      <CheckOutlined className="multi-view-sheet__check" aria-hidden />
                    ) : (
                      <span className="multi-view-sheet__check-placeholder" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
