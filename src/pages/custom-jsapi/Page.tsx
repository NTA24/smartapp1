import React from "react";
import { FiTerminal, FiPhone, FiEye, FiMonitor } from "react-icons/fi";
import { setCallScreeningRole } from "../../api/viettel/permission/setCallScreeningRole";
import { setReadPhoneState } from "../../api/viettel/permission/setReadPhoneState";
import { setSystemAlertWindow } from "../../api/viettel/permission/setSystemAlertWindow";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const CustomJsapiPage: React.FC = () => {
  const callScreeningCall = useApiCall();
  const readPhoneStateCall = useApiCall();
  const systemAlertWindowCall = useApiCall();

  const handleSetCallScreeningRole = async () => {
    await callScreeningCall.run(() => setCallScreeningRole(), {
      successMessage: "Call screening role permission granted successfully",
    });
  };

  const handleSetReadPhoneState = async () => {
    await readPhoneStateCall.run(() => setReadPhoneState(), {
      successMessage: "Read phone state permission granted successfully",
    });
  };

  const handleSetSystemAlertWindow = async () => {
    await systemAlertWindowCall.run(() => setSystemAlertWindow(), {
      successMessage: "System alert window permission granted successfully",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FiTerminal className="text-purple-600" />
          Custom JSAPI
        </h1>
        <p className="text-gray-600">
          Test AppVTService permission APIs for Viettel Mini App
        </p>
      </div>

      {/* setCallScreeningRole */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiPhone className="mr-2 text-blue-600" />
          Set Call Screening Role
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Request permission for the Mini App to identify incoming calls.
        </p>
        <button
          onClick={handleSetCallScreeningRole}
          disabled={callScreeningCall.loading}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            callScreeningCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {callScreeningCall.loading ? "Requesting..." : "setCallScreeningRole"}
        </button>
        {callScreeningCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={callScreeningCall.feedback.type}
              message={callScreeningCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* setReadPhoneState */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiEye className="mr-2 text-green-600" />
          Set Read Phone State
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Request permission to access phone state information.
        </p>
        <button
          onClick={handleSetReadPhoneState}
          disabled={readPhoneStateCall.loading}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            readPhoneStateCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {readPhoneStateCall.loading ? "Requesting..." : "setReadPhoneState"}
        </button>
        {readPhoneStateCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={readPhoneStateCall.feedback.type}
              message={readPhoneStateCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* setSystemAlertWindow */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiMonitor className="mr-2 text-purple-600" />
          Set System Alert Window
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Request permission to display over other applications.
        </p>
        <button
          onClick={handleSetSystemAlertWindow}
          disabled={systemAlertWindowCall.loading}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            systemAlertWindowCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {systemAlertWindowCall.loading
            ? "Requesting..."
            : "setSystemAlertWindow"}
        </button>
        {systemAlertWindowCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={systemAlertWindowCall.feedback.type}
              message={systemAlertWindowCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About AppVTService Permission APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              AppVTService.setCallScreeningRole
            </code>{" "}
            - Permission to identify/screen incoming calls
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              AppVTService.setReadPhoneState
            </code>{" "}
            - Permission to access phone state
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              AppVTService.setSystemAlertWindow
            </code>{" "}
            - Permission to display over other apps
          </li>
          <li>
            • All APIs return{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              {"{ code, message, success }"}
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
};
