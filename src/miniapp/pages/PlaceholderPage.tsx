import React from "react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  backTo: string;
  children?: React.ReactNode;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, backTo, children }) => (
  <div className="page-profile-sub">
    <div className="sub-page-header">
      <Link to={backTo} className="back btn-back">
        <span className="btn-back-arrow">
          <iconify-icon icon="ant-design:left-outlined" />
        </span>
      </Link>
      <h1 className="sub-page-title">{title}</h1>
    </div>
    <div className="profile-sub-body">
      {children ?? <p style={{ color: "#666" }}>Nội dung trang {title}.</p>}
    </div>
  </div>
);
