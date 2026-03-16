import React, { useState, useEffect } from "react";
import { FiVideo, FiLock } from "react-icons/fi";
import { chooseVideo } from "../../api/multimedia/chooseVideo";
import { saveVideoToPhotosAlbum } from "../../api/multimedia/saveVideoToPhotosAlbum";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const VideoComponent: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handleVideoSuccess = (e: any) => {
      if (e.param) {
        setVideoInfo(`Video selected: ${JSON.stringify(e.param)}`);
      }
    };

    const handleVideoFailed = (e: any) => {
      if (e.param) {
        showFeedback(
          "error",
          `Video error: ${e.param.msg || JSON.stringify(e.param)}`
        );
      }
    };

    const handleVideoSaved = () => {
      showFeedback("success", "Video saved to album successfully");
    };

    const handleVideoSaveFailed = (e: any) => {
      showFeedback("error", `Video save failed: ${e.param?.msg || "Unknown error"}`);
    };

    document.addEventListener(
      "WVVideo.Event.chooseVideoSuccess",
      handleVideoSuccess
    );
    document.addEventListener(
      "WVVideo.Event.chooseVideoFailed",
      handleVideoFailed
    );
    document.addEventListener(
      "WVVideo.Event.saveVideoSuccess",
      handleVideoSaved
    );
    document.addEventListener(
      "WVVideo.Event.saveVideoFailed",
      handleVideoSaveFailed
    );

    return () => {
      document.removeEventListener(
        "WVVideo.Event.chooseVideoSuccess",
        handleVideoSuccess
      );
      document.removeEventListener(
        "WVVideo.Event.chooseVideoFailed",
        handleVideoFailed
      );
      document.removeEventListener(
        "WVVideo.Event.saveVideoSuccess",
        handleVideoSaved
      );
      document.removeEventListener(
        "WVVideo.Event.saveVideoFailed",
        handleVideoSaveFailed
      );
    };
  }, [showFeedback]);

  const handlePermissionError = async (scope: "camera" | "album" | "file") => {
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

  const handleChooseVideo = async (mode: "camera" | "video" | "both") => {
    setVideoInfo("");
    try {
      const result = await run(
        () => chooseVideo({ mode }),
        {
          successMessage: "Video selected successfully",
          errorMessage: () => "",
        }
      );
      if (!result) {
        return;
      }
      setVideoInfo(
        `Path: ${result.path}\nSize: ${result.fileSize}\nDuration: ${result.duration}s\nDimensions: ${result.width}x${result.height}`
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to choose video";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        const scope = mode === "video" ? "album" : "camera";
        await handlePermissionError(scope);
      } else {
        showFeedback("error", errorMsg);
      }
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUrl.trim()) {
      showFeedback("error", "Please enter a video URL");
      return;
    }
    try {
      await run(
        () => saveVideoToPhotosAlbum(videoUrl),
        {
          successMessage: "Video save initiated",
          errorMessage: () => "",
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save video";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        await handlePermissionError("file");
      } else {
        showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiVideo className="mr-2 text-purple-600" />
        Video Operations
      </h2>

      {/* Permission Notice */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
        <p className="text-xs text-yellow-800">
          <strong>Required Permissions:</strong> Camera (for recording), Album
          (for choosing), and File (for saving videos).
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={() => handleChooseVideo("camera")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Record Video
        </button>
        <button
          onClick={() => handleChooseVideo("video")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Choose from Album
        </button>
        <button
          onClick={() => handleChooseVideo("both")}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Record or Choose (Both)
        </button>
      </div>

      {videoInfo && (
        <div className="p-3 bg-purple-50 rounded-lg mb-4">
          <p className="text-xs font-medium text-purple-900 mb-1">
            Video Info:
          </p>
          <pre className="text-xs text-purple-800 whitespace-pre-wrap">
            {videoInfo}
          </pre>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Save Video to Album
        </p>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Video URL (HTTP/HTTPS)"
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        <button
          onClick={handleSaveVideo}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Save Video to Album
        </button>
      </div>

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
