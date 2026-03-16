import React, { useState } from "react";
import { FiImage, FiLock } from "react-icons/fi";
import { saveImage } from "../../api/multimedia/saveImage";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const ImageComponent: React.FC = () => {
  const [imageUrl, setImageUrl] = useState("https://picsum.photos/400/300");
  const { run, feedback, showFeedback, loading } = useApiCall();

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

  const handleSaveImage = async () => {
    try {
      await run(
        () => saveImage(imageUrl),
        {
          successMessage: "Image saved to album successfully",
          errorMessage: () => "",
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save image";
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
        <FiImage className="mr-2 text-blue-600" />
        Save Image to Album
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permission:</strong> File access (for saving to
          device storage). If permission is denied, you'll be prompted to grant
          it.
        </p>
      </div>

      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Image URL or Base64 string"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      <button
        onClick={handleSaveImage}
        disabled={loading}
        className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Save Image
      </button>

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
