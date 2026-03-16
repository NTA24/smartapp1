import React, { useState } from "react";
import { FiVolume2 } from "react-icons/fi";
import { playSystemSound } from "../../api/multimedia/playSystemSound";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const AudioComponent: React.FC = () => {
  const [soundId, setSoundId] = useState(1000);
  const [soundCount, setSoundCount] = useState(1);
  const { run, feedback, loading } = useApiCall();

  const handlePlaySound = async () => {
    try {
      await run(
        () => playSystemSound({ sound: soundId, count: soundCount }),
        {
          successMessage: `Playing system sound ${soundId} ${soundCount} time(s)`,
        }
      );
    } catch (err) {
      // feedback handled by hook
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiVolume2 className="mr-2 text-green-600" />
        System Sound (iOS only)
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          This API only works on iOS devices. No permissions required.
        </p>
      </div>

      <input
        type="number"
        value={soundId}
        onChange={(e) => setSoundId(Number(e.target.value))}
        placeholder="Sound ID (e.g., 1000)"
        className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
      />
      <input
        type="number"
        value={soundCount}
        onChange={(e) => setSoundCount(Number(e.target.value))}
        placeholder="Play count"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
      />
      <button
        onClick={handlePlaySound}
        disabled={loading}
        className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        Play System Sound
      </button>

      {feedback && (
        <div className="mt-4">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}
    </div>
  );
};
