import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";
import { createAndStoreDevice } from "../services/deviceSync";
import { useMiniApp } from "../context/MiniAppContext";

function getDefaultBody() {
  return {
    name: `DEVICE_${Date.now()}`,
    type: "Temperature Sensor",
    label: "Room Sensor",
  };
}

export const AddDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { userPhone, refreshDevices } = useMiniApp();
  const [deviceBodyText, setDeviceBodyText] = useState(() => JSON.stringify(getDefaultBody(), null, 2));
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const username = useMemo(() => {
    const raw = String(userPhone || "").trim();
    if (!raw) return "";
    return raw.startsWith("+") ? raw.replace(/[^\d]/g, "") : raw;
  }, [userPhone]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!username) {
      setErrorText("Chưa có username/số điện thoại từ auth.");
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(deviceBodyText) as Record<string, unknown>;
    } catch {
      setErrorText("Payload JSON không hợp lệ.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await createAndStoreDevice(username, parsed);
      await refreshDevices();
      const id = String(saved.deviceId ?? saved.device?.id?.id ?? "");
      const name = String(saved.name ?? saved.device?.name ?? "");
      setSuccessText(`Đã tạo và lưu thành công. ${name ? `Tên: ${name}.` : ""} ${id ? `ID: ${id}` : ""}`.trim());
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-profile-sub">
      <div className="sub-page-header">
        <Link to="/" className="back btn-back">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="sub-page-title">Thêm thiết bị</h1>
      </div>

      <div className="profile-sub-body">
        <div style={{ color: "#637083", marginBottom: 10 }}>
          Username: <strong>{username || "Chưa có"}</strong>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ fontWeight: 600, color: "#1a2332" }}>Payload gửi NewGen (Step 6)</label>
          <textarea
            value={deviceBodyText}
            onChange={(e) => setDeviceBodyText(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: 12,
              border: "1px solid #d9e1ee",
              padding: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: 12,
              background: "#fff",
              color: "#1a2332",
            }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 42,
              borderRadius: 12,
              border: "none",
              background: "#00acc1",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {submitting ? "Đang tạo thiết bị..." : "Tạo ở NewGen + Lưu SmartBuilding"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setErrorText("");
              setSuccessText("");
              try {
                await refreshDevices();
                setSuccessText("Đã đồng bộ danh sách thiết bị từ SmartBuilding.");
              } catch (err) {
                setErrorText(err instanceof Error ? err.message : String(err));
              }
            }}
            style={{
              height: 40,
              borderRadius: 12,
              border: "1px solid #cfd7e3",
              background: "#fff",
              color: "#1a2332",
              fontWeight: 600,
            }}
          >
            Chỉ GET danh sách (Step X)
          </button>
        </form>

        {errorText && (
          <div style={{ marginTop: 12, color: "#d93025", fontWeight: 600 }}>
            {errorText}
          </div>
        )}
        {successText && (
          <div style={{ marginTop: 12, color: "#128a57", fontWeight: 600 }}>
            {successText}
          </div>
        )}

        <div style={{ marginTop: 12, color: "#637083", fontSize: 12 }}>
          Sau mỗi lần tạo device, app tự gọi Step 7 để lưu về SmartBuilding theo đúng quy trình.
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              height: 36,
              borderRadius: 10,
              border: "1px solid #cfd7e3",
              background: "#f9fbff",
              color: "#1a2332",
              padding: "0 12px",
              fontWeight: 600,
            }}
          >
            Về Smart Home
          </button>
        </div>
      </div>
    </div>
  );
};

