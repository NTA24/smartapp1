import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CloudOutlined, BulbOutlined, MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";
import { useMiniApp } from "../context/MiniAppContext";

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userPhone } = useMiniApp();
  const [loadingUser, setLoadingUser] = useState(true);

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
    // Nếu backend đã trả dạng quốc tế (+xx...) thì giữ nguyên
    if (raw.startsWith("+")) return raw;
    // Chỉ giữ số
    let digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    // VN số thường bắt đầu bằng 0
    if (digits.startsWith("0")) digits = digits.slice(1);
    return `(+84) ${digits}`;
  };

  const userLabel = userPhone ? formatPhone(userPhone) : "…";

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
      <div className="home-device-cards">
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
      </div>
      <div className="edit-wrap">
        <Link to="/edit-room" className="btn-edit">Chỉnh sửa</Link>
      </div>
    </div>
  );
};
