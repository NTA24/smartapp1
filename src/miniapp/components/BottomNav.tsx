import React, { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined, AppstoreOutlined, ThunderboltOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { updateCameraFlowTrace } from "../utils/cameraFlow";

const NAV_ITEMS = [
  { path: "/", page: "home", label: "Smart Home", icon: HomeOutlined },
  { path: "/zyapp", page: "zyapp", label: "Camera", icon: AppstoreOutlined },
  { path: "/automation", page: "automation", label: "Tự động", icon: ThunderboltOutlined },
  { path: "/store", page: "store", label: "Cửa hàng", icon: ShoppingCartOutlined },
  { path: "/profile", page: "profile", label: "Hồ sơ", icon: UserOutlined },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname || "/";

  if (pathname.startsWith("/zyapp/camera/")) return null;

  const currentPage =
    pathname === "/" || pathname === "/shared" ? "home" : pathname.split("/")[1] || "home";

  const onZyappNavClick = useCallback(() => {
    const traceId = `camera-flow-${Date.now()}`;
    updateCameraFlowTrace({
      traceId,
      clickedAt: new Date().toISOString(),
      navPath: "/zyapp",
      clicked: true,
    });
    updateCameraFlowTrace({
      tokenApiStatus: "skipped",
      tokenSource: "requestAuthAndPhone:user-info",
    });
  }, []);

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, page, label, icon: Icon }) => (
        <Link
          key={page}
          to={path}
          className={`nav-item ${currentPage === page ? "active" : ""}`}
          data-page={page}
          onClick={page === "zyapp" ? onZyappNavClick : undefined}
        >
          <span className="nav-icon">
            <Icon />
          </span>
          <span className="nav-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
};
