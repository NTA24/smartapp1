import React, { useState } from "react";
import { getSetting, AuthSetting } from "../../api/permissions/getSetting";
import { authorize, PermissionScope } from "../../api/permissions/authorize";
import { 
  FiLock, 
  FiCamera, 
  FiMapPin, 
  FiMic, 
  FiShield,
  FiBluetooth,
  FiImage,
  FiUsers,
  FiFile,
  FiPhone,
  FiActivity,
  FiMonitor
} from "react-icons/fi";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const DevicePermissionsPage: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<AuthSetting>({});
  const [selectedPermission, setSelectedPermission] = useState<PermissionScope>("camera");
  const getSettingsCall = useApiCall();
  const authorizeCall = useApiCall();

  const handleGetSetting = async () => {
    const result = await getSettingsCall.run(
      () => getSetting(),
      { successMessage: "Permission status retrieved successfully" }
    );
    if (result) {
      setPermissionStatus(result.authSetting || {});
    }
  };

  const handleAuthorize = async (scope: PermissionScope) => {
    const result = await authorizeCall.run(
      () => authorize(scope),
      {
        successMessage: `${scope} permission granted successfully`,
      }
    );
    if (result?.successScope?.[scope]) {
      setPermissionStatus((prev) => ({ ...prev, [scope]: true }));
    }
  };

  const permissions = [
    { id: "camera" as PermissionScope, label: "Camera", icon: FiCamera, color: "blue" },
    { id: "location" as PermissionScope, label: "Location", icon: FiMapPin, color: "green" },
    { id: "microphone" as PermissionScope, label: "Microphone", icon: FiMic, color: "purple" },
    { id: "bluetooth" as PermissionScope, label: "Bluetooth", icon: FiBluetooth, color: "indigo" },
    { id: "album" as PermissionScope, label: "Album", icon: FiImage, color: "pink" },
    { id: "contacts" as PermissionScope, label: "Contacts", icon: FiUsers, color: "teal" },
    { id: "file" as PermissionScope, label: "File", icon: FiFile, color: "yellow" },
    { id: "call" as PermissionScope, label: "Call", icon: FiPhone, color: "red" },
    { id: "vibrate" as PermissionScope, label: "Vibrate", icon: FiActivity, color: "orange" },
    { id: "screen" as PermissionScope, label: "Screen", icon: FiMonitor, color: "cyan" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Device Permissions
        </h1>
        <p className="text-gray-600">
          Get and request device permissions using wv.getSetting and wv.authorize
        </p>
      </div>

      {/* Get Settings Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiShield className="mr-2 text-blue-600" />
          Check Permission Status
        </h2>
        
        <button
          onClick={handleGetSetting}
          disabled={getSettingsCall.loading}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            getSettingsCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {getSettingsCall.loading ? "Checking..." : "Get All Permissions Status"}
        </button>

        {/* Permission Status Display */}
        {Object.keys(permissionStatus).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(permissionStatus).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 capitalize">{key}</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  value === true
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {value === true ? "Authorized" : "Denied"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Permission Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiLock className="mr-2 text-purple-600" />
          Request Permission
        </h2>

        {/* Permission Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {permissions.map((perm) => (
            <button
              key={perm.id}
              onClick={() => setSelectedPermission(perm.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPermission === perm.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <perm.icon className={`w-5 h-5 mx-auto mb-1 ${
                selectedPermission === perm.id ? "text-blue-600" : "text-gray-600"
              }`} />
              <p className="text-xs font-medium text-gray-700">{perm.label}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleAuthorize(selectedPermission)}
          disabled={authorizeCall.loading}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            authorizeCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {authorizeCall.loading
            ? "Requesting..."
            : `Request ${
                permissions.find((p) => p.id === selectedPermission)?.label
              } Permission`}
        </button>

        <div className="space-y-3 mt-4">
          {getSettingsCall.feedback && (
            <StatusMessage
              type={getSettingsCall.feedback.type}
              message={getSettingsCall.feedback.message}
            />
          )}
          {authorizeCall.feedback && (
            <StatusMessage
              type={authorizeCall.feedback.type}
              message={authorizeCall.feedback.message}
            />
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Device Permissions
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • <code className="bg-blue-100 px-2 py-0.5 rounded">wv.getSetting</code> - Returns boolean values for each permission scope
          </li>
          <li>
            • <code className="bg-blue-100 px-2 py-0.5 rounded">wv.authorize</code> - Request specific device permissions
          </li>
          <li>
            • <strong>10 available scopes:</strong> location, camera, bluetooth, album, contacts, microphone, file, call, vibrate, screen
          </li>
          <li>
            • Users can grant or deny permissions through native dialogs
          </li>
          <li>
            • Permission states: <code>true</code> (granted), <code>false</code> (denied/not determined)
          </li>
        </ul>
      </div>
    </div>
  );
};