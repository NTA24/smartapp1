import React, { useState, useMemo, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { CloudOutlined, BulbOutlined, MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { HomeCameraCard } from "../components/HomeCameraCard";
import { useMiniApp } from "../context/MiniAppContext";
import { useAuthLoading } from "../hooks/useAuthLoading";
import { useCameraSdkLoading } from "../hooks/useCameraSdkLoading";
import { addLog } from "../lib/debugLog";
import { CAMERA_PREVIEW_IMAGES } from "../lib/cameraPreview";
import { isHomeCameraDevice, labelForCameraUid, labelForHomeDevice } from "../lib/homeCamera";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import { runMakeCallFromCameraFlow } from "../utils/cameraFlow";

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userPhone, devices, refreshDevices, cameraToken, cameraUIDs } = useMiniApp();
  const loadingUser = useAuthLoading(userPhone);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  const { loadingUid, runWithLoading } = useCameraSdkLoading();
  const [sdkBanner, setSdkBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  const onThumbError = useCallback((key: string) => {
    setBrokenThumbs((prev) => ({ ...prev, [key]: true }));
  }, []);

  const cameraUidSet = useMemo(
    () => new Set(cameraUIDs.map((u) => String(u).trim()).filter(Boolean)),
    [cameraUIDs],
  );

  const token = String(cameraToken ?? "").trim();
  const hasToken = Boolean(token);

  const openHomeCamera = async (uid: string) => {
    if (!hasToken) {
      setSdkBanner({ type: "err", text: "Chưa có cameraToken. Hãy đồng bộ đăng nhập (tab Camera) hoặc đăng nhập lại." });
      addLog("[HomePage] makeCallFromCamera — thiếu token");
      return;
    }
    setSdkBanner(null);
    addLog("[HomePage] makeCallFromCamera", { uid });
    try {
      await runMakeCallFromCameraFlow(token, [uid], "home-page-camera");
      setSdkBanner({ type: "ok", text: "Đã gọi makeCallFromCamera." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSdkBanner({ type: "err", text: msg });
      addLog("[HomePage] makeCallFromCamera lỗi", msg);
    }
  };

  const formatPhone = (phone: string) => {
    const raw = String(phone || "").trim();
    if (!raw) return "";

    let digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";

    // Bỏ mã quốc gia lặp để tránh dạng (+84) 84xxxx...
    while (digits.startsWith("84")) digits = digits.slice(2);
    // Dữ liệu nội địa thường bắt đầu bằng 0
    if (digits.startsWith("0")) digits = digits.slice(1);
    while (digits.startsWith("84")) digits = digits.slice(2);

    return `(+84) ${digits}`;
  };

  const userLabel = userPhone ? formatPhone(userPhone) : "…";

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await refreshDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  const renderDeviceRow = (d: SmartBuildingDeviceRecord, i: number, cameraIndex: number) => {
    const type = String(d.deviceType ?? d.device?.type ?? "").toLowerCase();
    const icon = type.includes("light") || type.includes("đèn") ? <BulbOutlined /> : <CloudOutlined />;
    const name =
      String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
      `Thiết bị ${i + 1}`;
    const id =
      String(d.deviceId ?? d.device?.id?.id ?? `${i + 1}`).trim() ||
      `${i + 1}`;

    if (isHomeCameraDevice(d, cameraUidSet)) {
      const thumb = CAMERA_PREVIEW_IMAGES[cameraIndex % CAMERA_PREVIEW_IMAGES.length];
      const thumbKey = `${id}-${thumb}`;
      const hideImg = Boolean(brokenThumbs[thumbKey]);
      const busy = loadingUid === id;
      return (
        <HomeCameraCard
          key={`cam-${id}`}
          label={labelForHomeDevice(d)}
          thumb={thumb}
          thumbKey={thumbKey}
          hideImg={hideImg}
          busy={busy}
          onThumbError={onThumbError}
          onOpen={() => void runWithLoading(id, () => openHomeCamera(id))}
        />
      );
    }

    return (
      <DeviceCard
        key={id}
        deviceId={id}
        name={name}
        meta={String(d.deviceType ?? d.device?.type ?? "Thiết bị")}
        statusLabel="Tắt"
        icon={icon}
        defaultOn={false}
      />
    );
  };

  return (
    <div className="home-page">
      {loadingUser && (
        <div className="miniapp-loading__overlay">
          <div className="miniapp-loading__spinner" />
          <div className="miniapp-loading__text">Đang tải thông tin...</div>
        </div>
      )}

      <div className="home-page__user-id" id="user-id">{userLabel}</div>
      <div className="home-page__tabs">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
          Smart Home
        </NavLink>
        <NavLink to="/shared" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Đã chia sẻ
        </NavLink>
        <button
          type="button"
          className="home-page__icon-menu"
          id="btn-menu"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
        >
          <MenuOutlined />
        </button>
      </div>
      <div
        className={`home-page__menu-dropdown ${menuOpen ? "open" : ""}`}
        id="home-menu"
        aria-hidden={!menuOpen}
      >
        <Link to="/" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          Smart Home
        </Link>
        <Link to="/shared" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          Đã chia sẻ
        </Link>
        <Link to="/nav-settings" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          <span>Cài đặt điều hướng</span>
          <span className="home-page__menu-icon">
            <SettingOutlined />
          </span>
        </Link>
        <Link to="/my-devices" className="home-page__menu-item" onClick={() => setMenuOpen(false)}>
          <span>Thiết bị của tôi</span>
          <span className="home-page__menu-icon">
            <SearchOutlined />
          </span>
        </Link>
      </div>
      <div
        className={`home-page__menu-overlay ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <div className="home-page__quick-actions">
        <Link to="/add-device" className="home-page__primary-btn">
          Thêm thiết bị
        </Link>
        <button
          type="button"
          onClick={handleRefreshDevices}
          disabled={refreshingDevices}
          className="home-page__secondary-btn"
        >
          {refreshingDevices ? "Đang làm mới..." : "Làm mới thiết bị"}
        </button>
      </div>

      {sdkBanner && (
        <div
          className={
            sdkBanner.type === "ok"
              ? "camera-page__banner camera-page__banner--ok home-page__sdk-banner"
              : "camera-page__banner camera-page__banner--err home-page__sdk-banner"
          }
        >
          {sdkBanner.text}
        </div>
      )}

      <div className="home-page__device-cards">
        {devices.length > 0 ? (
          (() => {
            let camIdx = 0;
            return devices.map((d, i) => {
              const isCam = isHomeCameraDevice(d, cameraUidSet);
              const idx = isCam ? camIdx++ : camIdx;
              return renderDeviceRow(d, i, idx);
            });
          })()
        ) : cameraUIDs.length > 0 ? (
          cameraUIDs.map((uid, idx) => {
            const id = String(uid).trim();
            const thumb = CAMERA_PREVIEW_IMAGES[idx % CAMERA_PREVIEW_IMAGES.length];
            const thumbKey = `${id}-${thumb}`;
            const hideImg = Boolean(brokenThumbs[thumbKey]);
            const busy = loadingUid === id;
            return (
              <HomeCameraCard
                key={id}
                label={labelForCameraUid(id, devices)}
                thumb={thumb}
                thumbKey={thumbKey}
                hideImg={hideImg}
                busy={busy}
                onThumbError={onThumbError}
                onOpen={() => void runWithLoading(id, () => openHomeCamera(id))}
              />
            );
          })
        ) : (
          <>
            <DeviceCard
              deviceId="1"
              name="Máy lọc không khí thông minh"
              meta="Thiết bị"
              statusLabel="Trung bình"
              icon={<CloudOutlined />}
              defaultOn={true}
            />
            <DeviceCard
              deviceId="2"
              name="Đèn thông minh"
              meta="Thiết bị"
              statusLabel="Tắt"
              icon={<BulbOutlined />}
              defaultOn={false}
            />
          </>
        )}
      </div>
      <div className="home-page__edit-wrap">
        <Link to="/edit-room" className="home-page__edit-btn">
          Chỉnh sửa
        </Link>
      </div>
    </div>
  );
};
