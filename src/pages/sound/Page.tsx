import React, { useState } from "react";
import { FiVolume2 } from "react-icons/fi";
import { beep } from "../../api/sound/beep";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const SoundPage: React.FC = () => {
  const [beepCount, setBeepCount] = useState(1);
  const { run, feedback, loading } = useApiCall();

  const handleBeep = async () => {
    await run(() => beep({ count: beepCount }), {
      successMessage: `Playing ${beepCount} beep(s)`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sound Notification
        </h1>
        <p className="text-gray-600">
          Play beep sound on the device using WVNotification.beep
        </p>
      </div>

      {/* Beep Component */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
          <FiVolume2 className="mr-2 text-orange-600" />
          Beep Notification
        </h2>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            No permissions required. Plays system beep sound on device.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Beeps
          </label>
          <input
            type="number"
            value={beepCount}
            onChange={(e) => setBeepCount(Math.max(1, Number(e.target.value)))}
            min="1"
            placeholder="Number of consecutive beeps"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>

        <button
          onClick={handleBeep}
          disabled={loading}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          Play Beep
        </button>

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Sound API
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNotification.beep
            </code>{" "}
            - Play beep sound on device
          </li>
          <li>• No permissions required</li>
          <li>• Default count: 1 beep</li>
          <li>• Can play multiple consecutive beeps</li>
        </ul>
      </div>
    </div>
  );
};
