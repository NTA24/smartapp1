import React from "react";
import { Link } from "react-router-dom";
import { useMiniApp } from "../context/MiniAppContext";
import { PlusOutlined, UserOutlined, AudioOutlined, DesktopOutlined, AppstoreOutlined, SettingOutlined, MessageOutlined } from "@ant-design/icons";

export const ProfilePage: React.FC = () => {
  const { userPhone } = useMiniApp();

  return (
    <div className="page-profile">
      <div className="account-section">
        <div className="account-id">
          <Link to="/account">6838309456</Link> <span>›</span>
        </div>
        <div className="account-sub">Quản lý tài khoản</div>
        <div className="account-phone">
          <span className="account-phone-label">Số điện thoại</span>
          <div className="account-phone-value">
            <span className="account-phone-number">{userPhone || "Chưa có"}</span>
          </div>
        </div>
        <div className="tags">
          <span className="tag">2 gia đình</span>
          <span className="tag">1 thiết bị</span>
        </div>
      </div>
      <div className="card-block">
        <div className="card-title">6838309456</div>
        <div className="card-desc">Thành viên trong gia đình(1)</div>
        <div className="card-actions">
          <button type="button" className="icon-btn" aria-label="Thêm thành viên">
            <PlusOutlined />
          </button>
          <Link to="/account" className="icon-btn" aria-label="Quản lý gia đình">
            <UserOutlined />
          </Link>
        </div>
      </div>
      <Link to="/voice" className="list-item">
        <div className="list-icon blue"><AudioOutlined /></div>
        <span className="list-text">Trợ lý thoại</span>
        <span className="list-arrow">›</span>
      </Link>
      <Link to="/devices" className="list-item">
        <div className="list-icon green"><DesktopOutlined /></div>
        <span className="list-text">Quản lý nhiều thiết bị</span>
        <span className="list-arrow">›</span>
      </Link>
      <Link to="/hub" className="list-item">
        <div className="list-icon green"><AppstoreOutlined /></div>
        <span className="list-text">Hub & cổng</span>
        <span className="list-arrow">›</span>
      </Link>
      <Link to="/settings" className="list-item">
        <div className="list-icon gray"><SettingOutlined /></div>
        <span className="list-text">Cài đặt khác</span>
        <span className="list-arrow">›</span>
      </Link>
      <div className="card-block" style={{ marginTop: 16 }}>
        <Link to="/help" className="list-item" style={{ paddingLeft: 0 }}>
          <div className="list-icon blue"><MessageOutlined /></div>
          <span className="list-text">Trợ giúp và phản hồi</span>
          <span className="list-arrow">›</span>
        </Link>
      </div>
    </div>
  );
};
