import React, { useState } from "react";
import { FiWifi } from "react-icons/fi";
import {
  getNetworkType,
  NetworkTypeResult,
} from "../../api/network/getNetworkType";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const NetworkPage: React.FC = () => {
  const [wifiStatus, setWifiStatus] = useState(false);
  const [wifiList, setWifiList] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkTypeResult | null>(
    null
  );
  const { run, feedback, loading } = useApiCall();

  const handleGetNetworkType = async () => {
    setNetworkInfo(null);
    const result = await run(() => getNetworkType({ wifiStatus, wifiList }), {
      successMessage: "Network information retrieved successfully",
    });
    if (result) {
      setNetworkInfo(result);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Network</h1>
        <p className="text-gray-600">Check network status and connectivity</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiWifi className="mr-2 text-blue-600" />
          Get Network Type
        </h2>

        <div className="space-y-3 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={wifiStatus}
              onChange={(e) => setWifiStatus(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Get WiFi Status (SSID & BSSID)
            </span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={wifiList}
              onChange={(e) => setWifiList(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Get Available WiFi List (Android only)
            </span>
          </label>
        </div>

        <button
          onClick={handleGetNetworkType}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Get Network Type
        </button>

        {networkInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Network Information:
            </p>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Type:</strong> {networkInfo.type}
              </p>
              <p>
                <strong>Message:</strong> {networkInfo.message}
              </p>
              {networkInfo.ssid && (
                <p>
                  <strong>SSID:</strong> {networkInfo.ssid}
                </p>
              )}
              {networkInfo.bssid && (
                <p>
                  <strong>BSSID:</strong> {networkInfo.bssid}
                </p>
              )}
              {networkInfo.wifiList && networkInfo.wifiList.length > 0 && (
                <div>
                  <strong>Available WiFi Networks:</strong>
                  <ul className="ml-4 mt-1">
                    {networkInfo.wifiList.map((wifi, idx) => (
                      <li key={idx}>
                        • {wifi.ssid} ({wifi.bssid})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Network API
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNetwork.getNetworkType
            </code>{" "}
            - Get current network type
          </li>
          <li>
            • <strong>Network types:</strong> NONE, WIFI, CELL, 2G, 3G, 4G,
            UNKNOWN
          </li>
          <li>• WiFi list only available on Android devices</li>
          <li>• No permissions required for basic network information</li>
        </ul>
      </div>
    </div>
  );
};
