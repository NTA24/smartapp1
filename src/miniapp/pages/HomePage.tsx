import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SmartHomeDeviceRow } from "../components/SmartHomeDeviceRow";
import { useMiniApp } from "../context/MiniAppContext";
import { sortDevicesForUi } from "../lib/deviceOrder";

/** Nội dung tab Smart Home (vỏ: HomeLayout) */
export const HomePage: React.FC = () => {
  const { devices, refreshDevices } = useMiniApp();
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  const sortedDevices = useMemo(() => sortDevicesForUi(devices), [devices]);

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await refreshDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  return (
    <>
      <div className="home-page__quick-actions">
        <Link to="/add-device" className="home-page__primary-btn">
          Thêm thiết bị
        </Link>
        <button
          type="button"
          onClick={handleRefreshDevices}
          disabled={refreshingDevices}
          className="home-page__secondary-btn"
        >
          {refreshingDevices ? "Đang làm mới..." : "Làm mới thiết bị"}
        </button>
      </div>

      <div className="home-page__device-cards">
        {sortedDevices.map((d, i) => (
          <SmartHomeDeviceRow
            key={`${String(d.deviceId ?? d.device?.id?.id ?? `row-${i}`)}-${i}`}
            device={d}
            index={i}
          />
        ))}
      </div>
      <div className="home-page__edit-wrap">
        <Link to="/edit-room" className="home-page__edit-btn">
          Chỉnh sửa
        </Link>
      </div>
    </>
  );
};
