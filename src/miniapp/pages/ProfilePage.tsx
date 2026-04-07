import React from "react";
import { Typography } from "antd";
import { Link } from "react-router-dom";
import {
  PlusOutlined,
  UserOutlined,
  AudioOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  SettingOutlined,
  MessageOutlined,
  MobileOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useMiniApp } from "../context/MiniAppContext";
import { useAuthLoading } from "../hooks/useAuthLoading";
import { formatPhone } from "../utils/phone";

export const ProfilePage: React.FC = () => {
  const { userPhone } = useMiniApp();
  const loadingName = useAuthLoading(userPhone);
  const phoneDisplay = userPhone ? formatPhone(userPhone) : "Chưa có";

  return (
    <div className="profile-page">
      {loadingName && (
        <div className="miniapp-loading__overlay">
          <div className="miniapp-loading__spinner" />
          <div className="miniapp-loading__text">Đang tải thông tin...</div>
          <div className="miniapp-loading__subtext">Vui lòng chờ...</div>
        </div>
      )}

      <header className="profile-page__header-compact">
        <div className="profile-page__header-main">
          <Typography.Title level={4} className="profile-page__header-title" style={{ margin: 0 }}>
            <Link to="/account" className="profile-page__account-title-link">
              Nhà của tôi
            </Link>
          </Typography.Title>
          <Typography.Text type="secondary" className="profile-page__header-kicker">
            Quản lý tài khoản
          </Typography.Text>
        </div>
        <div className="profile-page__phone-pill" title="Số điện thoại">
          <MobileOutlined className="profile-page__phone-pill-icon" aria-hidden />
          <span className="profile-page__phone-pill-value">{phoneDisplay}</span>
        </div>
      </header>

      <div className="profile-page__stat-grid" role="group" aria-label="Tóm tắt">
        <div className="profile-page__stat-card">
          <span className="profile-page__stat-value">2</span>
          <span className="profile-page__stat-label">Gia đình</span>
        </div>
        <div className="profile-page__stat-card">
          <span className="profile-page__stat-value">1</span>
          <span className="profile-page__stat-label">Thiết bị</span>
        </div>
      </div>

      <div className="profile-page__card-block profile-page__card-block--members">
        <div className="profile-page__card-block-head">
          <div>
            <Typography.Title level={5} className="profile-page__card-title" style={{ marginBottom: 4 }}>
              Không gian nhà
            </Typography.Title>
            <Typography.Text type="secondary" className="profile-page__card-desc" style={{ margin: 0 }}>
              Thành viên (1)
            </Typography.Text>
          </div>
          <div className="profile-page__card-actions">
            <button type="button" className="profile-page__icon-btn" aria-label="Thêm thành viên">
              <PlusOutlined />
            </button>
            <Link to="/account" className="profile-page__icon-btn" aria-label="Quản lý gia đình">
              <UserOutlined />
            </Link>
          </div>
        </div>
        <div className="profile-page__member-row">
          <div className="profile-page__member-avatar" aria-hidden>
            <UserOutlined />
          </div>
          <div className="profile-page__member-meta">
            <div className="profile-page__member-name">Bạn</div>
            <div className="profile-page__member-role">Chủ nhà</div>
          </div>
          <div className="profile-page__member-status">
            <CheckCircleFilled className="profile-page__member-status-icon" aria-hidden />
            <span>Hoạt động</span>
          </div>
        </div>
      </div>

      <Link to="/voice" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--blue">
          <AudioOutlined />
        </div>
        <span className="profile-page__list-text">Trợ lý thoại</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/devices" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--green">
          <DesktopOutlined />
        </div>
        <span className="profile-page__list-text">Quản lý nhiều thiết bị</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/hub" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--green">
          <AppstoreOutlined />
        </div>
        <span className="profile-page__list-text">Hub & cổng</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>
      <Link to="/settings" className="profile-page__list-item">
        <div className="profile-page__list-icon profile-page__list-icon--gray">
          <SettingOutlined />
        </div>
        <span className="profile-page__list-text">Cài đặt khác</span>
        <span className="profile-page__list-arrow">›</span>
      </Link>

      <Link to="/help" className="profile-page__list-item profile-page__list-item--help">
        <div className="profile-page__list-icon profile-page__list-icon--help">
          <MessageOutlined />
        </div>
        <span className="profile-page__list-text profile-page__list-text--stack">
          <span className="profile-page__list-text-primary">Trợ giúp & phản hồi</span>
          <span className="profile-page__list-text-sub">Câu hỏi thường gặp, gửi ý kiến</span>
        </span>
        <span className="profile-page__list-arrow">›</span>
      </Link>

      {import.meta.env.DEV && (
        <>
          <Link to="/dev/ws-human" className="profile-page__list-item profile-page__list-item--dev">
            <div className="profile-page__list-icon profile-page__list-icon--gray">⌗</div>
            <span className="profile-page__list-text">Lab WS human_sensor (dev)</span>
            <span className="profile-page__list-arrow">›</span>
          </Link>
          <Link to="/dev/ws-plug" className="profile-page__list-item profile-page__list-item--dev">
            <div className="profile-page__list-icon profile-page__list-icon--gray">⌗</div>
            <span className="profile-page__list-text">Lab WS đèn hành lang (state-plug)</span>
            <span className="profile-page__list-arrow">›</span>
          </Link>
        </>
      )}
    </div>
  );
};
