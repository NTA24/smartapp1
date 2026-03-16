import React, { useMemo, useState } from "react";
import { getAuthCode } from "../../api/authentication/getAuthCode";
import type { AuthCodeResponse } from "../../api/authentication/getAuthCode";
import { clearAuthCache } from "../../api/viettel/dev/clearAuthCache";
import { copyToClipboard } from "../../api/base/copyToClipboard";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";
import {
  FiUser,
  FiKey,
  FiCheckCircle,
  FiPlus,
  FiX,
  FiTrash2,
  FiCopy,
} from "react-icons/fi";

const AVAILABLE_SCOPES = [
  {
    value: "USER_ID",
    label: "USER_ID",
    description: "Get user_id. No authentication tooltip displayed.",
  },
  {
    value: "USER_NICKNAME",
    label: "USER_NICKNAME",
    description: "Get user nickname.",
  },
  {
    value: "USER_NAME",
    label: "USER_NAME",
    description: "Get user full name.",
  },
  {
    value: "USER_LOGIN_ID",
    label: "USER_LOGIN_ID",
    description: "Get user login account.",
  },
  {
    value: "HASH_LOGIN_ID",
    label: "HASH_LOGIN_ID",
    description: "Get hashed login account.",
  },
  {
    value: "USER_AVATAR",
    label: "USER_AVATAR",
    description: "Get user avatar image.",
  },
  {
    value: "USER_GENDER",
    label: "USER_GENDER",
    description: "Get user gender.",
  },
  {
    value: "USER_BIRTHDAY",
    label: "USER_BIRTHDAY",
    description: "Get user birthday.",
  },
  {
    value: "USER_NATIONALITY",
    label: "USER_NATIONALITY",
    description: "Get user nationality.",
  },
  {
    value: "USER_CONTACTINFO",
    label: "USER_CONTACTINFO",
    description: "Get user contact information.",
  },
  {
    value: "auth_base",
    label: "auth_base",
    description: "Get user_id without authentication dialog.",
  },
  {
    value: "auth_user",
    label: "auth_user",
    description: "Get complete user account information.",
  },
  {
    value: "USER_EMAIL",
    label: "USER_EMAIL",
    description: "Get user's email",
  },
  {
    value: "USER_PHONE_NMUMBER",
    label: "USER_PHONE_NUMBER",
    description: "Get user's phone number",
  },
];

