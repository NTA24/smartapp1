import React, { useState, useEffect } from "react";
import { FiCamera, FiLock } from "react-icons/fi";
import { takePhoto } from "../../api/multimedia/takePhoto";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const CameraComponent: React.FC = () => {
  const [photoResult, setPhotoResult] = useState("");
  const [outputFormat, setOutputFormat] = useState<"url" | "base64">("url");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handlePhotoUploadSuccess = (e: any) => {
      showFeedback("success", `Photo uploaded: ${JSON.stringify(e.param)}`);
    };

    const handlePhotoUploadFailed = (e: any) => {
      showFeedback("error", `Photo upload failed: ${JSON.stringify(e.param)}`);
    };

    document.addEventListener(
      "WVPhoto.Event.uploadPhotoSuccess",
      handlePhotoUploadSuccess
    );
    document.addEventListener(
      "WVPhoto.Event.uploadPhotoFailed",
      handlePhotoUploadFailed
    );

    return () => {
      document.removeEventListener(
        "WVPhoto.Event.uploadPhotoSuccess",
        handlePhotoUploadSuccess
      );
      document.removeEventListener(
        "WVPhoto.Event.uploadPhotoFailed",
        handlePhotoUploadFailed
      );
    };
  }, [showFeedback]);

  const handlePermissionError = async (scope: "camera" | "album") => {
    showFeedback(
      "error",
      `Permission denied. Please grant ${scope} permission in device settings.`
    );
    try {
      await authorize(scope);
    } catch (err) {
      // Permission request failed or denied
    }
  };

  const handleTakePhoto = async (mode: "camera" | "photo" | "both") => {
    setPhotoResult("");
    setImagePreview(null);
    try {
      const needBase64 = outputFormat === "base64";
      const result = await run(
        () => takePhoto({ mode, needBase64 }),
        {
          successMessage: "Photo taken successfully",
          errorMessage: () => "",
        }
      );
      if (!result) {
        return;
      }

      // Set text output based on format
      if (outputFormat === "base64" && result.base64Data) {
        setPhotoResult(
          `Base64 Data (first 200 chars): ${result.base64Data.substring(0, 200)}...\n\nFull length: ${result.base64Data.length} characters\n\nLocal path: ${result.localPath}`
        );
        // Set image preview for base64
        const base64WithPrefix = result.base64Data.startsWith("data:image")
          ? result.base64Data
          : `data:image/png;base64,${result.base64Data}`;
        setImagePreview(base64WithPrefix);
      } else {
        setPhotoResult(
          `Photo URL: ${result.url}\nLocal path: ${result.localPath}\n\nNote: The URL is for internal use in Mini App environment (src attribute of <img>).`
        );
        // Set image preview for URL
        setImagePreview(result.url);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to take photo";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        const scope = mode === "photo" ? "album" : "camera";
        await handlePermissionError(scope);
      } else {
        showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiCamera className="mr-2 text-orange-600" />
        Camera
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permissions:</strong> Camera (for taking photos) and
          Album (for choosing photos).
        </p>
      </div>

      {/* Output Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="outputFormat"
              value="url"
              checked={outputFormat === "url"}
              onChange={(e) => setOutputFormat(e.target.value as "url" | "base64")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">URL (for Mini App)</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="outputFormat"
              value="base64"
              checked={outputFormat === "base64"}
              onChange={(e) => setOutputFormat(e.target.value as "url" | "base64")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Base64 (data URI)</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {outputFormat === "url"
            ? "URL format returns a local file URL for use in Mini App environment"
            : "Base64 format returns the image as a data URI string"}
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={() => handleTakePhoto("camera")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Take Photo
        </button>
        <button
          onClick={() => handleTakePhoto("photo")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Choose from Album
        </button>
        <button
          onClick={() => handleTakePhoto("both")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Take or Choose (Both)
        </button>
      </div>

      {photoResult && (
        <div className="p-3 bg-orange-50 rounded-lg mb-4">
          <p className="text-xs font-medium text-orange-900 mb-1">
            Photo Result:
          </p>
          <pre className="text-xs text-orange-800 whitespace-pre-wrap">
            {photoResult}
          </pre>
        </div>
      )}

      {imagePreview && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Image Preview:
          </p>
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <img
              src={imagePreview}
              alt="Captured or selected"
              className="max-w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                console.error("Image failed to load:", imagePreview);
                e.currentTarget.style.display = "none";
                const errorMsg = document.createElement("p");
                errorMsg.className = "text-sm text-red-600";
                errorMsg.textContent =
                  outputFormat === "url"
                    ? "Cannot display image: URL is only accessible within Mini App environment"
                    : "Failed to load base64 image";
                e.currentTarget.parentElement?.appendChild(errorMsg);
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {outputFormat === "url"
              ? "This demonstrates how to use the URL in an <img> tag. The URL may only work within the Mini App environment."
              : "This demonstrates how to display a base64 image using a data URI in the src attribute."}
          </p>
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
