import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CloudOutlined, BulbOutlined, MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { useMiniApp } from "../context/MiniAppContext";

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userPhone, devices, refreshDevices } = useMiniApp();
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshingDevices, setRefreshingDevices] = useState(false);

  useEffect(() => {
    setLoadingUser(!userPhone);

    if (!userPhone) {
      const t = window.setTimeout(() => {
        setLoadingUser(false);
      }, 15000);
      return () => window.clearTimeout(t);
    }
  }, [userPhone]);

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

  return (
    <div className="page-home">
      {loadingUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.78)",
            zIndex: 9997,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "3px solid rgba(0,0,0,0.12)",
              borderTopColor: "rgba(0,172,193,1)",
              animation: "zy-spin 0.9s linear infinite",
            }}
          />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2332" }}>Đang tải thông tin...</div>
        </div>
      )}

      <div className="user-id" id="user-id">{userLabel}</div>
      <div className="tabs">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
          Smart Home
        </NavLink>
        <NavLink to="/shared" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Đã chia sẻ
        </NavLink>
        <button
          type="button"
          className="icon-menu"
          id="btn-menu"
          aria-label="Menu"
          onClick={() => setMenuOpen(true)}
        >
          <MenuOutlined />
        </button>
      </div>
      <div
        className="menu-dropdown"
        id="home-menu"
        aria-hidden={!menuOpen}
        style={{ display: menuOpen ? undefined : "none" }}
      >
        <Link to="/" className="menu-item" onClick={() => setMenuOpen(false)}>Smart Home</Link>
        <Link to="/shared" className="menu-item" onClick={() => setMenuOpen(false)}>Đã chia sẻ</Link>
        <Link to="/nav-settings" className="menu-item" onClick={() => setMenuOpen(false)}>
          <span>Cài đặt điều hướng</span>
          <span className="menu-icon"><SettingOutlined /></span>
        </Link>
        <Link to="/my-devices" className="menu-item" onClick={() => setMenuOpen(false)}>
          <span>Thiết bị của tôi</span>
          <span className="menu-icon"><SearchOutlined /></span>
        </Link>
      </div>
      <div
        className="menu-overlay"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        style={{ display: menuOpen ? undefined : "none" }}
      />
      <div
        style={{
          display: "flex",
          gap: 10,
          margin: "10px 0 14px",
        }}
      >
        <Link
          to="/add-device"
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            background: "#00acc1",
            color: "#fff",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Thêm thiết bị
        </Link>
        <button
          type="button"
          onClick={handleRefreshDevices}
          disabled={refreshingDevices}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            border: "1px solid #cfd7e3",
            background: "#fff",
            color: "#1a2332",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {refreshingDevices ? "Đang làm mới..." : "Làm mới thiết bị"}
        </button>
      </div>
      <div className="home-device-cards">
        {devices.length > 0 ? (
          devices.map((d, i) => {
            const type = String(d.deviceType ?? d.device?.type ?? "").toLowerCase();
            const icon = type.includes("light") || type.includes("đèn") ? <BulbOutlined /> : <CloudOutlined />;
            const name =
              String(d.label ?? d.device?.label ?? d.name ?? d.device?.name ?? "").trim() ||
              `Thiết bị ${i + 1}`;
            const id =
              String(d.deviceId ?? d.device?.id?.id ?? `${i + 1}`).trim() ||
              `${i + 1}`;
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
      <div className="edit-wrap">
        <Link to="/edit-room" className="btn-edit">Chỉnh sửa</Link>
      </div>
    </div>
  );
};
