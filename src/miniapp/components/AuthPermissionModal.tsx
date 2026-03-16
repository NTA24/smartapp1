import React from "react";
import { useMiniApp } from "../context/MiniAppContext";

export const AuthPermissionModal: React.FC = () => {
  const { authModalVisible, setAuthModalVisible, requestAuthAndPhone } = useMiniApp();

  const handleAllow = () => {
    setAuthModalVisible(false);
    requestAuthAndPhone();
  };

  if (!authModalVisible) return null;

  return (
    <div
      className="auth-permission-overlay"
      id="auth-permission-overlay"
      aria-hidden="false"
    >
      <div className="auth-permission-modal" role="dialog" aria-labelledby="auth-permission-title">
        <button
          type="button"
          className="auth-permission-close"
          aria-label="Đóng"
          onClick={() => setAuthModalVisible(false)}
        >
          ×
        </button>
        <div className="auth-permission-head">
          <div className="auth-permission-from">
            <span className="auth-permission-logo auth-permission-logo-tammi">Tammi</span>
          </div>
          <span className="auth-permission-arrow">→</span>
          <div className="auth-permission-to">
            <span className="auth-permission-logo auth-permission-logo-app">Smart Home</span>
          </div>
        </div>
        <h2 className="auth-permission-title" id="auth-permission-title">
          Cho phép ứng dụng Smart Home truy cập thông tin của bạn
        </h2>
        <ul className="auth-permission-list">
          <li className="auth-permission-item">
            <span className="auth-permission-item-icon" aria-hidden>👤</span>
            <span className="auth-permission-item-label">Tên người dùng</span>
            <span className="auth-permission-toggle auth-permission-toggle-on">Bật</span>
          </li>
          <li className="auth-permission-item">
            <span className="auth-permission-item-icon" aria-hidden>📱</span>
            <span className="auth-permission-item-label">Số điện thoại đăng nhập Tammi</span>
            <span className="auth-permission-toggle auth-permission-toggle-on">Bật</span>
          </li>
        </ul>
        <div className="auth-permission-actions">
          <button
            type="button"
            className="auth-permission-btn auth-permission-deny"
            onClick={() => setAuthModalVisible(false)}
          >
            Từ chối
          </button>
          <button
            type="button"
            className="auth-permission-btn auth-permission-allow"
            onClick={handleAllow}
          >
            Cho phép
          </button>
        </div>
      </div>
    </div>
  );
};
