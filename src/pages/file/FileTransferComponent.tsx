import React, { useState, useEffect } from "react";
import { FiDownload, FiUpload, FiLock } from "react-icons/fi";
import { downloadFile } from "../../api/file/downloadFile";
import { uploadFile } from "../../api/file/uploadFile";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const FileTransferComponent: React.FC = () => {
  const [downloadUrl, setDownloadUrl] = useState(
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  );
  const [downloadName, setDownloadName] = useState("test.pdf");
  const [downloadedPath, setDownloadedPath] = useState("");

  const [uploadUrl, setUploadUrl] = useState("http://your-server.com/upload");
  const [uploadFilePath, setUploadFilePath] = useState("");
  const [uploadTimeout, setUploadTimeout] = useState(8000);
  const [uploadResult, setUploadResult] = useState("");

  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    // Listen for download events
    const handleDownloadSuccess = (e: any) => {
      if (e.param) {
        setDownloadedPath(e.param.filePath);
        showFeedback("success", "Download completed successfully");
      }
    };

    const handleDownloadFailed = (e: any) => {
      showFeedback("error", `Download failed: ${e.param?.msg || "Unknown error"}`);
    };

    // Listen for upload events
    const handleUploadSuccess = (e: any) => {
      if (e.param) {
        setUploadResult(`Upload completed: ${JSON.stringify(e.param)}`);
        showFeedback("success", "Upload completed successfully");
      }
    };

    const handleUploadFailed = (e: any) => {
      showFeedback("error", `Upload failed: ${e.param?.msg || "Unknown error"}`);
    };

    document.addEventListener(
      "WVFile.Event.downloadFileSuccess",
      handleDownloadSuccess
    );
    document.addEventListener(
      "WVFile.Event.downloadFileFailed",
      handleDownloadFailed
    );
    document.addEventListener(
      "WVFile.Event.uploadFileSuccess",
      handleUploadSuccess
    );
    document.addEventListener(
      "WVFile.Event.uploadFileFailed",
      handleUploadFailed
    );

    return () => {
      document.removeEventListener(
        "WVFile.Event.downloadFileSuccess",
        handleDownloadSuccess
      );
      document.removeEventListener(
        "WVFile.Event.downloadFileFailed",
        handleDownloadFailed
      );
      document.removeEventListener(
        "WVFile.Event.uploadFileSuccess",
        handleUploadSuccess
      );
      document.removeEventListener(
        "WVFile.Event.uploadFileFailed",
        handleUploadFailed
      );
    };
  }, [showFeedback]);

  const handlePermissionError = async () => {
    showFeedback(
      "error",
      "Permission denied. Please grant file permission in device settings."
    );
    try {
      await authorize("file");
    } catch (err) {
      // Permission request failed or denied
    }
  };

  const handleDownload = async () => {
    setDownloadedPath("");
    try {
      const result = await run(
        () =>
          downloadFile({
            url: downloadUrl,
            name: downloadName,
          }),
        {
          successMessage: "Download initiated successfully",
          errorMessage: () => "",
        }
      );
      if (result) {
        setDownloadedPath(result.filePath);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to download file";
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

  const handleUpload = async () => {
    setUploadResult("");
    if (!uploadFilePath.trim()) {
      showFeedback("error", "Please enter a file path");
      return;
    }
    try {
      const result = await run(
        () =>
          uploadFile({
            url: uploadUrl,
            filePath: uploadFilePath,
            timeout: uploadTimeout,
            headers: { "Content-Type": "application/octet-stream" },
          }),
        {
          successMessage: "Upload initiated successfully",
          errorMessage: () => "",
        }
      );
      if (result) {
        setUploadResult(JSON.stringify(result));
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to upload file";
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
        <FiDownload className="mr-2 text-green-600" />
        Download / Upload Files
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> File access for downloading and
          uploading files.
        </p>
      </div>

      {/* Download Section */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <FiDownload className="mr-2" />
          Download File
        </h3>
        <input
          type="text"
          value={downloadUrl}
          onChange={(e) => setDownloadUrl(e.target.value)}
          placeholder="Download URL"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        <input
          type="text"
          value={downloadName}
          onChange={(e) => setDownloadName(e.target.value)}
          placeholder="File name (optional)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        <button
          onClick={handleDownload}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Download File
        </button>
        {downloadedPath && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-xs font-medium text-green-900 mb-1">
              Downloaded to:
            </p>
            <code className="text-xs text-green-800 break-all">
              {downloadedPath}
            </code>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
          <FiUpload className="mr-2" />
          Upload File
        </h3>
        <input
          type="text"
          value={uploadUrl}
          onChange={(e) => setUploadUrl(e.target.value)}
          placeholder="Upload URL"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <input
          type="text"
          value={uploadFilePath}
          onChange={(e) => setUploadFilePath(e.target.value)}
          placeholder="Local file path (e.g., /storage/test.txt)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <input
          type="number"
          value={uploadTimeout}
          onChange={(e) => setUploadTimeout(Number(e.target.value))}
          placeholder="Timeout (ms)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Upload File
        </button>
        {uploadResult && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-1">
              Upload Result:
            </p>
            <pre className="text-xs text-blue-800 whitespace-pre-wrap">
              {uploadResult}
            </pre>
          </div>
        )}
      </div>

      {feedback && (
        <div className="mt-4">
          <StatusMessage
            type={feedback.type}
            message={feedback.message}
          />
        </div>
      )}
    </div>
  );
};
