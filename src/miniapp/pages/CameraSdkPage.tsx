import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AudioOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  ShareAltOutlined,
  SketchOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { LeftOutlined } from "@ant-design/icons";
const CAMERA_THUMBS = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
];

type ActionId =
  | "talk"
  | "history"
  | "record"
  | "snapshot"
  | "person"
  | "motion"
  | "privacy"
  | "pet"
  | "abnormalSound"
  | "multiView"
  | "shareDevice"
  | "library";

type CameraHealth = "good" | "poor";

const MOCK_EVENTS = [
  {
    id: "e1",
    time: "11:55:39",
    label: "Phát hiện chuyển động",
    thumb: CAMERA_THUMBS[0],
  },
  {
    id: "e2",
    time: "11:22:25",
    label: "Phát hiện chuyển động",
    thumb: CAMERA_THUMBS[1],
  },
  {
    id: "e3",
    time: "11:20:06",
    label: "Phát hiện chuyển động",
    thumb: CAMERA_THUMBS[2],
  },
  {
    id: "e4",
    time: "11:14:49",
    label: "Phát hiện chuyển động",
    thumb: CAMERA_THUMBS[0],
  },
] as const;

const ACTIONS: { id: ActionId; label: string; icon: React.ReactNode; onGrid?: "always" }[] = [
  { id: "talk", label: "Đàm thoại", icon: <AudioOutlined /> },
  { id: "history", label: "Xem lịch sử", icon: <HistoryOutlined /> },
  { id: "record", label: "Ghi hình", icon: <VideoCameraOutlined /> },
  { id: "snapshot", label: "Chụp ảnh", icon: <PictureOutlined /> },
  { id: "person", label: "Phát hiện người", icon: <UserOutlined /> },
  { id: "motion", label: "Theo dõi\nchuyển\nđộng", icon: <EyeOutlined /> },
  { id: "privacy", label: "Chế độ\nriêng tư", icon: <ExclamationCircleOutlined /> },
  { id: "pet", label: "Phòng vệ\nchuông động", icon: <FieldTimeOutlined /> },
  { id: "abnormalSound", label: "Âm thanh\nbất thường", icon: <SoundOutlined /> },
  { id: "multiView", label: "Xem nhiều\nmàn hình", icon: <SketchOutlined /> },
  { id: "shareDevice", label: "Chia sẻ\nthiết bị", icon: <ShareAltOutlined /> },
  { id: "library", label: "Thư viện", icon: <DownloadOutlined /> },
];

function inferHealth(cameraId: string): CameraHealth {
  // Demo: ID nào cũng cho “Tốt”; có thể thay logic sau.
  return cameraId ? "good" : "poor";
}

type Pose = {
  yaw: number; // left/right
  pitch: number; // up/down
  savedAt: string;
};

function makeMockCurrentPose(seed: string): Pose {
  const now = Date.now();
  const n = Math.abs(hashToInt(seed)) % 1000;
  return {
    yaw: (n % 180) - 90,
    pitch: ((now / 1000) % 60) - 30,
    savedAt: new Date().toISOString(),
  };
}

function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function storageKeyFor(cameraId: string): string {
  return `miniapp_camera_saved_pose_${cameraId}`;
}

