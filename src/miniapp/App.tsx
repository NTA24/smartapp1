import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { MiniAppProvider } from "./context/MiniAppContext";
import { StatusBar } from "./components/StatusBar";
import { BottomNav } from "./components/BottomNav";
import { HomePage } from "./pages/HomePage";
import { CameraPage } from "./pages/CameraPage";
import { MultiCameraViewPage } from "./pages/MultiCameraViewPage";
import { CameraSdkPage } from "./pages/CameraSdkPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DevicePage } from "./pages/DevicePage";
import { DeviceTimerPage } from "./pages/DeviceTimerPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { AddDevicePage } from "./pages/AddDevicePage";
import { MyDevicesPage } from "./pages/MyDevicesPage";
import { MiniAppLogPanel } from "./components/MiniAppLogPanel";

type PlaceholderRoute = {
  path: string;
  title: string;
  backTo: string;
};

const PLACEHOLDER_ROUTES: PlaceholderRoute[] = [
  { path: "/device/:deviceId/timer/add", title: "Thêm hẹn giờ", backTo: "/" },
  { path: "/device/:deviceId/timer/add/action", title: "Hành động hẹn giờ", backTo: "/" },
  { path: "/device/:deviceId/automation", title: "Tự động hóa", backTo: "/" },
  { path: "/shared", title: "Đã chia sẻ", backTo: "/" },
  { path: "/store", title: "Cửa hàng", backTo: "/" },
  { path: "/automation", title: "Tự động", backTo: "/" },
  { path: "/automation/log", title: "Nhật ký", backTo: "/automation" },
  { path: "/automation/scan", title: "Quét", backTo: "/automation" },
  { path: "/automation/setup", title: "Tự động hóa", backTo: "/automation" },
  { path: "/edit-room", title: "Chỉnh sửa phòng", backTo: "/" },
  { path: "/nav-settings", title: "Cài đặt điều hướng", backTo: "/" },
  { path: "/create-manual", title: "Điều khiển thủ công", backTo: "/" },
  { path: "/account", title: "Quản lý tài khoản", backTo: "/profile" },
  { path: "/voice", title: "Trợ lý thoại", backTo: "/profile" },
  { path: "/devices", title: "Quản lý nhiều thiết bị", backTo: "/profile" },
  { path: "/devices/utilities", title: "Tiện ích", backTo: "/devices" },
  { path: "/hub", title: "Hub & cổng", backTo: "/profile" },
  { path: "/settings", title: "Cài đặt", backTo: "/profile" },
  { path: "/notification-settings", title: "Cài đặt thông báo", backTo: "/settings" },
  { path: "/notifications", title: "Thông báo", backTo: "/" },
  { path: "/help", title: "Trợ giúp và phản hồi", backTo: "/profile" },
];

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
      <StatusBar />
      <main id="main-content">{children}</main>
      <BottomNav />
      <MiniAppLogPanel />
    </div>
  );
}

export default function App() {
  return (
    <MiniAppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/zyapp" element={<CameraPage />} />
            <Route path="/zyapp/multi-view" element={<MultiCameraViewPage />} />
            <Route path="/zyapp/camera/:cameraId" element={<CameraSdkPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/device/:deviceId" element={<DevicePage />} />
            <Route path="/device/:deviceId/timer" element={<DeviceTimerPage />} />
            <Route path="/add-device" element={<AddDevicePage />} />
            <Route path="/my-devices" element={<MyDevicesPage />} />
            {PLACEHOLDER_ROUTES.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<PlaceholderPage title={route.title} backTo={route.backTo} isPlaceholder />}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </MiniAppProvider>
  );
}
