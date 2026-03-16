import React, { useState } from "react";
import { FiLock } from "react-icons/fi";
import { authorize, PermissionScope } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";
import { FileReadWriteComponent } from "./FileReadWriteComponent";
import { FileInfoComponent } from "./FileInfoComponent";
import { FileTransferComponent } from "./FileTransferComponent";
import { FileChooseComponent } from "./FileChooseComponent";

export const FilePage: React.FC = () => {
  const [requestingScope, setRequestingScope] = useState<PermissionScope | null>(
    null
  );
  const { run, feedback } = useApiCall();

  const handleRequestPermission = async (scope: PermissionScope) => {
    setRequestingScope(scope);
    try {
      await run(
        () => authorize(scope),
        {
          successMessage: `${scope} permission granted successfully`,
        }
      );
    } finally {
      setRequestingScope(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          File Operations
        </h1>
        <p className="text-gray-600">
          Read, write, download, upload, and manage files on the device
        </p>
      </div>

      {/* Request Permissions Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiLock className="mr-2 text-yellow-600" />
          Request File Permission
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          File operations require device permissions. Request them here before
          using the APIs below.
        </p>

        <button
          onClick={() => handleRequestPermission("file")}
          disabled={Boolean(requestingScope)}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            requestingScope
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          Request File Permission
        </button>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> File permission is needed for reading,
            writing, downloading, uploading, and accessing local files. Files
            are stored in WindVanecachedfiles/ directory.
          </p>
        </div>

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      <div className="space-y-6">
        <FileReadWriteComponent />
        <FileInfoComponent />
        <FileTransferComponent />
        <FileChooseComponent />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About File APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.write
            </code>{" "}
            - Write content to files (write/append/overwrite modes)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">WVFile.read</code>{" "}
            - Read file content from device
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.getFileInfo
            </code>{" "}
            - Get file size and information (WindVane Android 1.0.X.X or iOS
            2.1.4+)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.downloadFile
            </code>{" "}
            - Download files from URLs to device storage
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.uploadFile
            </code>{" "}
            - Upload local files to remote servers
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.chooseFiles
            </code>{" "}
            - Choose files from device storage
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVFile.getDataByFilePath
            </code>{" "}
            - Get file data as Base64 string
          </li>
        </ul>
      </div>
    </div>
  );
};