export const SSOPage: React.FC = () => {
  const [appId, setAppId] = useState<string>(
    (() => { const v = typeof import.meta.env !== "undefined" ? (import.meta.env as Record<string, unknown>).VITE_APP_ID : undefined; return (v !== undefined && v !== false ? String(v) : "").trim() || "1512032299590111735808"; })()
  );
  const [selectedScopes, setSelectedScopes] = useState(["auth_user"]);
  const [authResponse, setAuthResponse] = useState<AuthCodeResponse | null>(
    null
  );
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const authCall = useApiCall();
  const storageCall = useApiCall();
  const copyCall = useApiCall();

  const handleAddScope = (scope: string) => {
    if (!selectedScopes.includes(scope)) {
      setSelectedScopes([...selectedScopes, scope]);
    }
    setShowScopeDropdown(false);
  };

  const handleRemoveScope = (scope: string) => {
    setSelectedScopes(selectedScopes.filter((s) => s !== scope));
  };

  const handleGetAuthCode = async () => {
    if (!appId.trim()) {
      authCall.showFeedback("error", "Please enter App ID");
      return;
    }

    if (selectedScopes.length === 0) {
      authCall.showFeedback("error", "Please select at least one scope");
      return;
    }

    setAuthResponse(null);

    const response = await authCall.run(
      () => getAuthCode(appId, selectedScopes),
      {
        successMessage: "Auth code retrieved successfully",
      }
    );
    if (response) {
      setAuthResponse(response);
    }
  };

  const handleClearStorage = async () => {
    await storageCall.run(() => clearAuthCache(appId), {
      successMessage: "Storage cleared successfully",
    });
  };

  const handleCopyAuthCode = async () => {
    await copyCall.run(() => copyToClipboard(authResponse?.authCode ?? ""), {
      successMessage: "Auth code copied to clipboard",
    });
  };

  const availableScopes = useMemo(
    () =>
      AVAILABLE_SCOPES.filter((scope) => !selectedScopes.includes(scope.value)),
    [selectedScopes]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SSO Authentication
        </h1>
        <p className="text-gray-600">
          Get auth code for SSO flow using wv.getAuthCode API
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* App ID Input */}
        <div className="mb-6">
          <label
            htmlFor="appId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            <FiUser className="inline mr-2" />
            App ID
          </label>
          <input
            id="appId"
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="Enter your App ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Scopes Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiKey className="inline mr-2" />
            Scopes
          </label>

          {/* Selected Scopes */}
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedScopes.map((scope) => {
              const scopeInfo = AVAILABLE_SCOPES.find((s) => s.value === scope);
              return (
                <div
                  key={scope}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  title={scopeInfo?.description}
                >
                  <span>{scope}</span>
                  <button
                    onClick={() => handleRemoveScope(scope)}
                    className="ml-2 hover:text-blue-900"
                    aria-label={`Remove ${scope}`}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Scope Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScopeDropdown(!showScopeDropdown)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Scope
            </button>

            {showScopeDropdown && availableScopes.length > 0 && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowScopeDropdown(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute z-20 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <button
                      key={scope.value}
                      onClick={() => handleAddScope(scope.value)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {scope.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {scope.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {showScopeDropdown && availableScopes.length === 0 && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowScopeDropdown(false)}
                />

                {/* All Selected Message */}
                <div className="absolute z-20 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                  All scopes have been selected
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Get Auth Code Button */}
          <button
            onClick={handleGetAuthCode}
            disabled={authCall.loading}
            className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-colors ${
              authCall.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {authCall.loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Getting Auth Code...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiKey className="mr-2" />
                Get Auth Code
              </span>
            )}
          </button>

          {/* Clear Storage Button */}
          <button
            onClick={handleClearStorage}
            disabled={storageCall.loading}
            className={`py-3 px-6 rounded-lg font-medium text-white transition-colors ${
              storageCall.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {storageCall.loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Clearing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiTrash2 className="mr-2" />
                Clear Storage
              </span>
            )}
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {authCall.feedback && (
            <StatusMessage
              type={authCall.feedback.type}
              message={authCall.feedback.message}
            />
          )}
          {storageCall.feedback && (
            <StatusMessage
              type={storageCall.feedback.type}
              message={storageCall.feedback.message}
            />
          )}
        </div>

        {/* Success Message with Full Response */}
        {authResponse && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start mb-2">
              <FiCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Success!</p>
                <p className="text-xs text-green-600 mt-1">
                  Auth code retrieved successfully
                </p>
              </div>
            </div>

            {/* Full Response Display */}
            <div className="mt-3 p-3 bg-white rounded border border-green-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Full JSAPI Response:
              </p>
              <div className="space-y-2">
                {Object.entries(authResponse).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-col border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-medium text-gray-500">
                      {key}
                    </span>
                    <code className="text-sm font-mono text-gray-800 break-all">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON */}
            <div className="mt-3 p-3 bg-gray-50 rounded border border-green-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Raw JSON:
              </p>
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                {JSON.stringify(authResponse, null, 2)}
              </pre>
            </div>

            <button
              onClick={handleCopyAuthCode}
              disabled={copyCall.loading}
              className={`mt-3 w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                copyCall.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {copyCall.loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Copying...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <FiCopy className="mr-2" />
                  Copy AuthCode
                </span>
              )}
            </button>
            {copyCall.feedback && (
              <div className="mt-2">
                <StatusMessage
                  type={copyCall.feedback.type}
                  message={copyCall.feedback.message}
                />
              </div>
            )}
          </div>
        )}

        {/* Scopes Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            About Scopes
          </h3>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• Scopes define what user information your app can access</li>
            <li>
              •{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">auth_user</code>{" "}
              provides full user profile access
            </li>
            <li>
              •{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">auth_base</code>{" "}
              only provides user_id without auth dialog
            </li>
            <li>
              • Individual scopes (USER_NAME, USER_AVATAR, etc.) request
              specific fields
            </li>
            <li>• Multiple scopes can be combined in a single request</li>
          </ul>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-3">
          About SSO Authentication
        </h2>
        <ul className="space-y-2 text-sm text-purple-800">
          <li>
            • This demo uses{" "}
            <code className="bg-purple-100 px-2 py-0.5 rounded">
              wv.getAuthCode
            </code>{" "}
            API
          </li>
          <li>
            • The App ID identifies your Mini App in the Viettel ecosystem
          </li>
          <li>• Auth code can be exchanged for user tokens on your backend</li>
          <li>• Auth codes are short-lived and should be used immediately</li>
          <li>• This is part of the User Data Permission category</li>
          <li>
            • Use{" "}
            <code className="bg-purple-100 px-2 py-0.5 rounded">
              clearStorage
            </code>{" "}
            to clear all stored data from WVStorage - Useful in Debugging
          </li>
        </ul>
      </div>
    </div>
  );
};