export const CameraSdkPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ cameraId: string }>();
  const cameraId = params.cameraId ?? "";

  const health = useMemo(() => inferHealth(cameraId), [cameraId]);
  const [gridHint, setGridHint] = useState<string>("");

  const [controlMode, setControlMode] = useState<"save" | "patrol" | "saved">("save");
  const [bottomTab, setBottomTab] = useState<"events" | "control" | "status" | "service">("events");
  const [currentPose, setCurrentPose] = useState<Pose>(() => makeMockCurrentPose(cameraId));
  const [savedPoses, setSavedPoses] = useState<Pose[]>([]);
  const [patrolRunning, setPatrolRunning] = useState(false);
  const patrolTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reload state when cameraId changes.
    setCurrentPose(makeMockCurrentPose(cameraId));
    try {
      const raw = sessionStorage.getItem(storageKeyFor(cameraId));
      if (!raw) {
        setSavedPoses([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) setSavedPoses(parsed as Pose[]);
      else setSavedPoses([]);
    } catch {
      setSavedPoses([]);
    }
  }, [cameraId]);

  useEffect(() => {
    if (!cameraId) return;
    try {
      sessionStorage.setItem(storageKeyFor(cameraId), JSON.stringify(savedPoses));
    } catch {}
  }, [cameraId, savedPoses]);

  useEffect(() => {
    return () => {
      if (patrolTimerRef.current) window.clearInterval(patrolTimerRef.current);
      patrolTimerRef.current = null;
    };
  }, []);

  const onSaveCurrentPose = () => {
    if (!cameraId) return;
    const pose: Pose = { ...currentPose, savedAt: new Date().toISOString() };
    setSavedPoses((prev) => {
      // Keep unique by yaw/pitch rounded to ints to avoid duplicates on fast taps.
      const key = `${Math.round(pose.yaw)}_${Math.round(pose.pitch)}`;
      const exists = prev.some((p) => `${Math.round(p.yaw)}_${Math.round(p.pitch)}` === key);
      if (exists) return prev;
      return [pose, ...prev].slice(0, 12);
    });
    setControlMode("saved");
    setGridHint("Đã lưu góc quay (mock).");
    addMockAutoHide(setGridHint, 900);
  };

  const stopPatrol = () => {
    if (patrolTimerRef.current) window.clearInterval(patrolTimerRef.current);
    patrolTimerRef.current = null;
    setPatrolRunning(false);
    setGridHint("Đã dừng tuần tra.");
    addMockAutoHide(setGridHint, 900);
  };

  const startPatrol = () => {
    if (patrolRunning) return;
    if (savedPoses.length === 0) {
      setGridHint("Chưa có góc đã lưu. Hãy bấm “Lưu góc quay” trước.");
      addMockAutoHide(setGridHint, 1600);
      return;
    }
    setPatrolRunning(true);
    setGridHint("Đang tuần tra (mock)…");
    addMockAutoHide(setGridHint, 1200);

    let idx = 0;
    patrolTimerRef.current = window.setInterval(() => {
      setCurrentPose(savedPoses[idx % savedPoses.length]);
      idx += 1;
    }, 2000);
  };

  const onApplySavedPose = (pose: Pose) => {
    setCurrentPose(pose);
    setControlMode("save");
    setGridHint("Đã áp dụng góc đã lưu (mock).");
    addMockAutoHide(setGridHint, 900);
  };

  return (
    <div className="camera-sdk-page">
      <header className="camera-sdk-page__topbar">
        <button type="button" className="camera-sdk-page__back" onClick={() => navigate(-1)} aria-label="Quay lại">
          <LeftOutlined />
        </button>
        <div className="camera-sdk-page__titleWrap">
          <div className="camera-sdk-page__cameraId">{cameraId || "—"}</div>
          <span className="camera-sdk-page__signalBadge" title={health === "good" ? "Tín hiệu tốt" : "Tín hiệu yếu"}>
            <ReloadOutlined className="camera-sdk-page__signalBadgeIcon" aria-hidden />
            {health === "good" ? "Trực tuyến" : "Yếu"}
          </span>
        </div>
        <button type="button" className="camera-sdk-page__gear" onClick={() => setGridHint("Open settings (mock)")} aria-label="Cài đặt">
          <SettingOutlined />
        </button>
      </header>

      <section className="camera-sdk-page__video">
        <div className="camera-sdk-page__videoOverlayTop">
          <span className="camera-sdk-page__speed">116 KB/s</span>
          <span className="camera-sdk-page__signal">90.6.24</span>
        </div>
        <div className="camera-sdk-page__videoFake" aria-hidden />
        <div className="camera-sdk-page__videoOverlayRight">
          <button type="button" className="camera-sdk-page__chipBtn" aria-label="2K">
            <EyeOutlined />
            <span>2K</span>
          </button>
          <button type="button" className="camera-sdk-page__chipBtn" aria-label="OSD">
            <ClockCircleOutlined />
          </button>
        </div>
      </section>

      <section className="camera-sdk-page__actions">
        <div className="camera-sdk-page__topActionsZone">
          <div className="camera-sdk-page__actionGrid">
            {ACTIONS.slice(0, 4).map((a) => {
              return (
                <button
                  key={a.id}
                  type="button"
                  className="camera-sdk-page__action"
                  onClick={() => {
                    const isMulti = a.id === "multiView";
                    if (isMulti) navigate("/zyapp/multi-view");
                    else addMockToast(setGridHint, `${a.label.replace(/\n/g, " ")} (mock)`);
                  }}
                >
                  <span className="camera-sdk-page__actionIcon">{a.icon}</span>
                  <span className="camera-sdk-page__actionLabel">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="camera-sdk-page__actionGrid camera-sdk-page__actionsRestGrid">
          {ACTIONS.slice(4).map((a) => {
            const isMulti = a.id === "multiView";
            return (
              <button
                key={a.id}
                type="button"
                className="camera-sdk-page__action"
                onClick={() => {
                  if (isMulti) navigate("/zyapp/multi-view");
                  else addMockToast(setGridHint, `${a.label.replace(/\n/g, " ")} (mock)`);
                }}
              >
                <span className="camera-sdk-page__actionIcon">{a.icon}</span>
                <span className="camera-sdk-page__actionLabel">{a.label}</span>
              </button>
            );
          })}
        </div>
        {!!gridHint && <div className="camera-sdk-page__hint">{gridHint}</div>}
      </section>

      <section className="camera-sdk-page__panelArea" aria-live="polite">
        {bottomTab === "events" && (
          <div className="camera-sdk-page__events">
            <div className="camera-sdk-page__panelTitle">Sự kiện</div>
            <div className="camera-sdk-page__eventsList">
              {MOCK_EVENTS.map((ev) => (
                <button key={ev.id} type="button" className="camera-sdk-page__eventItem" onClick={() => {}}>
                  <div className="camera-sdk-page__eventTime">{ev.time}</div>
                  <img className="camera-sdk-page__eventThumb" src={ev.thumb} alt="" loading="lazy" />
                  <div className="camera-sdk-page__eventLabel">{ev.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {bottomTab === "control" && (
          <section className="camera-sdk-page__control">
            <div className="camera-sdk-page__panelTitle camera-sdk-page__panelTitle--control">Điều khiển</div>
            <div className="camera-sdk-page__controlPills">
              <button
                type="button"
                className={`camera-sdk-page__controlPill${controlMode === "save" ? " camera-sdk-page__controlPill--active" : ""}`}
                onClick={() => setControlMode("save")}
              >
                <SaveOutlined />
                <span>Lưu góc quay</span>
              </button>
              <button
                type="button"
                className={`camera-sdk-page__controlPill${controlMode === "patrol" ? " camera-sdk-page__controlPill--active" : ""}`}
                onClick={() => setControlMode("patrol")}
              >
                <PlayCircleOutlined />
                <span>Tuần tra</span>
              </button>
              <button
                type="button"
                className={`camera-sdk-page__controlPill${controlMode === "saved" ? " camera-sdk-page__controlPill--active" : ""}`}
                onClick={() => setControlMode("saved")}
              >
                <DownloadOutlined />
                <span>Góc đã lưu</span>
              </button>
            </div>

            <div className="camera-sdk-page__controlPanel" aria-live="polite">
              {controlMode === "save" && (
                <>
                  <div className="camera-sdk-page__poseRow">
                    <div className="camera-sdk-page__poseLabel">Góc hiện tại (mock)</div>
                    <div className="camera-sdk-page__poseValue">
                      yaw: {Math.round(currentPose.yaw)}°, pitch: {Math.round(currentPose.pitch)}°
                    </div>
                  </div>
                  <div className="camera-sdk-page__controlBtnsRow">
                    <button type="button" className="camera-sdk-page__controlPrimary" onClick={onSaveCurrentPose}>
                      Lưu góc quay
                    </button>
                    <button type="button" className="camera-sdk-page__controlGhost" onClick={() => setCurrentPose(makeMockCurrentPose(cameraId))}>
                      Làm mới góc (mock)
                    </button>
                  </div>
                </>
              )}

              {controlMode === "patrol" && (
                <>
                  <div className="camera-sdk-page__poseRow">
                    <div className="camera-sdk-page__poseLabel">Danh sách góc đã lưu</div>
                    <div className="camera-sdk-page__poseValue">{savedPoses.length}</div>
                  </div>
                  <div className="camera-sdk-page__controlBtnsRow">
                    {!patrolRunning ? (
                      <button type="button" className="camera-sdk-page__controlPrimary" onClick={startPatrol}>
                        Bắt đầu tuần tra
                      </button>
                    ) : (
                      <button type="button" className="camera-sdk-page__controlPrimary" onClick={stopPatrol}>
                        Dừng tuần tra
                      </button>
                    )}
                    <button
                      type="button"
                      className="camera-sdk-page__controlGhost"
                      onClick={() => {
                        setPatrolRunning(false);
                        if (patrolTimerRef.current) window.clearInterval(patrolTimerRef.current);
                        patrolTimerRef.current = null;
                        setGridHint("Đã dừng (mock) và giữ nguyên góc hiện tại.");
                        addMockAutoHide(setGridHint, 1200);
                      }}
                    >
                      <PauseCircleOutlined />
                      Reset
                    </button>
                  </div>
                </>
              )}

              {controlMode === "saved" && (
                <>
                  {savedPoses.length === 0 ? (
                    <div className="camera-sdk-page__emptyState">Chưa có góc đã lưu. Hãy lưu trước.</div>
                  ) : (
                    <div className="camera-sdk-page__savedList">
                      {savedPoses.map((p, idx) => (
                        <button
                          key={`${p.savedAt}-${idx}`}
                          type="button"
                          className="camera-sdk-page__savedItem"
                          onClick={() => onApplySavedPose(p)}
                        >
                          <div className="camera-sdk-page__savedMeta">
                            <div className="camera-sdk-page__savedAngle">
                              yaw {Math.round(p.yaw)}° / pitch {Math.round(p.pitch)}°
                            </div>
                            <div className="camera-sdk-page__savedTime">{new Date(p.savedAt).toLocaleString()}</div>
                          </div>
                          <div className="camera-sdk-page__savedApply">Áp dụng</div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {bottomTab === "status" && (
              <section className="camera-sdk-page__featurePanel" aria-live="polite">
            <div className="camera-sdk-page__featureHeader">
              <span className="camera-sdk-page__featureBack">‹</span>
                  <span className="camera-sdk-page__featureTitle">Tính năng</span>
            </div>
            <div className="camera-sdk-page__featureGrid">
              <button type="button" className="camera-sdk-page__featureTile camera-sdk-page__featureTile--plus" onClick={() => addMockToast(setGridHint, "Thêm (mock)")}>
                <PlusOutlined />
              </button>
              <button type="button" className="camera-sdk-page__featureTile" onClick={() => addMockToast(setGridHint, "Trống (mock)")} />
              <button type="button" className="camera-sdk-page__featureTile" onClick={() => addMockToast(setGridHint, "Trống (mock)")} />
              <button type="button" className="camera-sdk-page__featureTile" onClick={() => addMockToast(setGridHint, "Trống (mock)")} />
            </div>
            {!!gridHint && <div className="camera-sdk-page__featureHint">{gridHint}</div>}
          </section>
        )}

        {bottomTab === "service" && (
          <div className="camera-sdk-page__emptyState">Dịch vụ đang mock (chưa gắn API).</div>
        )}
      </section>

      <nav className="camera-sdk-page__bottomTabs" aria-label="Camera panel tabs">
        <button type="button" className={`camera-sdk-page__bottomTab${bottomTab === "events" ? " camera-sdk-page__bottomTab--active" : ""}`} onClick={() => setBottomTab("events")}>
          Sự kiện
        </button>
        <button type="button" className={`camera-sdk-page__bottomTab${bottomTab === "control" ? " camera-sdk-page__bottomTab--active" : ""}`} onClick={() => setBottomTab("control")}>
          Điều khiển
        </button>
        <button type="button" className={`camera-sdk-page__bottomTab${bottomTab === "status" ? " camera-sdk-page__bottomTab--active" : ""}`} onClick={() => setBottomTab("status")}>
          Tính năng
        </button>
        <button type="button" className="camera-sdk-page__bottomTab" onClick={() => setBottomTab("service")}>
          Dịch vụ
        </button>
      </nav>
    </div>
  );
};

function addMockToast(setHint: (v: string) => void, text: string) {
  setHint(text);
  // Demo: auto-hide
  window.setTimeout(() => setHint(""), 1200);
}

function addMockAutoHide(setHint: (v: string) => void, ms: number) {
  window.setTimeout(() => setHint(""), ms);
}

