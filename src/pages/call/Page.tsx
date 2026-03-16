import React, { useState } from "react";
import { FiPhone, FiLock } from "react-icons/fi";
import { dial } from "../../api/call/dial";
import { call } from "../../api/call/call";
import { authorize, PermissionScope } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const CallPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const dialCall = useApiCall();
  const directCall = useApiCall();
  const permissionCall = useApiCall();

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      await permissionCall.run(() => authorize("call"), {
        successMessage: "Call permission granted successfully",
      });
    } finally {
      setRequestingPermission(false);
    }
  };

  const handlePermissionError = async () => {
    dialCall.showFeedback(
      "error",
      "Permission denied. Please grant call permission in device settings."
    );
    try {
      await authorize("call");
    } catch (err) {
      // Permission request failed or denied
    }
  };

  const handleDial = async () => {
    if (!phoneNumber.trim()) {
      dialCall.showFeedback("error", "Please enter a phone number");
      return;
    }
    try {
      await dialCall.run(() => dial({ phone: phoneNumber }), {
        successMessage: "Dialer opened successfully",
        errorMessage: () => "",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to dial";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        await handlePermissionError();
      } else {
        dialCall.showFeedback("error", errorMsg);
      }
    }
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      directCall.showFeedback("error", "Please enter a phone number");
      return;
    }
    try {
      await directCall.run(() => call({ phone: phoneNumber }), {
        successMessage: "Call initiated successfully",
        errorMessage: () => "",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to call";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        await handlePermissionError();
      } else {
        directCall.showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Call</h1>
        <p className="text-gray-600">
          Dial phone numbers or make direct calls using WVCall APIs
        </p>
      </div>

      {/* Request Permission Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiLock className="mr-2 text-yellow-600" />
          Request Call Permission
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Call features require device permissions. Request them here before
          using the APIs below.
        </p>

        <button
          onClick={handleRequestPermission}
          disabled={requestingPermission}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            requestingPermission
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          Request Call Permission
        </button>

        {permissionCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={permissionCall.feedback.type}
              message={permissionCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number (e.g., 1320000000)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
        />
      </div>

      {/* Dial Phone */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiPhone className="mr-2 text-pink-600" />
          Dial Phone Number
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Opens the phone dialer with the number pre-filled. User needs to press
          dial button.
        </p>
        <button
          onClick={handleDial}
          disabled={dialCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            dialCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-pink-600 hover:bg-pink-700"
          }`}
        >
          Open Dialer
        </button>

        {dialCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={dialCall.feedback.type}
              message={dialCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Direct Call */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiPhone className="mr-2 text-red-600" />
          Make Direct Call
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Initiates a direct call to the phone number immediately.
        </p>
        <button
          onClick={handleCall}
          disabled={directCall.loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            directCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Call Now
        </button>

        {directCall.feedback && (
          <div className="mt-4">
            <StatusMessage
              type={directCall.feedback.type}
              message={directCall.feedback.message}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Call APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">WVCall.dial</code>{" "}
            - Opens phone dialer with pre-filled number
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">WVCall.call</code>{" "}
            - Makes direct phone call
          </li>
          <li>• Call permission required for both APIs</li>
          <li>• User must grant permission through device settings</li>
        </ul>
      </div>
    </div>
  );
};
