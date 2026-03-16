import React, { useState } from "react";
import { FiSmartphone, FiBell, FiSettings } from "react-icons/fi";
import { appState } from "../../api/app/appState";
import { getNotificationSettings } from "../../api/app/getNotificationSettings";
import { openSettings } from "../../api/app/openSettings";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const AppInfoPage: React.FC = () => {
  const [appStateResult, setAppStateResult] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const stateCall = useApiCall();
  const notificationCall = useApiCall();
  const settingsCall = useApiCall();

  const handleGetAppState = async () => {
    setAppStateResult("");
    const result = await stateCall.run(() => appState(), {
      successMessage: "App state retrieved successfully",
    });
    if (result) {
      setAppStateResult(result.state);
    }
  };

  const handleGetNotificationSettings = async () => {
    setNotificationStatus("");
    const result = await notificationCall.run(() => getNotificationSettings(), {
      successMessage: "Notification settings retrieved successfully",
    });
    if (result) {
      setNotificationStatus(result.status);
    }
  };

  const handleOpenSettings = async (type?: "Notification") => {
    await settingsCall.run(() => openSettings(type ? { type } : {}), {
      successMessage: `Opening ${type || "app"} settings`,
    });
  };

  const getStateDescription = (state: string) => {
    switch (state) {
      case "active":
        return "App is running in foreground";
      case "inactive":
        return "App is in foreground but not active (e.g., notification bar, lock screen)";
      case "background":
        return "App is running in background";
      case "unknown":
        return "State cannot be determined";
      default:
        return state;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "background":
        return "bg-blue-100 text-blue-800";
      case "authorized":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      case "notDetermined":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          App Information
        </h1>
        <p className="text-gray-600">
          Get application state, notification settings, and manage app settings
        </p>
      </div>

      {/* App State */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiSmartphone className="mr-2 text-indigo-600" />
          Application State
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Check if the app is running in foreground or background
        </p>

        <button
          onClick={handleGetAppState}
          disabled={stateCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            stateCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Get App State
        </button>

        {appStateResult && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-900">
                Current State:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                  appStateResult
                )}`}
              >
                {appStateResult}
              </span>
            </div>
            <p className="text-xs text-indigo-800">
              {getStateDescription(appStateResult)}
            </p>
          </div>
        )}

        {stateCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={stateCall.feedback.type}
              message={stateCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Notification Settings (iOS Only) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiBell className="mr-2 text-purple-600" />
          Notification Settings
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Get notification permission status (iOS only)
        </p>

        <button
          onClick={handleGetNotificationSettings}
          disabled={notificationCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            notificationCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Get Notification Status
        </button>

        {notificationStatus && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">
                Notification Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                  notificationStatus
                )}`}
              >
                {notificationStatus}
              </span>
            </div>
          </div>
        )}

        {notificationCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={notificationCall.feedback.type}
              message={notificationCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Open Settings (iOS Only) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiSettings className="mr-2 text-teal-600" />
          Open App Settings
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Open device settings page for this app (iOS only)
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleOpenSettings()}
            disabled={settingsCall.loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              settingsCall.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            Open App Settings
          </button>
          <button
            onClick={() => handleOpenSettings("Notification")}
            disabled={settingsCall.loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              settingsCall.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            Open Notification Settings
          </button>
        </div>

        {settingsCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={settingsCall.feedback.type}
              message={settingsCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About App Information APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVApplication.appState
            </code>{" "}
            - Returns app lifecycle state (active, inactive, background,
            unknown)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVApplication.getNotificationSettings
            </code>{" "}
            - iOS only, returns notification permission status
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVApplication.openSettings
            </code>{" "}
            - iOS only, opens app settings page
          </li>
          <li>
            • <strong>Status values:</strong> authorized, denied, notDetermined,
            unknown
          </li>
        </ul>
      </div>
    </div>
  );
};
