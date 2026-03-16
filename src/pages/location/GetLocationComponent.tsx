import React, { useState } from "react";
import { FiMapPin, FiLock } from "react-icons/fi";
import { getLocation } from "../../api/location/getLocation";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const GetLocationComponent: React.FC = () => {
  const [enableHighAccuracy, setEnableHighAccuracy] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(true);
  const [locationInfo, setLocationInfo] = useState("");
  const { run, feedback, showFeedback, loading } = useApiCall();

  const handlePermissionError = async () => {
    showFeedback(
      "error",
      "Permission denied. Please grant location permission in device settings."
    );
    try {
      await authorize("location");
    } catch (err) {
      // Permission request failed or denied
    }
  };

  const handleGetLocation = async () => {
    setLocationInfo("");
    try {
      const result = await run(
        () =>
          getLocation({
            enableHighAccuracy: enableHighAccuracy ? "true" : "false",
            address: includeAddress,
          }),
        {
          successMessage: "Location retrieved successfully",
          errorMessage: () => "",
        }
      );
      if (!result) {
        return;
      }

      let info = `Coordinates:\nLongitude: ${result.coords.longitude}\nLatitude: ${result.coords.latitude}\nAccuracy: ${result.coords.accuracy}m`;

      if (result.address) {
        info += `\n\nAddress:\nCity: ${
          result.address.city || "N/A"
        }\nProvince: ${result.address.province || "N/A"}\nArea: ${
          result.address.area || "N/A"
        }\nRoad: ${result.address.road || "N/A"}\nFull Address: ${
          result.address.addressLine || "N/A"
        }`;
        if (result.address.cityCode) {
          info += `\nCity Code: ${result.address.cityCode}`;
        }
      }

      setLocationInfo(info);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get location";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        await handlePermissionError();
      } else {
        showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiMapPin className="mr-2 text-blue-600" />
        Get Current Location
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> Location access to get GPS
          coordinates and address information.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={enableHighAccuracy}
            onChange={(e) => setEnableHighAccuracy(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            Enable high accuracy (uses more battery)
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeAddress}
            onChange={(e) => setIncludeAddress(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">
            Include address information
          </span>
        </label>
      </div>

      <button
        onClick={handleGetLocation}
        disabled={loading}
        className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Get Location
      </button>

      {locationInfo && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-900 mb-1">
            Location Info:
          </p>
          <pre className="text-xs text-blue-800 whitespace-pre-wrap">
            {locationInfo}
          </pre>
        </div>
      )}

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
