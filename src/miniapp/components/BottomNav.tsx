import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HomeOutlined, AppstoreOutlined, ThunderboltOutlined, ShoppingCartOutlined, UserOutlined } from "@ant-design/icons";
import { addLog } from "../lib/debugLog";
import { useMiniApp } from "../context/MiniAppContext";

const CAMERA_FLOW_TRACE_KEY = "zyapp_camera_flow_trace";

function updateCameraFlowTrace(patch: Record<string, unknown>) {
  try {
    const prevRaw = sessionStorage.getItem(CAMERA_FLOW_TRACE_KEY);
    const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, unknown>) : {};
    sessionStorage.setItem(CAMERA_FLOW_TRACE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    // Ignore storage errors.
  }
}

const NAV_ITEMS = [
  { path: "/", page: "home", label: "Smart Home", icon: HomeOutlined },
  { path: "/zyapp", page: "zyapp", label: "Camera", icon: AppstoreOutlined },
  { path: "/automation", page: "automation", label: "Tự động", icon: ThunderboltOutlined },
  { path: "/store", page: "store", label: "Cửa hàng", icon: ShoppingCartOutlined },
  { path: "/profile", page: "profile", label: "Hồ sơ", icon: UserOutlined },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userPhone } = useMiniApp();
  const pathname = location.pathname || "/";
  const currentPage = pathname === "/" ? "home" : pathname.split("/")[1] || "home";

  const callCameraTokenApi = async () => {
    const url = "https://campus.iot-platform.io.vn/api/v1/mini-app/camera-oem/token";
    const username = String(
      userPhone || (window as unknown as { MINIAPP_USER_PHONE?: string }).MINIAPP_USER_PHONE || "",
    ).trim();
    updateCameraFlowTrace({
      tokenApiStatus: "calling",
      tokenApiCalledAt: new Date().toISOString(),
      tokenApiUrl: url,
      username,
    });
    addLog("[CAMERA_FLOW] calling token API", { url, username });
    addLog("[API] camera-oem/token — POST " + url, { username });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      updateCameraFlowTrace({
        tokenApiStatus: "error",
        tokenApiError: String(
          (data as { detail?: string; message?: string }).detail ??
            (data as { message?: string }).message ??
            `camera-oem/token HTTP ${res.status}`,
        ),
      });
      throw new Error(
        String(
          (data as { detail?: string; message?: string }).detail ??
            (data as { message?: string }).message ??
            `camera-oem/token HTTP ${res.status}`,
        ),
      );
    }
    addLog("[API] camera-oem/token OK", data);
    updateCameraFlowTrace({
      tokenApiStatus: "success",
      tokenApiResponseAt: new Date().toISOString(),
    });
    addLog("[CAMERA_FLOW] token API success");
    try {
      sessionStorage.setItem("zyapp_camera_token_response", JSON.stringify(data));
    } catch {
    }
  };

  const onNavItemClick =
    (path: string, page: string) => async (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (page !== "zyapp") return;
      e.preventDefault();
      const traceId = `camera-flow-${Date.now()}`;
      updateCameraFlowTrace({
        traceId,
        clickedAt: new Date().toISOString(),
        navPath: path,
        clicked: true,
      });
      addLog("[CAMERA_FLOW] click Camera tab", { traceId, path });
      try {
        await callCameraTokenApi();
      } catch (err) {
        updateCameraFlowTrace({
          tokenApiStatus: "error",
          tokenApiError: err instanceof Error ? err.message : String(err),
        });
        addLog("[API] LỖI camera-oem/token", err instanceof Error ? err.message : String(err));
        addLog("[CAMERA_FLOW] token API error", { traceId, error: err instanceof Error ? err.message : String(err) });
      } finally {
        addLog("[CAMERA_FLOW] navigate to ZYApp page", { traceId, path });
        navigate(path);
      }
    };

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path, page, label, icon: Icon }) => (
        <Link
          key={page}
          to={path}
          className={`nav-item ${currentPage === page ? "active" : ""}`}
          data-page={page}
          onClick={onNavItemClick(path, page)}
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
