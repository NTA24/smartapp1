import React, { useState } from "react";
import {
  FiCpu,
  FiInfo,
  FiCalendar,
  FiTablet,
  FiMaximize2,
} from "react-icons/fi";
import {
  isSimulator,
  getCurrentUsage,
  getDeviceYear,
  getModelInfo,
  getSafeAreaInsets,
} from "../../api/device/nativeDetector";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const DetectorComponent: React.FC = () => {
  const [detectorInfo, setDetectorInfo] = useState("");
  const { run, feedback, loading } = useApiCall();

  const handleIsSimulator = async () => {
    setDetectorInfo("");
    const result = await run(() => isSimulator(), {
      successMessage: "Simulator check completed",
    });
    if (result) {
      setDetectorInfo(
        `Is Simulator: ${result.isSimulator ? "Yes" : "No (Real Device)"}`
      );
    }
  };

  const handleGetCurrentUsage = async () => {
    setDetectorInfo("");
    const result = await run(() => getCurrentUsage(), {
      successMessage: "Usage info retrieved successfully",
    });
    if (result) {
      setDetectorInfo(
        `CPU Usage: ${result.cpuUsage}\nMemory Usage: ${result.memoryUsage}\nUsed Memory: ${result.usedMemory}\nTotal Memory: ${result.totalMemory}`
      );
    }
  };

  const handleGetDeviceYear = async () => {
    setDetectorInfo("");
    const result = await run(() => getDeviceYear(), {
      successMessage: "Device year retrieved successfully",
    });
    if (result) {
      const year = result.deviceYear;
      const isPre2012 = year < 2012;
      setDetectorInfo(
        `Device Year: ${year}\nPerformance: ${
          isPre2012
            ? "May have performance issues (pre-2012)"
            : "Acceptable (2012+)"
        }`
      );
    }
  };

  const handleGetModelInfo = async () => {
    setDetectorInfo("");
    const result = await run(() => getModelInfo(), {
      successMessage: "Model info retrieved successfully",
    });
    if (result) {
      let info = `Brand: ${result.brand}\nModel: ${result.model}`;
      if (result.platform) {
        info += `\nPlatform: ${result.platform}`;
      }
      if (result.platformName) {
        info += `\nPlatform Name: ${result.platformName}`;
      }
      setDetectorInfo(info);
    }
  };

  const handleGetSafeAreaInsets = async () => {
    setDetectorInfo("");
    const result = await run(() => getSafeAreaInsets(), {
      successMessage: "Safe area insets retrieved successfully",
    });
    if (result) {
      setDetectorInfo(
        `Top: ${result.top}px\nLeft: ${result.left}px\nBottom: ${
          result.bottom
        }px\nRight: ${result.right}px\nCSS Available: ${
          result.cssAvaliable ? "Yes" : "No"
        }`
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FiCpu className="mr-2 text-purple-600" />
        Device Detector
      </h2>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> getCurrentUsage may impact performance. Use
          sparingly. getSafeAreaInsets is iOS 11+ only.
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={handleIsSimulator}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <FiInfo className="mr-2" />
          Check if Simulator
        </button>
        <button
          onClick={handleGetCurrentUsage}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <FiCpu className="mr-2" />
          Get CPU & Memory Usage
        </button>
        <button
          onClick={handleGetDeviceYear}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <FiCalendar className="mr-2" />
          Get Device Year
        </button>
        <button
          onClick={handleGetModelInfo}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <FiTablet className="mr-2" />
          Get Model Info
        </button>
        <button
          onClick={handleGetSafeAreaInsets}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          <FiMaximize2 className="mr-2" />
          Get Safe Area Insets (iOS 11+)
        </button>
      </div>

      {detectorInfo && (
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs font-medium text-purple-900 mb-1">Result:</p>
          <pre className="text-xs text-purple-800 whitespace-pre-wrap">
            {detectorInfo}
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
