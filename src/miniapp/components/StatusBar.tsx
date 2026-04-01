import React, { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellOutlined, PlusOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
import { useMiniApp } from "../context/MiniAppContext";
import { addLog } from "../lib/debugLog";
import { isWindVaneReady, onWindVaneReady } from "../services/auth";
import { callMakeCallFromCamera, updateCameraFlowTrace } from "../utils/cameraFlow";

const DROPDOWN_NOTIFICATIONS: { id: string; title: string; desc?: string; icon: React.ReactNode }[] = [
  { id: "1", title: "Có cuộc gọi đến", desc: "Cuộc gọi từ camera / thiết bị", icon: <PhoneOutlined /> },
  { id: "2", title: "Cập nhật firmware", desc: "Có bản cập nhật cho thiết bị phòng khách", icon: <HomeOutlined /> },
];

export const StatusBar: React.FC = () => {
  const navigate = useNavigate();
  const { cameraToken, cameraUIDs } = useMiniApp();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [incomingCallOpen, setIncomingCallOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);

  const openIncomingCallDialog = () => {
    setNotifOpen(false);
    setIncomingCallOpen(true);
  };

  const closeIncomingCallDialog = useCallback(() => {
    setIncomingCallOpen(false);
  }, []);

  const onAcceptIncomingCall = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const token = String(cameraToken ?? "").trim();
      if (!token) {
        addLog("[incoming-call] Accept: chưa có cameraToken (cần auth /oauth/user-info)");
        closeIncomingCallDialog();
        return;
      }
      setAcceptLoading(true);
      try {
        await onWindVaneReady();
        if (!isWindVaneReady()) throw new Error("WindVane chưa sẵn sàng");
        updateCameraFlowTrace({
          jsapiStatus: "calling",
          jsapiCalledAt: new Date().toISOString(),
          source: "incoming-call-accept",
        });
        addLog("[incoming-call] gọi IOTPlatFormService.makeCallFromCamera (Accept)");
        await callMakeCallFromCamera(token, cameraUIDs);
        updateCameraFlowTrace({
          jsapiStatus: "success",
          jsapiResponseAt: new Date().toISOString(),
          source: "incoming-call-accept",
        });
        addLog("[incoming-call] makeCallFromCamera thành công");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog("[incoming-call] makeCallFromCamera lỗi:", msg);
        updateCameraFlowTrace({
          jsapiStatus: "error",
          jsapiError: msg,
          source: "incoming-call-accept",
        });
      } finally {
        setAcceptLoading(false);
        closeIncomingCallDialog();
        navigate("/zyapp", { replace: false });
        addLog("[incoming-call] điều hướng → /zyapp (sau Accept)");
      }
    },
    [cameraToken, cameraUIDs, closeIncomingCallDialog, navigate],
  );

  return (
    <>
      <header className="status-bar">
        <div className="status-icons">
          <button
            type="button"
            className="icon-ai status-icon-btn"
            aria-label="Thông báo"
            title="Thông báo"
            aria-expanded={notifOpen}
            onClick={() => {
              setNotifOpen((v) => !v);
            }}
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
        className={`notification-panel${notifOpen ? " open" : ""}`}
        id="notification-panel"
        aria-hidden={!notifOpen}
        role="dialog"
        aria-label="Danh sách thông báo"
      >
        <div className="notification-panel-header">Thông báo</div>
        <div className="notification-panel-body">
          <ul className="notification-dropdown-list">
            {DROPDOWN_NOTIFICATIONS.map((n, i) => (
              <li key={n.id}>
                {i === 0 ? (
                  <button
                    type="button"
                    className={`notification-dropdown-item notification-dropdown-item--button${i === 0 ? " notification-dropdown-item--highlight" : ""}`}
                    onClick={openIncomingCallDialog}
                  >
                    <span className="notification-dropdown-item__icon" aria-hidden>
                      {n.icon}
                    </span>
                    <div className="notification-dropdown-item__text">
                      <div className="notification-dropdown-item__title">{n.title}</div>
                      {n.desc ? <div className="notification-dropdown-item__desc">{n.desc}</div> : null}
                    </div>
                  </button>
                ) : (
                  <div className="notification-dropdown-item">
                    <span className="notification-dropdown-item__icon" aria-hidden>
                      {n.icon}
                    </span>
                    <div className="notification-dropdown-item__text">
                      <div className="notification-dropdown-item__title">{n.title}</div>
                      {n.desc ? <div className="notification-dropdown-item__desc">{n.desc}</div> : null}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className={`notification-overlay${notifOpen ? " open" : ""}`}
        aria-hidden={!notifOpen}
        onClick={() => setNotifOpen(false)}
      />

      {incomingCallOpen ? (
        <>
          <div
            className="incoming-call-dialog__backdrop"
            aria-hidden="true"
            onClick={closeIncomingCallDialog}
          />
          <div
            className="incoming-call-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-call-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="incoming-call-dialog__ring" aria-hidden />
            <div className="incoming-call-dialog__icon-wrap">
              <PhoneOutlined className="incoming-call-dialog__icon" />
            </div>
            <h2 id="incoming-call-dialog-title" className="incoming-call-dialog__title">
              Cuộc gọi đến
            </h2>
            <p className="incoming-call-dialog__subtitle">Camera / thiết bị đang gọi</p>
            <div className="incoming-call-dialog__actions">
              <button
                type="button"
                className="incoming-call-dialog__btn incoming-call-dialog__btn--decline"
                disabled={acceptLoading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeIncomingCallDialog();
                }}
              >
                Decline
              </button>
              <button
                type="button"
                className="incoming-call-dialog__btn incoming-call-dialog__btn--accept"
                disabled={acceptLoading}
                onClick={(e) => void onAcceptIncomingCall(e)}
              >
                {acceptLoading ? "…" : "Accept"}
              </button>
            </div>
          </div>
        </>
      ) : null}

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
