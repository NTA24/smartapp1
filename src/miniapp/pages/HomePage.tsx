import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CloudOutlined, BulbOutlined, MenuOutlined, SettingOutlined, SearchOutlined } from "@ant-design/icons";
import { DeviceCard } from "../components/DeviceCard";

export const HomePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page-home">
      <div className="user-id" id="user-id">6838309456-</div>
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
