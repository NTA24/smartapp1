import React, { useState, useEffect } from "react";
import { FiLink } from "react-icons/fi";
import { connect } from "../../api/bluetooth/connect";
import { disconnect } from "../../api/bluetooth/disconnect";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const BluetoothConnectComponent: React.FC = () => {
  const [deviceId, setDeviceId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handleDisconnected = (e: any) => {
      setIsConnected(false);
      showFeedback(
        "info",
        `Device disconnected: ${JSON.stringify(e.param || {})}`
      );
    };

    document.addEventListener(
      "WV.Event.WVBluetooth.GATTServerDisconnected",
      handleDisconnected
    );

    return () => {
      document.removeEventListener(
        "WV.Event.WVBluetooth.GATTServerDisconnected",
        handleDisconnected
      );
    };
  }, [showFeedback]);

  const handleConnect = async () => {
    if (!deviceId.trim()) {
      showFeedback("error", "Please enter a device ID");
      return;
    }

    const result = await run(() => connect({ deviceId }), {
      successMessage: "Successfully connected to device",
      errorMessage: () => "",
    });

    if (result !== undefined) {
      setIsConnected(true);
    }
  };

  const handleDisconnect = async () => {
    const result = await run(() => disconnect(), {
      successMessage: "Disconnected from device",
      errorMessage: () => "",
    });

    if (result !== undefined) {
      setIsConnected(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiLink className="mr-2 text-purple-600" />
        Bluetooth Connection
      </h2>

      <input
        type="text"
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        placeholder="Device ID (from scan results)"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleConnect}
          disabled={loading || isConnected}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading || isConnected
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          Connect
        </button>
        <button
          onClick={handleDisconnect}
          disabled={loading || !isConnected}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading || !isConnected
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Disconnect
        </button>
      </div>

      {isConnected && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-800 font-medium">
            Connected to device: {deviceId}
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
