import React, { useState } from "react";
import { FiFile, FiLock } from "react-icons/fi";
import { writeFile } from "../../api/file/writeFile";
import { readFile } from "../../api/file/readFile";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const FileReadWriteComponent: React.FC = () => {
  const [fileName, setFileName] = useState("testFile.txt");
  const [fileContent, setFileContent] = useState("Hello World!!!");
  const [writeMode, setWriteMode] = useState<"write" | "append" | "overwrite">(
    "overwrite"
  );
  const [readContent, setReadContent] = useState("");
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

  const handleWriteFile = async () => {
    try {
      await apiCall.run(
        () =>
          writeFile({
            mode: writeMode,
            data: fileContent,
            fileName: fileName,
            share: "false",
          }),
        {
          successMessage: `File written successfully with mode: ${writeMode}`,
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to write file";
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

  const handleReadFile = async () => {
    setReadContent("");
    try {
      const result = await apiCall.run(
        () =>
          readFile({
            fileName: fileName,
            share: "false",
          }),
        {
          successMessage: "File read successfully",
        }
      );
      if (result) {
        setReadContent(result.data);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to read file";
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
        <FiFile className="mr-2 text-blue-600" />
        File Read/Write
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> File access (for reading/writing
          files). Path: WindVanecachedfiles/fileName
        </p>
      </div>

      <input
        type="text"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        placeholder="File name (without /)"
        className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />

      <textarea
        value={fileContent}
        onChange={(e) => setFileContent(e.target.value)}
        placeholder="File content to write"
        rows={4}
        className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />

      <select
        value={writeMode}
        onChange={(e) =>
          setWriteMode(e.target.value as "write" | "append" | "overwrite")
        }
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        <option value="write">Write (error if exists)</option>
        <option value="append">Append (add to end)</option>
        <option value="overwrite">Overwrite (replace)</option>
      </select>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleWriteFile}
          disabled={apiCall.loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            apiCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Write File
        </button>
        <button
          onClick={handleReadFile}
          disabled={apiCall.loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            apiCall.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Read File
        </button>
      </div>

      {readContent && (
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <p className="text-xs font-medium text-gray-900 mb-1">
            File Content:
          </p>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {readContent}
          </pre>
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
