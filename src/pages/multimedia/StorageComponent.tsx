import React, { useState } from "react";
import { FiDatabase, FiSave, FiTrash2 } from "react-icons/fi";
import { setItem } from "../../api/multimedia/setItem";
import { getItem } from "../../api/multimedia/getItem";
import { removeItem } from "../../api/multimedia/removeItem";
import { clearStorage } from "../../api/multimedia/clearStorage";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const StorageComponent: React.FC = () => {
  const [storageKey, setStorageKey] = useState("test_key");
  const [storageValue, setStorageValue] = useState("test_value");
  const [retrievedValue, setRetrievedValue] = useState("");
  const { run, feedback, loading } = useApiCall();

  const handleSetStorage = async () => {
    await run(
      () => setItem(storageKey, storageValue),
      {
        successMessage: () => `Stored: ${storageKey} = ${storageValue}`,
      }
    );
  };

  const handleGetStorage = async () => {
    setRetrievedValue("");
    const value = await run(
      () => getItem(storageKey),
      { successMessage: "Value retrieved successfully" }
    );
    if (value) {
      setRetrievedValue(value);
    }
  };

  const handleRemoveStorage = async () => {
    await run(
      () => removeItem(storageKey),
      { successMessage: `Removed key: ${storageKey}` }
    );
    setRetrievedValue("");
  };

  const handleClearStorage = async () => {
    await run(
      () => clearStorage(),
      { successMessage: "Storage cleared successfully" }
    );
    setRetrievedValue("");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiDatabase className="mr-2 text-indigo-600" />
        Local Storage
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          No permissions required. Data is stored locally in the app cache.
        </p>
      </div>

      <input
        type="text"
        value={storageKey}
        onChange={(e) => setStorageKey(e.target.value)}
        placeholder="Storage key"
        className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <input
        type="text"
        value={storageValue}
        onChange={(e) => setStorageValue(e.target.value)}
        placeholder="Storage value"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleSetStorage}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          <FiSave className="mr-2" />
          Set Item
        </button>
        <button
          onClick={handleGetStorage}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          Get Item
        </button>
        <button
          onClick={handleRemoveStorage}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <FiTrash2 className="mr-2" />
          Remove
        </button>
        <button
          onClick={handleClearStorage}
          disabled={loading}
          className={`py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Clear All
        </button>
      </div>

      {retrievedValue && (
        <div className="p-3 bg-indigo-50 rounded-lg mb-4">
          <p className="text-sm font-medium text-indigo-900 mb-1">
            Retrieved Value:
          </p>
          <code className="text-sm text-indigo-800 break-all">
            {retrievedValue}
          </code>
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
