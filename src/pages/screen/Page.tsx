import React, { useState } from "react";
import { FiMonitor, FiRotateCw, FiCamera, FiLock } from "react-icons/fi";
import { getOrientation } from "../../api/screen/getOrientation";
import {
  setOrientation,
  OrientationType,
} from "../../api/screen/setOrientation";
import {
  getScreenBrightness,
  setScreenBrightness,
} from "../../api/screen/brightness";
import { captureScreen } from "../../api/screen/capture";
import { authorize } from "../../api/permissions/authorize";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const ScreenPage: React.FC = () => {
  const [currentOrientation, setCurrentOrientation] = useState("");
  const [selectedOrientation, setSelectedOrientation] =
    useState<OrientationType>("portrait");
  const [brightness, setBrightness] = useState(100);
  const [currentBrightness, setCurrentBrightness] = useState("");
  const [saveToAlbum, setSaveToAlbum] = useState(false);
  const [captureType, setCaptureType] = useState<"view" | "app">("view");
  const [captureResult, setCaptureResult] = useState("");
  const { run, feedback, showFeedback, loading } = useApiCall();

  const handleGetOrientation = async () => {
    const result = await run(() => getOrientation(), {
      successMessage: "Orientation retrieved successfully",
    });
    if (result) {
      setCurrentOrientation(result.orientation);
    }
  };

  const handleSetOrientation = async () => {
    await run(() => setOrientation({ orientation: selectedOrientation }), {
      successMessage: `Orientation set to ${selectedOrientation}`,
    });
  };

  const handleGetBrightness = async () => {
    const result = await run(() => getScreenBrightness(), {
      successMessage: "Brightness retrieved successfully",
    });
    if (result) {
      setCurrentBrightness(result.brightness);
    }
  };

  const handleSetBrightness = async () => {
    await run(() => setScreenBrightness({ brightness }), {
      successMessage: `Brightness set to ${brightness}`,
    });
  };

  const handleCaptureScreen = async () => {
    setCaptureResult("");
    try {
      const result = await run(
        () =>
          captureScreen({
            inAlbum: saveToAlbum ? "true" : "false",
            type: captureType,
          }),
        {
          successMessage: "Screenshot captured successfully",
          errorMessage: () => "",
        }
      );
      if (!result) return;
      setCaptureResult(`URL: ${result.url}\nLocal Path: ${result.localPath}`);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to capture screen";
      if (
        errorMsg.includes("NO_PERMISSION") ||
        errorMsg.includes("permission")
      ) {
        showFeedback(
          "error",
          "Permission denied. Requesting screen permission..."
        );
        try {
          await authorize("screen");
        } catch {}
      } else {
        showFeedback("error", errorMsg);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Screen</h1>
        <p className="text-gray-600">
          Control screen orientation, brightness, and capture
        </p>
      </div>

      {feedback && (
        <div className="mb-6">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      {/* Orientation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiRotateCw className="mr-2 text-purple-600" />
          Screen Orientation
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleGetOrientation}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Get Orientation
          </button>
          <button
            onClick={handleSetOrientation}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Set Orientation
          </button>
        </div>

        <select
          value={selectedOrientation}
          onChange={(e) =>
            setSelectedOrientation(e.target.value as OrientationType)
          }
          className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        >
          <option value="default">Default</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="landscapeRight">Landscape Right</option>
          <option value="landscapeLeft">Landscape Left</option>
          <option value="portraitUpsideDown">Portrait Upside Down</option>
          <option value="auto">Auto</option>
        </select>

        {currentOrientation && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>Current:</strong> {currentOrientation}
            </p>
          </div>
        )}
      </div>

      {/* Brightness */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiMonitor className="mr-2 text-blue-600" />
          Screen Brightness
        </h2>

        <input
          type="range"
          min="0"
          max="255"
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full mb-2"
        />
        <p className="text-sm text-gray-600 mb-4">
          Brightness: {brightness} / 255
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleGetBrightness}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Get Brightness
          </button>
          <button
            onClick={handleSetBrightness}
            disabled={loading}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Set Brightness
          </button>
        </div>

        {currentBrightness && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Brightness:</strong> {currentBrightness}
            </p>
          </div>
        )}
      </div>

      {/* Screen Capture */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiCamera className="mr-2 text-green-600" />
          Screen Capture
        </h2>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <FiLock className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> On iOS 11+, requires
            NSPhotoLibraryAddUsageDescription in Info.plist to save to album.
            Screen permission may be required.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={saveToAlbum}
              onChange={(e) => setSaveToAlbum(e.target.checked)}
              className="w-4 h-4 text-green-600"
            />
            <span className="text-sm text-gray-700">Save to Album</span>
          </label>

          <select
            value={captureType}
            onChange={(e) => setCaptureType(e.target.value as "view" | "app")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="view">WebView Only</option>
            <option value="app">Full App Window</option>
          </select>
        </div>

        <button
          onClick={handleCaptureScreen}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Capture Screenshot
        </button>

        {captureResult && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-xs font-medium text-green-900 mb-1">
              Capture Result:
            </p>
            <pre className="text-xs text-green-800 whitespace-pre-wrap">
              {captureResult}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Screen APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVScreen.getOrientation
            </code>{" "}
            - Get current orientation
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVScreen.setOrientation
            </code>{" "}
            - Set screen orientation
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVScreen.setScreenBrightness
            </code>{" "}
            - Set brightness (0-255)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVScreen.getScreenBrightness
            </code>{" "}
            - Get current brightness
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVScreenCapture.capture
            </code>{" "}
            - Capture screenshot
          </li>
        </ul>
      </div>
    </div>
  );
};
