import React, { useState } from "react";
import { FiSmartphone } from "react-icons/fi";
import {
  getSystemInfo,
  getSystemInfoSync,
} from "../../api/device/getSystemInfo";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const SystemInfoComponent: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState("");
  const { run, feedback, loading } = useApiCall();

  const handleGetSystemInfo = async (isSync: boolean) => {
    setSystemInfo("");
    const result = await run(
      () => (isSync ? getSystemInfoSync() : getSystemInfo()),
      {
        successMessage: `System info retrieved ${
          isSync ? "synchronously" : "successfully"
        }`,
      }
    );

    if (result) {
      setSystemInfo(JSON.stringify(result, null, 2));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <FiSmartphone className="mr-2 text-blue-600" />
        System Information
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleGetSystemInfo(false)}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Get System Info
        </button>
        <button
          onClick={() => handleGetSystemInfo(true)}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Get System Info Sync
        </button>
      </div>

      {systemInfo && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-900 mb-1">
            System Information:
          </p>
          <pre className="text-xs text-blue-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {systemInfo}
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
