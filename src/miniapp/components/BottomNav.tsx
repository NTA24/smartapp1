import React from "react";
import { Link, useLocation } from "react-router-dom";
import { IconifyIcon } from "./IconifyIcon";

const NAV_ITEMS = [
  { path: "/", page: "home", label: "Smart Home", icon: "ant-design:home-outlined" },
  { path: "/automation", page: "automation", label: "Tự động", icon: "ant-design:thunderbolt-outlined" },
  { path: "/store", page: "store", label: "Cửa hàng", icon: "ant-design:shopping-cart-outlined" },
  { path: "/profile", page: "profile", label: "Hồ sơ", icon: "ant-design:user-outlined" },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.hash ? location.hash.slice(1) || "/" : "/";
  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home";

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, page, label, icon }) => (
        <Link
          key={page}
          to={path}
          className={`nav-item ${currentPage === page ? "active" : ""}`}
          data-page={page}
        >
          <span className="nav-icon">
            <IconifyIcon icon={icon} />
          </span>
          <span className="nav-label">{label}</span>
        </Link>
      ))}
    </nav>
  );
};
