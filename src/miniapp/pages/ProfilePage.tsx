import React from "react";
import { Link } from "react-router-dom";
import { useMiniApp } from "../context/MiniAppContext";
import { PlusOutlined, UserOutlined, AudioOutlined, DesktopOutlined, AppstoreOutlined, SettingOutlined, MessageOutlined } from "@ant-design/icons";
import { useAuthLoading } from "../hooks/useAuthLoading";

export const ProfilePage: React.FC = () => {
  const { userPhone } = useMiniApp();
  const loadingName = useAuthLoading(userPhone);

  const formatPhone = (phone: string) => {
    const raw = String(phone || "").trim();
    if (!raw) return "";

    let digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    while (digits.startsWith("84")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    while (digits.startsWith("84")) digits = digits.slice(2);

    return `(+84) ${digits}`;
  };

  const finalName = userPhone ? formatPhone(userPhone) : "";

  return (
    <div className="profile-page">
      {loadingName && (
        <div className="miniapp-loading__overlay">
          <div className="miniapp-loading__spinner" />
          <div className="miniapp-loading__text">Đang tải thông tin...</div>
          <div className="miniapp-loading__subtext">Vui lòng chờ...</div>
        </div>
      )}

      <div className="profile-page__account-section">
        <div className="profile-page__account-id">
          <Link to="/account">{finalName || "Chưa có"}</Link>
        </div>
        <div className="profile-page__account-sub">Quản lý tài khoản</div>
        <div className="profile-page__account-phone">
          <span className="profile-page__account-phone-label">Số điện thoại</span>
          <div className="profile-page__account-phone-value">
            <span className="profile-page__account-phone-number">{userPhone ? formatPhone(userPhone) : "Chưa có"}</span>
          </div>
        </div>
        <div className="profile-page__tags">
          <span className="profile-page__tag">2 gia đình</span>
          <span className="profile-page__tag">1 thiết bị</span>
        </div>
      </div>
      <div className="profile-page__card-block">
        <div className="profile-page__card-title">{finalName || "Chưa có"}</div>
        <div className="profile-page__card-desc">Thành viên trong gia đình(1)</div>
        <div className="profile-page__card-actions">
          <button type="button" className="profile-page__icon-btn" aria-label="Thêm thành viên">
            <PlusOutlined />
          </button>
          <Link to="/account" className="profile-page__icon-btn" aria-label="Quản lý gia đình">
            <UserOutlined />
          </Link>
        </div>
      </div>
      <Link to="/voice" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--blue"><AudioOutlined /></div>
        <span className="profile-page__list-text">Trợ lý thoại</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/devices" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--green"><DesktopOutlined /></div>
        <span className="profile-page__list-text">Quản lý nhiều thiết bị</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/hub" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--green"><AppstoreOutlined /></div>
        <span className="profile-page__list-text">Hub & cổng</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/settings" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--gray"><SettingOutlined /></div>
        <span className="profile-page__list-text">Cài đặt khác</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <div className="profile-page__card-block profile-page__help-card">
        <Link to="/help" className="profile-page__list-item profile-page__help-item">
          <div className="profile-page__list-icon profile-page__list-icon--blue"><MessageOutlined /></div>
          <span className="profile-page__list-text">Trợ giúp và phản hồi</span>
          <span className="profile-page__list-arrow">›</span>
        </Link>
        {import.meta.env.DEV && (
          <>
            <Link to="/dev/ws-human" className="profile-page__list-item profile-page__help-item">
              <div className="profile-page__list-icon profile-page__list-icon--gray">⌗</div>
              <span className="profile-page__list-text">Lab WS human_sensor (dev)</span>
              <span className="profile-page__list-arrow">›</span>
            </Link>
            <Link to="/dev/ws-plug" className="profile-page__list-item profile-page__help-item">
              <div className="profile-page__list-icon profile-page__list-icon--gray">⌗</div>
              <span className="profile-page__list-text">Lab WS đèn hành lang (state-plug)</span>
              <span className="profile-page__list-arrow">›</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
