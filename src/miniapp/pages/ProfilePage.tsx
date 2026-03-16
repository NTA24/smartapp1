import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMiniApp } from "../context/MiniAppContext";
import { storeGet } from "../lib/store";
import { STORAGE_KEY_APP_ID } from "../lib/config";
import { loginMiniApp, getPhoneFromLoginResult, isWindVaneReady } from "../services/auth";
import { PlusOutlined, UserOutlined, AudioOutlined, DesktopOutlined, AppstoreOutlined, SettingOutlined, MessageOutlined } from "@ant-design/icons";

export const ProfilePage: React.FC = () => {
  const { userPhone, setUserPhone, appId, saveAppId } = useMiniApp();
  const [appIdInput, setAppIdInput] = useState(() => storeGet(STORAGE_KEY_APP_ID) ?? appId ?? "");
  const [checkResult, setCheckResult] = useState("");
  const [checkError, setCheckError] = useState(false);
  const [callPermissionResult, setCallPermissionResult] = useState("");

  const handleCopyPhone = () => {
    if (!userPhone) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(userPhone).catch(() => {});
    } else {
      try {
        const temp = document.createElement("input");
        temp.value = userPhone;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      } catch {}
    }
    alert("Đã sao chép số điện thoại");
  };

  const handleSaveAppId = () => {
    const val = appIdInput.trim();
    saveAppId(val);
    setCheckResult(val ? "Đã lưu App ID. Bấm \"Kiểm tra kết nối / Lấy số ĐT\" để thử lại." : "Đã xóa App ID đã lưu.");
    setCheckError(false);
  };

  const handleCheckApi = async () => {
    if (!isWindVaneReady()) {
      setCheckResult("Vui lòng mở app từ Super App (Tammi) để lấy số điện thoại.");
      setCheckError(true);
      return;
    }
    setCheckResult("Đang kiểm tra...");
    setCheckError(false);
    try {
      const data = await loginMiniApp();
      const phone = getPhoneFromLoginResult(data);
      if (phone) {
        setUserPhone(phone);
        setCheckResult("OK. Số ĐT: " + phone);
      } else {
        setCheckResult("Backend OK nhưng không có số. Chi tiết: " + JSON.stringify(data?.data ?? {}).slice(0, 300));
        setCheckError(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendlyMsg = /windvane|chưa sẵn sàng/i.test(msg)
        ? "Vui lòng mở app từ Super App (Tammi) để lấy số điện thoại."
        : msg;
      setCheckResult("Lỗi: " + friendlyMsg);
      setCheckError(true);
    }
  };

  const handleRequestCallPermission = async () => {
    setCallPermissionResult("Đang xin quyền gọi...");
    try {
      const P = typeof window !== "undefined" ? window.MiniAppPermissions : null;
      if (P?.authorize) {
        await P.authorize("call");
        setCallPermissionResult("Call permission granted successfully");
      } else {
        setCallPermissionResult("MiniAppPermissions not loaded");
      }
    } catch {
      setCallPermissionResult("Permission denied. Please grant call permission in device settings.");
    }
  };

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
            <button type="button" className="account-phone-copy" onClick={handleCopyPhone}>Sao chép</button>
          </div>
        </div>
        <div className="profile-appid-row">
          <label className="profile-appid-label">App ID (Mini App)</label>
          <div className="profile-appid-input-row">
            <input
              type="text"
              className="profile-appid-input"
              placeholder="Dán App ID từ Tammi/Super App"
              value={appIdInput}
              onChange={(e) => setAppIdInput(e.target.value)}
            />
            <button type="button" className="profile-appid-save" onClick={handleSaveAppId}>Lưu</button>
          </div>
          <div className="profile-appid-hint">
            Nếu appId rỗng: lấy App ID từ console Tammi → dán vào ô trên → Lưu → bấm &quot;Kiểm tra kết nối / Lấy số ĐT&quot;
          </div>
        </div>
        <button type="button" className="profile-check-api-btn" onClick={handleCheckApi}>
          Kiểm tra kết nối / Lấy số ĐT
        </button>
        <div
          className="profile-check-result"
          style={{
            display: checkResult ? "block" : "none",
            marginTop: 8,
            padding: "8px 12px",
            fontSize: 13,
            borderRadius: 8,
            background: checkError ? "#ffebee" : "#e8f5e9",
            color: checkError ? "#c62828" : "#2e7d32",
          }}
        >
          {checkResult}
        </div>
        <div className="profile-permission-row">
          <button type="button" className="profile-check-api-btn" onClick={handleRequestCallPermission}>
            Xin quyền gọi (call)
          </button>
          {callPermissionResult && (
            <div className="profile-permission-result" style={{ marginTop: 8, padding: "8px 12px", fontSize: 13 }}>
              {callPermissionResult}
            </div>
          )}
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
