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

      const DetectorCtor = window.BarcodeDetector;
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
    <div className="add-device-page">
      <div className="add-device-page__header">
        <Link to="/" className="add-device-page__back btn-back" aria-label="Quay lại">
          <span className="btn-back-arrow">
            <LeftOutlined />
          </span>
        </Link>
        <h1 className="add-device-page__title">Thêm thiết bị</h1>
      </div>

      <div className="add-device-page__body">
        <div className="add-device-page__account">
          Tài khoản: <strong>{username || "Chưa có username từ Tammi"}</strong>
        </div>

        <div className="add-device-page__section">
          <div className="add-device-page__section-title">Chọn nhanh loại thiết bị</div>
          <div className="add-device-page__section-desc">Chọn loại, sau đó nhập serial là tạo được.</div>
          <div className="add-device-page__template-list">
            {DEVICE_TEMPLATES.map((tpl) => {
              const active = tpl.key === selectedTemplate.key;
              return (
                <button
                  key={tpl.key}
                  type="button"
                  className={`add-device-page__row add-device-page__template-row ${active ? "add-device-page__template-row--active" : ""}`}
                  onClick={() => applyTemplate(tpl)}
                >
                  <div className="add-device-page__row-icon">{active ? "✓" : ""}</div>
                  <div className="add-device-page__row-text">
                    <div className="add-device-page__template-title">{tpl.title}</div>
                    <div className="add-device-page__template-type">{tpl.type}</div>
                  </div>
                  <div className="add-device-page__row-arrow">
                    <RightOutlined />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={onSubmit} className="add-device-page__section add-device-page__form">
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onQrPick}
            className="add-device-page__file-input"
          />
          <button
            type="button"
            onClick={() => qrInputRef.current?.click()}
            className="add-device-page__qr-btn"
          >
            Quét QR
          </button>
          <div className="add-device-page__serial-group">
            <label className="add-device-page__serial-label">Serial / Mã thiết bị</label>
            <input
              value={deviceSerial}
              onChange={(e) => setDeviceSerial(e.target.value)}
              placeholder="VD: A4B72CCDFF33"
              className="add-device-page__serial-input"
            />
          </div>
          <div className="add-device-page__note">
            App sẽ tự tạo payload theo loại bạn đã chọn.
          </div>

          <div className="add-device-page__actions">
            <button
              type="submit"
              disabled={submitting}
              className="add-device-page__submit-btn"
            >
              {submitting ? "Đang thêm thiết bị..." : "Thêm"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="add-device-page__home-btn"
            >
              Về Smart Home
            </button>
          </div>
        </form>

        {errorText && (
          <div className="add-device-page__feedback add-device-page__feedback--error">
            {errorText}
          </div>
        )}
        {successText && (
          <div className="add-device-page__feedback add-device-page__feedback--success">
            {successText}
          </div>
        )}
      </div>
    </div>
  );
};

