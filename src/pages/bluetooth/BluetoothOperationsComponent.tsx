import React, { useState, useEffect } from "react";
import { FiDatabase } from "react-icons/fi";
import { getServices } from "../../api/bluetooth/getServices";
import { getCharacteristics } from "../../api/bluetooth/getCharacteristics";
import { readValue } from "../../api/bluetooth/readValue";
import { writeValue } from "../../api/bluetooth/writeValue";
import { startNotifications } from "../../api/bluetooth/startNotifications";
import { stopNotifications } from "../../api/bluetooth/stopNotifications";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const BluetoothOperationsComponent: React.FC = () => {
  const [deviceId, setDeviceId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [characteristicId, setCharacteristicId] = useState("");
  const [writeValueData, setWriteValueData] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handleValueChanged = (e: any) => {
      if (e.param) {
        showFeedback("info", `Value changed: ${JSON.stringify(e.param)}`);
      }
    };

    document.addEventListener(
      "WV.Event.WVBluetooth.characteristicValueChanged",
      handleValueChanged
    );

    return () => {
      document.removeEventListener(
        "WV.Event.WVBluetooth.characteristicValueChanged",
        handleValueChanged
      );
    };
  }, [showFeedback]);

  const handleGetServices = async () => {
    if (!deviceId.trim()) {
      showFeedback("error", "Please enter a device ID");
      return;
    }

    const result = await run(() => getServices({ deviceId }), {
      successMessage: "Services retrieved successfully",
    });

    if (result) {
      setServices(result.services || []);
    }
  };

  const handleGetCharacteristics = async () => {
    if (!deviceId.trim() || !serviceId.trim()) {
      showFeedback("error", "Please enter device ID and service ID");
      return;
    }

    const result = await run(
      () => getCharacteristics({ deviceId, serviceId }),
      {
        successMessage: "Characteristics retrieved successfully",
      }
    );

    if (result) {
      setCharacteristics(
        result.characteristics?.map((c) => c.characteristicId) || []
      );
    }
  };

  const handleReadValue = async () => {
    if (!deviceId.trim() || !serviceId.trim() || !characteristicId.trim()) {
      showFeedback("error", "Please fill all required fields");
      return;
    }

    await run(() => readValue({ deviceId, serviceId, characteristicId }), {
      successMessage: "Read value initiated",
    });
  };

  const handleWriteValue = async () => {
    if (
      !deviceId.trim() ||
      !serviceId.trim() ||
      !characteristicId.trim() ||
      !writeValueData.trim()
    ) {
      showFeedback("error", "Please fill all required fields");
      return;
    }

    await run(
      () =>
        writeValue({
          deviceId,
          serviceId,
          characteristicId,
          value: writeValueData,
        }),
      {
        successMessage: "Value written successfully",
      }
    );
  };

  const handleStartNotifications = async () => {
    if (!deviceId.trim() || !serviceId.trim() || !characteristicId.trim()) {
      showFeedback("error", "Please fill all required fields");
      return;
    }

    await run(
      () => startNotifications({ deviceId, serviceId, characteristicId }),
      {
        successMessage: "Notifications started",
      }
    );
  };

  const handleStopNotifications = async () => {
    if (!deviceId.trim() || !serviceId.trim() || !characteristicId.trim()) {
      showFeedback("error", "Please fill all required fields");
      return;
    }

    await run(
      () => stopNotifications({ deviceId, serviceId, characteristicId }),
      {
        successMessage: "Notifications stopped",
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiDatabase className="mr-2 text-indigo-600" />
        Bluetooth Operations
      </h2>

      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Device ID"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGetServices}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Get Services
          </button>
          <button
            onClick={handleGetCharacteristics}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Get Characteristics
          </button>
        </div>

        {services.length > 0 && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs font-medium text-indigo-900 mb-2">
              Services ({services.length}):
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {services.map((service, idx) => (
                <p key={idx} className="text-xs text-indigo-800 break-all">
                  {service}
                </p>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          placeholder="Service ID (UUID)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />

        {characteristics.length > 0 && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-xs font-medium text-indigo-900 mb-2">
              Characteristics ({characteristics.length}):
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {characteristics.map((char, idx) => (
                <p key={idx} className="text-xs text-indigo-800 break-all">
                  {char}
                </p>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          value={characteristicId}
          onChange={(e) => setCharacteristicId(e.target.value)}
          placeholder="Characteristic ID (UUID)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleReadValue}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Read Value
          </button>
          <button
            onClick={handleStartNotifications}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Start Notifications
          </button>
        </div>

        <input
          type="text"
          value={writeValueData}
          onChange={(e) => setWriteValueData(e.target.value)}
          placeholder="Value to write (Base64)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleWriteValue}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            Write Value
          </button>
          <button
            onClick={handleStopNotifications}
            disabled={loading}
            className={`py-2 px-4 text-white font-medium rounded-lg transition-colors text-sm ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Stop Notifications
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
