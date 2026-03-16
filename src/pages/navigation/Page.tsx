import React, { useState } from "react";
import { FiNavigation } from "react-icons/fi";
import { navigateToMiniapp } from "../../api/navigation/navigateToMiniapp";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const NavigationPage: React.FC = () => {
  const [appId, setAppId] = useState(
    process.env.REACT_APP_APP_ID ?? "1512032299590111735808"
  );
  const [path, setPath] = useState("");
  const [extraDataKey, setExtraDataKey] = useState("source");
  const [extraDataValue, setExtraDataValue] = useState("APP01");
  const { run, loading, feedback } = useApiCall();

  const handleNavigate = async () => {
    if (!appId.trim()) {
      return;
    }

    const params: any = {
      appId: appId.trim(),
    };

    if (path.trim()) {
      params.path = path.trim();
    }

    if (extraDataKey.trim() && extraDataValue.trim()) {
      params.extraData = {
        [extraDataKey.trim()]: extraDataValue.trim(),
      };
    }

    await run(() => navigateToMiniapp(params), {
      successMessage: "Navigation to MiniApp initiated successfully",
      errorMessage: (error) =>
        `Failed to navigate: ${error?.message || "Unknown error"}`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Navigate to MiniApp
        </h1>
        <p className="text-gray-600">
          Navigate from current miniapp to another miniapp
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiNavigation className="mr-2 text-indigo-600" />
          Navigation Settings
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MiniApp ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="e.g., 1512032299590111735808"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            The ID of the target MiniApp
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Path (optional)
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="e.g., /product/list"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Specific page to navigate to. Leave empty to navigate to index page
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Extra Data (optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={extraDataKey}
              onChange={(e) => setExtraDataKey(e.target.value)}
              placeholder="Key"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={extraDataValue}
              onChange={(e) => setExtraDataValue(e.target.value)}
              placeholder="Value"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Additional data to pass to the target MiniApp as query string
          </p>
        </div>

        <button
          onClick={handleNavigate}
          disabled={loading || !appId.trim()}
          className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
            loading || !appId.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Navigating..." : "Navigate to MiniApp"}
        </button>

        {feedback && (
          <div className="mt-4">
            <StatusMessage type={feedback.type} message={feedback.message} />
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Navigation API
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              wv.navigateToMiniapp
            </code>{" "}
            - Navigate from current miniapp to another miniapp
          </li>
          <li>
            • <strong>appId</strong> (required): The ID of the target MiniApp
          </li>
          <li>
            • <strong>path</strong> (optional): Specific page to navigate to.
            Leave empty for index page
          </li>
          <li>
            • <strong>extraData</strong> (optional): Additional data passed as
            query string parameters
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Example Usage
        </h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {`window.WindVane.call(
  "wv",
  "navigateToMiniapp",
  {
    appId: "2123xxxxxx",
    path: "/product/list",
    extraData: {
      source: "APP01"
    }
  },
  function () {
    console.log('open Miniapp successfully')
  },
  function (error) {
    console.error('Navigation failed:', error.msg)
  }
);`}
        </pre>
      </div>
    </div>
  );
};
