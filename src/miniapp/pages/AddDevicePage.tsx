import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { createAndStoreDevice } from "../services/deviceSync";
import { useMiniApp } from "../context/MiniAppContext";

type DeviceTemplate = {
  key: string;
  title: string;
  type: string;
  labelPrefix: string;
};

const DEVICE_TEMPLATES: DeviceTemplate[] = [
  { key: "temp", title: "Cảm biến nhiệt độ", type: "Temperature Sensor", labelPrefix: "Temperature Sensor" },
  { key: "light", title: "Đèn thông minh", type: "Light", labelPrefix: "Smart Light" },
  { key: "switch", title: "Công tắc thông minh", type: "Switch", labelPrefix: "Smart Switch" },
];

export const AddDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { userPhone, refreshDevices } = useMiniApp();
  const qrInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(DEVICE_TEMPLATES[0].key);
  const [deviceSerial, setDeviceSerial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const username = useMemo(() => {
    const raw = String(userPhone || "").trim();
    if (!raw) return "";
    return raw.startsWith("+") ? raw.replace(/[^\d]/g, "") : raw;
  }, [userPhone]);

  const selectedTemplate = useMemo(
    () => DEVICE_TEMPLATES.find((x) => x.key === selectedTemplateKey) ?? DEVICE_TEMPLATES[0],
    [selectedTemplateKey],
  );

  const payload = useMemo(
    () => ({
      name: (deviceSerial.trim() || `DEVICE_${Date.now()}`).toUpperCase(),
      type: selectedTemplate.type,
      label: `${selectedTemplate.labelPrefix}${deviceSerial.trim() ? ` - ${deviceSerial.trim().toUpperCase()}` : ""}`,
    }),
    [deviceSerial, selectedTemplate],
  );

  const applyTemplate = (tpl: DeviceTemplate) => {
    setSelectedTemplateKey(tpl.key);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!username) {
      setErrorText("Chưa có username/số điện thoại từ auth.");
      return;
    }
    if (!payload.name || !payload.type) {
      setErrorText("Thiếu thông tin thiết bị.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await createAndStoreDevice(username, payload);
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

  const onQrPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrorText("");
    setSuccessText("Đã mở camera/chọn ảnh QR.");
    try {
      if (!("BarcodeDetector" in window)) {
        setSuccessText("Đã chụp ảnh QR. Thiết bị chưa hỗ trợ đọc QR tự động, bạn nhập serial thủ công.");
        return;
      }

      const DetectorCtor = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (input: ImageBitmap) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
      if (!DetectorCtor) {
        setSuccessText("Đã chụp ảnh QR. Thiết bị chưa hỗ trợ đọc QR tự động, bạn nhập serial thủ công.");
        return;
      }
      const detector = new DetectorCtor({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (codes.length > 0 && codes[0].rawValue) {
        const value = String(codes[0].rawValue).trim();
        setDeviceSerial(value);
        setSuccessText("Đã quét QR thành công, đã điền serial.");
      } else {
        setSuccessText("Không đọc được QR từ ảnh, vui lòng nhập serial thủ công.");
      }
    } catch {
      setSuccessText("Không đọc được QR từ ảnh, vui lòng nhập serial thủ công.");
    }
  };

  return (
    <div className="page-add-device">
      <div className="add-device-header">
        <Link to="/" className="back btn-back" aria-label="Quay lại">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="title">Thêm thiết bị</h1>
      </div>

      <div className="add-device-body">
        <div style={{ color: "#637083", marginBottom: 16 }}>
          Tài khoản: <strong>{username || "Chưa có username từ Tammi"}</strong>
        </div>

        <div className="add-device-section">
          <div className="section-title">Chọn nhanh loại thiết bị</div>
          <div className="section-desc">Chọn loại, sau đó nhập serial là tạo được.</div>
          <div style={{ display: "grid", gap: 10 }}>
            {DEVICE_TEMPLATES.map((tpl) => {
              const active = tpl.key === selectedTemplate.key;
              return (
                <button
                  key={tpl.key}
                  type="button"
                  className="add-device-row"
                  onClick={() => applyTemplate(tpl)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: active ? "rgba(0,172,193,0.12)" : "#f6f9fc",
                    border: "none",
                    borderRadius: 14,
                  }}
                >
                  <div className="row-icon">{active ? "✓" : ""}</div>
                  <div className="row-text">
                    <div style={{ fontWeight: 700, color: "#1a2332", fontSize: 15 }}>{tpl.title}</div>
                    <div style={{ color: "#637083", fontSize: 13 }}>{tpl.type}</div>
                  </div>
                  <div className="row-arrow">
                    <RightOutlined />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={onSubmit} className="add-device-section" style={{ marginBottom: 0 }}>
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onQrPick}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => qrInputRef.current?.click()}
            style={{
              marginTop: 10,
              height: 42,
              borderRadius: 12,
              background: "#eef3f9",
              color: "#1a2332",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              width: "100%",
              border: "none",
              cursor: "pointer",
            }}
          >
            Quét QR
          </button>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label style={{ fontSize: 13, color: "#637083", fontWeight: 600 }}>Serial / Mã thiết bị</label>
            <input
              value={deviceSerial}
              onChange={(e) => setDeviceSerial(e.target.value)}
              placeholder="VD: A4B72CCDFF33"
              style={{ height: 44, borderRadius: 12, border: "none", background: "#f6f9fc", padding: "0 12px", fontSize: 14 }}
            />
          </div>
          <div style={{ marginTop: 8, color: "#637083", fontSize: 12 }}>
            App sẽ tự tạo payload theo loại bạn đã chọn.
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 44,
                borderRadius: 12,
                border: "none",
                background: "#00acc1",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {submitting ? "Đang thêm thiết bị..." : "Thêm"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                height: 40,
                borderRadius: 10,
                border: "none",
                background: "#eef3f9",
                color: "#1a2332",
                fontWeight: 600,
              }}
            >
              Về Smart Home
            </button>
          </div>
        </form>

        {errorText && (
          <div style={{ marginTop: 12, color: "#d93025", fontWeight: 600, fontSize: 14 }}>
            {errorText}
          </div>
        )}
        {successText && (
          <div style={{ marginTop: 12, color: "#128a57", fontWeight: 600, fontSize: 14 }}>
            {successText}
          </div>
        )}
      </div>
    </div>
  );
};

