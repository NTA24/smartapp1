import React, { useState } from "react";
import { FiLock } from "react-icons/fi";
import { authorize, PermissionScope } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";
import { GetLocationComponent } from "./GetLocationComponent";
import { SearchLocationComponent } from "./SearchLocationComponent";

export const LocationPage: React.FC = () => {
  const [requestingScope, setRequestingScope] =
    useState<PermissionScope | null>(null);
  const { run, feedback } = useApiCall();

  const handleRequestPermission = async (scope: PermissionScope) => {
    setRequestingScope(scope);
    try {
      await run(() => authorize(scope), {
        successMessage: `${scope} permission granted successfully`,
      });
    } finally {
      setRequestingScope(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Geographical Location
        </h1>
        <p className="text-gray-600">GPS and location services</p>
      </div>

      {/* Request Permissions Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiLock className="mr-2 text-yellow-600" />
          Request Location Permission
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Location features require device permission. Request it here before
          using the APIs below.
        </p>

        <button
          onClick={() => handleRequestPermission("location")}
          disabled={Boolean(requestingScope)}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            requestingScope
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          Request Location Permission
        </button>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Location permission is needed to access GPS
            coordinates and address information. The accuracy and platform may
            affect address data quality.
          </p>
        </div>

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <GetLocationComponent />
        <SearchLocationComponent />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Location APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVLocation.getLocation
            </code>{" "}
            - Get current device location with coordinates and optional address
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVLocation.searchLocation
            </code>{" "}
            - Search for a specific address and get coordinates (iOS only)
          </li>
          <li>
            • High accuracy mode uses more battery but provides more precise
            location
          </li>
          <li>
            • Address data quality depends on platform capabilities and may have
            missing fields
          </li>
        </ul>
      </div>
    </div>
  );
};
