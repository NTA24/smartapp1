import React, { useState } from "react";
import { FiFileText, FiLock, FiCopy, FiCheck, FiMaximize2, FiMinimize2, FiSend } from "react-icons/fi";
import { chooseFiles } from "../../api/file/chooseFiles";
import { getDataByFilePath } from "../../api/file/getDataByFilePath";
import { authorize } from "../../api/permissions/authorize";
import { copyToClipboard } from "../../api/base/copyToClipboard";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const FileChooseComponent: React.FC = () => {
  const [chosenFiles, setChosenFiles] = useState<Array<{ path: string }>>([]);
  const [filePathForData, setFilePathForData] = useState("");
  const [base64Data, setBase64Data] = useState("");
  const [sha256Hash, setSha256Hash] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://webhook.site/5ff141fb-24ef-4417-a8ad-b04531157495");
  const { run, feedback, showFeedback, loading } = useApiCall();

  const generateSHA256 = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

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

  const handleChooseFiles = async () => {
    setChosenFiles([]);
    try {
      const result = await run(() => chooseFiles(), {
        successMessage: "Files selected successfully",
        errorMessage: () => "",
      });
      if (!result) {
        return;
      }
      setChosenFiles(result.files);
      // Auto-populate the first file path for getData
      if (result.files.length > 0) {
        setFilePathForData(result.files[0].path);
      }
      showFeedback("success", `${result.files.length} file(s) selected`);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to choose files";
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

  const handleGetFileData = async () => {
    setBase64Data("");
    setSha256Hash("");
    setIsCopied(false);
    setIsExpanded(false);
    if (!filePathForData.trim()) {
      showFeedback("error", "Please enter a file path");
      return;
    }
    try {
      const result = await run(
        () => getDataByFilePath({ path: filePathForData }),
        {
          successMessage: "File data retrieved successfully",
          errorMessage: () => "",
        }
      );
      if (!result) {
        return;
      }
      setBase64Data(result.base64Data);

      // Generate SHA-256 hash for integrity checking
      const hash = await generateSHA256(result.base64Data);
      setSha256Hash(hash);
      showFeedback("success", "File data and hash generated successfully!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to get file data";
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

  const handleCopyHash = async () => {
    try {
      // Try direct WindVane call without the run wrapper
      await copyToClipboard(sha256Hash);
      setIsCopied(true);
      showFeedback("success", "SHA-256 hash copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Fallback to browser clipboard API if available
      try {
        await navigator.clipboard.writeText(sha256Hash);
        setIsCopied(true);
        showFeedback("success", "SHA-256 hash copied to clipboard (fallback)!");
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackError) {
        showFeedback(
          "error",
          "Failed to copy hash. Please manually copy from below."
        );
      }
    }
  };

  const handleSendToWebhook = async () => {
    if (!webhookUrl.trim()) {
      showFeedback("error", "Please enter a webhook URL");
      return;
    }

    try {
      const chunkSize = 50000; // 50KB chunks
      const totalChunks = Math.ceil(base64Data.length / chunkSize);
      const sessionId = Date.now().toString();

      showFeedback("info", `Sending data in ${totalChunks} chunks...`);

      // Send chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, base64Data.length);
        const chunk = base64Data.substring(start, end);

        const payload = {
          sessionId: sessionId,
          chunkIndex: i,
          totalChunks: totalChunks,
          chunk: chunk,
          sha256Hash: i === 0 ? sha256Hash : undefined,
          totalLength: base64Data.length,
          isFirstChunk: i === 0,
          isLastChunk: i === totalChunks - 1,
          timestamp: new Date().toISOString(),
        };

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          showFeedback("error", `Failed at chunk ${i + 1}/${totalChunks}`);
          return;
        }

        showFeedback("info", `Sent chunk ${i + 1}/${totalChunks}...`);

        // Small delay between chunks to avoid rate limiting
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      showFeedback("success", `All ${totalChunks} chunks sent! Session ID: ${sessionId}. Check webhook.site to reassemble.`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send data";
      showFeedback("error", `Error: ${errorMsg}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiFileText className="mr-2 text-indigo-600" />
        Choose Files & Get Data
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> File access for choosing and
          reading local files.
        </p>
      </div>

      {/* Choose Files Section */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Choose Files</h3>
        <button
          onClick={handleChooseFiles}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Choose Files from Device
        </button>
        {chosenFiles.length > 0 && (
          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs font-medium text-indigo-900 mb-2">
              Selected Files:
            </p>
            <ul className="space-y-1">
              {chosenFiles.map((file, index) => (
                <li key={index} className="text-xs text-indigo-800 break-all">
                  {index + 1}. {file.path}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Get File Data Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">
          Get File Data as Base64
        </h3>
        <input
          type="text"
          value={filePathForData}
          onChange={(e) => setFilePathForData(e.target.value)}
          placeholder="Local file path (e.g., /download/dingding/0/1.png)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <button
          onClick={handleGetFileData}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Get File Data
        </button>
        {base64Data && (
          <div className="mt-3 space-y-3">
            {/* SHA-256 Hash Section */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-green-900">
                  SHA-256 Hash (for integrity checking):
                </p>
                <button
                  onClick={handleCopyHash}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    isCopied
                      ? "bg-green-600 text-white"
                      : "bg-green-700 text-white hover:bg-green-800"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <FiCheck className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3 h-3" />
                      Copy Hash
                    </>
                  )}
                </button>
              </div>
              <code className="text-xs text-green-900 break-all block bg-white p-2 rounded border border-green-300">
                {sha256Hash}
              </code>
            </div>

            {/* Webhook Export Section */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs font-medium text-purple-900 mb-2">
                Export to Webhook (for debugging):
              </p>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://webhook.site/..."
                className="w-full px-3 py-2 mb-2 text-xs border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              />
              <button
                onClick={handleSendToWebhook}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
              >
                <FiSend className="w-3 h-3" />
                Send Base64 Data to Webhook
              </button>
              <p className="text-xs text-purple-700 mt-2">
                This will send the full base64 data and hash to the webhook URL. You can then retrieve it from any device.
              </p>
            </div>

            {/* Base64 Data Section */}
            <div className="p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-indigo-900">
                  Base64 Data:
                </p>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
                >
                  {isExpanded ? (
                    <>
                      <FiMinimize2 className="w-3 h-3" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <FiMaximize2 className="w-3 h-3" />
                      Expand
                    </>
                  )}
                </button>
              </div>
              <code
                className={`text-xs text-indigo-800 break-all block overflow-y-auto ${
                  isExpanded ? "max-h-96" : "max-h-32"
                }`}
              >
                {isExpanded
                  ? base64Data
                  : base64Data.length > 400
                  ? `${base64Data.substring(0, 200)}...${base64Data.substring(base64Data.length - 200)}`
                  : base64Data}
              </code>
              <p className="text-xs text-indigo-700 mt-2">
                Length: {base64Data.length} characters
                {!isExpanded && base64Data.length > 400 && " (showing first 200 and last 200)"}
              </p>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
