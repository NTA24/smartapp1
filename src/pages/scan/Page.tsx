import React, { useState, useEffect } from "react";
import { FiCamera } from "react-icons/fi";
import { scan } from "../../api/scan/scan";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const ScanPage: React.FC = () => {
  const [openFlight, setOpenFlight] = useState(false);
  const [scanTitle, setScanTitle] = useState("Scan QR code or bar code");
  const [scanResult, setScanResult] = useState("");
  const { run, loading, feedback, showFeedback } = useApiCall();

  useEffect(() => {
    const handleScanSuccess = (e: any) => {
      if (e.param) {
        const { content, format } = e.param;
        setScanResult(`Content: ${content}\nFormat: ${format}`);
        showFeedback("success", "Scan completed successfully");
      }
    };

    const handleScanFailed = (e: any) => {
      showFeedback("error", `Scan failed: ${e.param?.msg || "Unknown error"}`);
    };

    document.addEventListener("WVScan.Event.scanSuccess", handleScanSuccess);
    document.addEventListener("WVScan.Event.scanFailed", handleScanFailed);

    return () => {
      document.removeEventListener(
        "WVScan.Event.scanSuccess",
        handleScanSuccess
      );
      document.removeEventListener("WVScan.Event.scanFailed", handleScanFailed);
    };
  }, [showFeedback]);

  const handleScan = async () => {
    setScanResult("");
    await run(() => scan({ openFlight, title: scanTitle }), {
      successMessage: "Scan initiated",
      errorMessage: () => "",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          QR Code / Barcode Scanner
        </h1>
        <p className="text-gray-600">
          Scan QR codes and barcodes using device camera
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiCamera className="mr-2 text-cyan-600" />
          Scanner Settings
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scan Title
          </label>
          <input
            type="text"
            value={scanTitle}
            onChange={(e) => setScanTitle(e.target.value)}
            placeholder="Scan QR code or bar code"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={openFlight}
              onChange={(e) => setOpenFlight(e.target.checked)}
              className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Enable Flashlight
            </span>
          </label>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          Start Scanner
        </button>

        {scanResult && (
          <div className="mt-4 p-4 bg-cyan-50 rounded-lg">
            <p className="text-sm font-medium text-cyan-900 mb-2">
              Scan Result:
            </p>
            <pre className="text-sm text-cyan-800 whitespace-pre-wrap">
              {scanResult}
            </pre>
          </div>
        )}

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Scan API
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">WVScan.scan</code>{" "}
            - Opens native scanner for QR codes and barcodes
          </li>
          <li>
            • Supported formats: QR_CODE, AZTEC, CODABAR, CODE_39, CODE_93,
            CODE_128, DATA_MATRIX, EAN_8, EAN_13, ITF, MAXICODE, PDF_417,
            RSS_14, RSS_EXPANDED, UPC_A, UPC_E
          </li>
          <li>• Events: WVScan.Event.scanSuccess, WVScan.Event.scanFailed</li>
          <li>• Optional flashlight toggle during scanning</li>
        </ul>
      </div>
    </div>
  );
};
