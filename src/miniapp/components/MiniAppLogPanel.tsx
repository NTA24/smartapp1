import React, { useEffect, useState } from "react";
import { Button, Drawer, FloatButton } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { clearLogs, getLogs } from "../lib/debugLog";
import { isMiniAppLogUiEnabled } from "../lib/enableDevtools";

export const MiniAppLogPanel: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname || "";
  const hash = typeof window !== "undefined" ? String(window.location.hash ?? "") : "";

  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(() => getLogs());

  useEffect(() => {
    if (!isMiniAppLogUiEnabled()) return;

    const onLog = (e: Event) => {
      if (!(e instanceof CustomEvent) || !Array.isArray(e.detail)) return;
      const detail = e.detail.filter((item): item is string => typeof item === "string");
      setLines([...detail]);
    };
    window.addEventListener("miniapp-debug-log", onLog);
    setLines(getLogs());
    return () => window.removeEventListener("miniapp-debug-log", onLog);
  }, []);

  if (
    pathname.startsWith("/zyapp/camera/") ||
    pathname.startsWith("/zyapp/multi-view") ||
    hash.includes("/zyapp/camera/") ||
    hash.includes("zyapp/multi-view")
  ) {
    return null;
  }

  if (!isMiniAppLogUiEnabled()) return null;

  return (
    <>
      {!open && (
        <FloatButton
          icon={<FileTextOutlined />}
          type="default"
          tooltip="MiniApp log (debug)"
          onClick={() => setOpen(true)}
          style={{ right: 20, bottom: 96 }}
        />
      )}
      <Drawer
        title="MiniApp log (addLog)"
        placement="bottom"
        height="42vh"
        open={open}
        onClose={() => setOpen(false)}
        styles={{ body: { padding: 12 } }}
        extra={
          <Button size="small" onClick={() => clearLogs()}>
            Xóa log
          </Button>
        }
      >
        <pre
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "#1a2332",
            background: "#f8fafc",
            padding: 10,
            borderRadius: 8,
            maxHeight: "calc(42vh - 80px)",
            overflow: "auto",
          }}
        >
          {lines.length ? lines.join("\n") : "(chưa có log)"}
        </pre>
      </Drawer>
    </>
  );
};
