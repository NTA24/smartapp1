import React from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MiniAppProvider } from "./context/MiniAppContext";
import { StatusBar } from "./components/StatusBar";
import { BottomNav } from "./components/BottomNav";
import { AuthPermissionModal } from "./components/AuthPermissionModal";
import { DebugLogPanel } from "./components/DebugLogPanel";
import { HomePage } from "./pages/HomePage";
import { CameraPage } from "./pages/CameraPage.tsx";
import { ProfilePage } from "./pages/ProfilePage";
import { DevicePage } from "./pages/DevicePage";
import { DeviceTimerPage } from "./pages/DeviceTimerPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Với HashRouter: pathname đã là "/camera"...
  // Ẩn UI chrome của app cha để tránh nhìn như bị duplicate khi nhúng iframe.
  const isCameraRoute = location.pathname === "/camera" || location.pathname.startsWith("/camera/");
  return (
    <div id="app">
      {!isCameraRoute && <StatusBar />}
      <main id="main-content">{children}</main>
      {!isCameraRoute && <BottomNav />}
      {!isCameraRoute && <AuthPermissionModal />}
      {!isCameraRoute && <DebugLogPanel />}
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
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/device/:deviceId" element={<DevicePage />} />
            <Route path="/device/:deviceId/timer" element={<DeviceTimerPage />} />
            <Route path="/device/:deviceId/timer/add" element={<PlaceholderPage title="Thêm hẹn giờ" backTo="/" />} />
            <Route path="/device/:deviceId/timer/add/action" element={<PlaceholderPage title="Hành động hẹn giờ" backTo="/" />} />
            <Route path="/device/:deviceId/automation" element={<PlaceholderPage title="Tự động hóa" backTo="/" />} />
            <Route path="/shared" element={<PlaceholderPage title="Đã chia sẻ" backTo="/" />} />
            <Route path="/store" element={<PlaceholderPage title="Cửa hàng" backTo="/" />} />
            <Route path="/automation" element={<PlaceholderPage title="Tự động" backTo="/" />} />
            <Route path="/automation/log" element={<PlaceholderPage title="Nhật ký" backTo="/automation" />} />
            <Route path="/automation/scan" element={<PlaceholderPage title="Quét" backTo="/automation" />} />
            <Route path="/automation/setup" element={<PlaceholderPage title="Tự động hóa" backTo="/automation" />} />
            <Route path="/edit-room" element={<PlaceholderPage title="Chỉnh sửa phòng" backTo="/" />} />
            <Route path="/nav-settings" element={<PlaceholderPage title="Cài đặt điều hướng" backTo="/" />} />
            <Route path="/add-device" element={<PlaceholderPage title="Thêm thiết bị" backTo="/" />} />
            <Route path="/create-manual" element={<PlaceholderPage title="Điều khiển thủ công" backTo="/" />} />
            <Route path="/my-devices" element={<PlaceholderPage title="Thiết bị của tôi" backTo="/" />} />
            <Route path="/account" element={<PlaceholderPage title="Quản lý tài khoản" backTo="/profile" />} />
            <Route path="/voice" element={<PlaceholderPage title="Trợ lý thoại" backTo="/profile" />} />
            <Route path="/devices" element={<PlaceholderPage title="Quản lý nhiều thiết bị" backTo="/profile" />} />
            <Route path="/devices/utilities" element={<PlaceholderPage title="Tiện ích" backTo="/devices" />} />
            <Route path="/hub" element={<PlaceholderPage title="Hub & cổng" backTo="/profile" />} />
            <Route path="/settings" element={<PlaceholderPage title="Cài đặt" backTo="/profile" />} />
            <Route path="/notification-settings" element={<PlaceholderPage title="Cài đặt thông báo" backTo="/settings" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Thông báo" backTo="/" />} />
            <Route path="/help" element={<PlaceholderPage title="Trợ giúp và phản hồi" backTo="/profile" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </MiniAppProvider>
  );
}
