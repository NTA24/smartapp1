import React from "react";
import { Link } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";

interface PlaceholderPageProps {
  title: string;
  backTo: string;
  children?: React.ReactNode;
  isPlaceholder?: boolean;
}

export const IS_PLACEHOLDER_PAGE = true;

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, backTo, children, isPlaceholder = true }) => (
  <div className="page-profile-sub">
    <div className="sub-page-header">
      <Link to={backTo} className="back btn-back">
        <span className="btn-back-arrow">
          <LeftOutlined />
        </span>
      </Link>
      <h1 className="sub-page-title">{title}</h1>
    </div>
    <div className="profile-sub-body">
      {isPlaceholder && (
        <p style={{ color: "#8b95a5", fontSize: 12, marginBottom: 8 }}>
          Placeholder page
        </p>
      )}
      {children ?? <p style={{ color: "#666" }}>Nội dung trang {title}.</p>}
    </div>
  </div>
);
