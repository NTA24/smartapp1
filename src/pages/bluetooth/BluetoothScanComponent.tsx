import React, { useState, useEffect } from "react";
import { FiBluetooth, FiSearch } from "react-icons/fi";
import { requestAuthorization } from "../../api/bluetooth/requestAuthorization";
import { bluetoothScan } from "../../api/bluetooth/bluetoothScan";
import { stopScan } from "../../api/bluetooth/stopScan";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

interface BluetoothDevice {
  name: string;
  deviceId: string;
}

export const BluetoothScanComponent: React.FC = () => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handleDeviceDiscovered = (e: any) => {
      if (e.param) {
        const { name, deviceId } = e.param;
        setDevices((prev) => {
          const exists = prev.some((d) => d.deviceId === deviceId);
          if (exists) return prev;
          return [...prev, { name, deviceId }];
        });
      }
    };

    document.addEventListener(
      "WV.Event.WVBluetooth.discoverDevice",
      handleDeviceDiscovered
    );

    return () => {
      document.removeEventListener(
        "WV.Event.WVBluetooth.discoverDevice",
        handleDeviceDiscovered
      );
    };
  }, []);

  const handleRequestAuth = async () => {
    await run(() => requestAuthorization(), {
      successMessage: "Bluetooth authorization granted",
    });
  };

  const handleStartScan = async () => {
    setDevices([]);
    setIsScanning(true);
    await run(() => bluetoothScan(), {
      successMessage: "Bluetooth scan started",
      errorMessage: () => "",
    });
  };

  const handleStopScan = async () => {
    setIsScanning(false);
    await run(() => stopScan(), {
      successMessage: "Bluetooth scan stopped",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiBluetooth className="mr-2 text-blue-600" />
        Bluetooth Scan
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Step 1:</strong> Request Bluetooth authorization
          <br />
          <strong>Step 2:</strong> Start scanning for nearby BLE devices
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={handleRequestAuth}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Request Authorization
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleStartScan}
            disabled={loading || isScanning}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
              loading || isScanning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <FiSearch className="mr-2" />
            Start Scan
          </button>
          <button
            onClick={handleStopScan}
            disabled={loading || !isScanning}
            className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading || !isScanning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Stop Scan
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center">
            <span className="animate-pulse mr-2">●</span>
            Scanning for devices...
          </p>
        </div>
      )}

      {devices.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Discovered Devices ({devices.length}):
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devices.map((device, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <p className="text-sm font-medium text-blue-900">
                  {device.name || "Unnamed Device"}
                </p>
                <p className="text-xs text-blue-700 mt-1 break-all">
                  ID: {device.deviceId}
                </p>
              </div>
            ))}
          </div>
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
