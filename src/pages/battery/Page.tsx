import React, { useState } from "react";
import { FiZap } from "react-icons/fi";
import { getBatteryInfo } from "../../api/battery/getBatteryInfo";
import { getBatteryInfoSync } from "../../api/battery/getBatteryInfoSync";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const BatteryPage: React.FC = () => {
  const [batteryLevel, setBatteryLevel] = useState("");
  const [isCharging, setIsCharging] = useState("");
  const [chargingType, setChargingType] = useState("");
  const { run, loading, feedback } = useApiCall();

  const handleGetBatteryInfo = async () => {
    setBatteryLevel("");
    setIsCharging("");
    setChargingType("");

    const result = await run(() => getBatteryInfo(), {
      successMessage: "Battery info retrieved successfully",
    });

    if (result) {
      setBatteryLevel(result.level);
      setIsCharging(result.isCharging);
      setChargingType(result.chargingType);
    }
  };

  const handleGetBatteryInfoSync = async () => {
    setBatteryLevel("");
    setIsCharging("");
    setChargingType("");

    const result = await run(() => getBatteryInfoSync(), {
      successMessage: "Battery info (sync) retrieved successfully",
    });

    if (result) {
      setBatteryLevel(result.level);
      setIsCharging(result.isCharging);
      setChargingType(result.chargingType);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Battery Information
        </h1>
        <p className="text-gray-600">
          Get battery level and charging status (Android only)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiZap className="mr-2 text-yellow-600" />
          Battery Status
        </h2>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Battery APIs are only available on Android
            devices.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleGetBatteryInfo}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            Get Battery Info (Async)
          </button>
          <button
            onClick={handleGetBatteryInfoSync}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            Get Battery Info (Sync)
          </button>
        </div>

        {batteryLevel && (
          <div className="space-y-3">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-yellow-900 mb-1">
                    Battery Level
                  </p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {batteryLevel}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-yellow-900 mb-1">
                    Charging Status
                  </p>
                  <p className="text-lg font-semibold text-yellow-800">
                    {isCharging === "true" ? "Charging" : "Not Charging"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-yellow-900 mb-1">
                    Charging Type
                  </p>
                  <p className="text-lg font-semibold text-yellow-800">
                    {chargingType || "N/A"}
                  </p>
                </div>
              </div>
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
          About Battery APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBattery.getBatteryInfo
            </code>{" "}
            - Get battery info asynchronously (Android only)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBattery.getBatteryInfoSync
            </code>{" "}
            - Get battery info synchronously (Android only)
          </li>
          <li>
            • Returns: level (percentage), isCharging (true/false), chargingType
            (ac/usb/wireless)
          </li>
          <li>
            • Charging types: ac (power adapter), usb (USB cable), wireless
          </li>
        </ul>
      </div>
    </div>
  );
};
