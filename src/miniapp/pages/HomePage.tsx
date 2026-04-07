import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SmartHomeDeviceRow } from "../components/SmartHomeDeviceRow";
import { HomeRoomStrip } from "../components/HomeRoomStrip";
import type { SmartBuildingDeviceRecord } from "../services/deviceSync";
import { fetchSmartHomeDevicesFromNewgen } from "../services/deviceSync";

/** Nội dung tab Smart Home (vỏ: HomeLayout) */
export const HomePage: React.FC = () => {
  const [refreshingDevices, setRefreshingDevices] = useState(false);

  const [smartHomeDevices, setSmartHomeDevices] = useState<SmartBuildingDeviceRecord[]>([]);

  const loadSmartHomeDevices = useCallback(async () => {
    const list = await fetchSmartHomeDevicesFromNewgen();
    setSmartHomeDevices(list);
  }, []);

  useEffect(() => {
    void loadSmartHomeDevices();
  }, [loadSmartHomeDevices]);

  const handleRefreshDevices = async () => {
    setRefreshingDevices(true);
    try {
      await loadSmartHomeDevices();
    } finally {
      setRefreshingDevices(false);
    }
  };

  return (
    <>
      <HomeRoomStrip />

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
        {smartHomeDevices.map((d, i) => (
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
