import React, { useState } from "react";
import { FiInfo, FiLock } from "react-icons/fi";
import { getFileInfo } from "../../api/file/getFileInfo";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const FileInfoComponent: React.FC = () => {
  const [filePath, setFilePath] = useState(
    "/storage/emulated/0/Android/data/xxx/testFile.txt"
  );
  const [fileSize, setFileSize] = useState("");
  const apiCall = useApiCall();

  const handlePermissionError = async () => {
    apiCall.showFeedback(
      "error",
      "Permission denied. Please grant file permission in device settings."
    );
    try {
      await authorize("file");
    } catch (err) {
      // Permission request failed or denied
    }
  };

  const handleGetFileInfo = async () => {
    setFileSize("");
    try {
      const result = await apiCall.run(
        () => getFileInfo({ filePath }),
        { successMessage: "File info retrieved successfully" }
      );
      if (result) {
        setFileSize(result.fileSize);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get file info";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        await handlePermissionError();
      } else {
        apiCall.showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiInfo className="mr-2 text-purple-600" />
        File Information
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> File access. Requires WindVane
          Android 1.0.X.X or iOS 2.1.4+
        </p>
      </div>

      <input
        type="text"
        value={filePath}
        onChange={(e) => setFilePath(e.target.value)}
        placeholder="Absolute file path"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
      />

      <button
        onClick={handleGetFileInfo}
        className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
      >
        Get File Info
      </button>

      {fileSize && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-xs font-medium text-purple-900 mb-1">File Size:</p>
          <p className="text-sm text-purple-800">{fileSize} bytes</p>
        </div>
      )}

      {apiCall.feedback && (
        <div className="mt-4">
          <StatusMessage
            type={apiCall.feedback.type}
            message={apiCall.feedback.message}
          />
        </div>
      )}
    </div>
  );
};
