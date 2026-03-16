import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { searchLocation } from "../../api/location/searchLocation";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const SearchLocationComponent: React.FC = () => {
  const [address, setAddress] = useState("No.960 xxxx West Road");
  const [coordinates, setCoordinates] = useState("");
  const { run, feedback, loading } = useApiCall();

  const handleSearchLocation = async () => {
    setCoordinates("");
    if (!address.trim()) {
      return;
    }

    const result = await run(() => searchLocation({ addrs: address }), {
      successMessage: "Location found successfully",
    });

    if (result) {
      setCoordinates(
        `Longitude: ${result.longitude}\nLatitude: ${result.latitude}`
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
        <FiSearch className="mr-2 text-green-600" />
        Search Location (iOS only)
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          This API is only available on iOS devices. Search for an address to
          get its coordinates.
        </p>
      </div>

      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter address to search"
        className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
      />

      <button
        onClick={handleSearchLocation}
        disabled={loading}
        className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        Search Location
      </button>

      {coordinates && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-xs font-medium text-green-900 mb-1">
            Coordinates:
          </p>
          <pre className="text-xs text-green-800 whitespace-pre-wrap">
            {coordinates}
          </pre>
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
