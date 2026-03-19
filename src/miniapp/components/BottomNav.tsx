import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined, AppstoreOutlined, ThunderboltOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";

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
  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home";

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, page, label, icon: Icon }) => (
        <Link
          key={page}
          to={path}
          className={`nav-item ${currentPage === page ? "active" : ""}`}
          data-page={page}
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
