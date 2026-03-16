import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BellOutlined, PlusOutlined } from "@ant-design/icons";

export const StatusBar: React.FC = () => {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="status-bar">
        <div className="status-icons">
          <button
            type="button"
            className="icon-ai status-icon-btn"
            aria-label="Thông báo"
            title="Thông báo"
            onClick={() => { setNotifOpen(true); }}
          >
            <BellOutlined />
          </button>
          <button
            type="button"
            className="icon-ai status-icon-btn"
            aria-label="Thêm"
            title="Thêm"
            onClick={() => { setAddMenuOpen(true); }}
          >
            <PlusOutlined />
          </button>
        </div>
      </header>

      <div
        className="notification-panel"
        id="notification-panel"
        aria-hidden={!notifOpen}
        style={{ display: notifOpen ? undefined : "none" }}
      >
        <div className="notification-panel-header">Thông báo</div>
        <div className="notification-panel-body">
          <p className="notification-empty">Chưa có thông báo mới</p>
        </div>
      </div>
      <div
        className="notification-overlay"
        aria-hidden={!notifOpen}
        onClick={() => setNotifOpen(false)}
        style={{ display: notifOpen ? undefined : "none" }}
      />

      <div
        className="add-menu"
        id="global-add-menu"
        aria-hidden={!addMenuOpen}
        style={{ display: addMenuOpen ? undefined : "none" }}
      >
        <Link to="/add-device" className="add-menu-item" onClick={() => setAddMenuOpen(false)}>Thêm thiết bị</Link>
        <Link to="/automation/scan" className="add-menu-item" onClick={() => setAddMenuOpen(false)}>Quét</Link>
        <Link to="/create-manual" className="add-menu-item" onClick={() => setAddMenuOpen(false)}>Điều khiển thủ công</Link>
        <Link to="/automation/setup" className="add-menu-item" onClick={() => setAddMenuOpen(false)}>Tự động hóa</Link>
      </div>
      <div
        className="add-menu-overlay"
        aria-hidden={!addMenuOpen}
        onClick={() => setAddMenuOpen(false)}
        style={{ display: addMenuOpen ? undefined : "none" }}
      />
    </>
  );
};
