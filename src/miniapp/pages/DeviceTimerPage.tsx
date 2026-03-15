import React from "react";
import { Link, useParams } from "react-router-dom";
import { PlaceholderPage } from "./PlaceholderPage";

export const DeviceTimerPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  return (
    <PlaceholderPage title="Hẹn giờ" backTo="/">
      <p>Thiết bị: {deviceId}. Danh sách hẹn giờ.</p>
      <Link to={`/device/${deviceId}/timer/add`}>Thêm hẹn giờ</Link>
    </PlaceholderPage>
  );
};
