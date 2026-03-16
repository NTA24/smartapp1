import React from "react";

export type StatusMessageType = "success" | "error" | "info";

interface StatusMessageProps {
  type: StatusMessageType;
  message: string;
}

const styles: Record<StatusMessageType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, message }) => {
  if (!message) return null;
  return (
    <div
      className={`px-4 py-3 rounded-lg border ${styles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
};
