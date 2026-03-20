import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMiniApp } from "../context/MiniAppContext";
import { getAuthCode } from "../services/auth";
import { getUserInfoByAuthCode } from "../../api/authentication/getUserInfoByAuthCode";
import { PlusOutlined, UserOutlined, AudioOutlined, DesktopOutlined, AppstoreOutlined, SettingOutlined, MessageOutlined } from "@ant-design/icons";

export const ProfilePage: React.FC = () => {
  const { userPhone, authModalVisible } = useMiniApp();
  const [displayName, setDisplayName] = useState<string>("");
  const [loadingName, setLoadingName] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const didLoadRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Nếu đã load rồi thì không gọi lại.
      if (didLoadRef.current) return;
      // Chỉ gọi API sau khi user đã bấm "Cho phép"
      if (authModalVisible) return;

      didLoadRef.current = true;
      setLoadingName(true);
      setLoadError("");

      try {
        // Ưu tiên scope theo doc (có username + email)
        const auth = await getAuthCode(["USER_NAME", "USER_EMAIL"]);
        const info = await getUserInfoByAuthCode(auth.authCode);
        const name = String(info.username || info.fullName || "");
        if (name) setDisplayName(name);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (cancelled) return;
        setLoadingName(false);
      }
    };

    if (authModalVisible) {
      // Khi modal auth đang hiện, vẫn hiển thị loading overlay.
      setLoadingName(true);
    } else {
      void run();
    }

    return () => {
      cancelled = true;
    };
  }, [authModalVisible]);

  const finalName = displayName || "6838309456";

  return (
    <div className="page-profile">
      {loadingName && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.78)",
            zIndex: 9997,
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
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2332" }}>
            Đang tải thông tin...
          </div>
          {loadError && (
            <div style={{ fontSize: 12, color: "#c62828", padding: "0 20px", textAlign: "center" }}>
              {loadError}
            </div>
          )}
        </div>
      )}

      <div className="account-section">
        <div className="account-id">
          <Link to="/account">{finalName}</Link> <span>›</span>
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
        <div className="card-title">{finalName}</div>
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
