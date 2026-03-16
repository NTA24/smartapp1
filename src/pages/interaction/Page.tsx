import React, { useState, useEffect } from "react";
import {
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiMessageSquare,
  FiGrid,
  FiNavigation,
  FiCommand,
} from "react-icons/fi";
import { showLoadingBox } from "../../api/interaction/showLoadingBox";
import { hideLoadingBox } from "../../api/interaction/hideLoadingBox";
import { hideKeyboard } from "../../api/interaction/hideKeyboard";
import { toast } from "../../api/interaction/toast";
import { alert } from "../../api/interaction/alert";
import { confirm } from "../../api/interaction/confirm";
import { prompt } from "../../api/interaction/prompt";
import { showActionSheet } from "../../api/interaction/showActionSheet";
import { updateNavBar } from "../../api/interaction/updateNavBar";
import { getNavBarHeight } from "../../api/interaction/getNavBarHeight";

export const InteractionPage: React.FC = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toastMessage, setToastMessage] = useState("Hello from Toast!");
  const [toastDuration, setToastDuration] = useState(2);
  const [alertMessage, setAlertMessage] = useState("This is an alert!");
  const [confirmMessage, setConfirmMessage] = useState("Are you sure?");
  const [confirmResult, setConfirmResult] = useState("");
  const [promptResult, setPromptResult] = useState("");
  const [actionSheetResult, setActionSheetResult] = useState("");
  const [navBarHeight, setNavBarHeight] = useState<number | null>(null);

  useEffect(() => {
    // Listen for confirm dialog events
    const handleConfirm = (e: any) => {
      if (e.param) {
        setConfirmResult(`Button clicked: ${e.param.type}`);
      }
    };

    // Listen for action sheet events
    const handleActionSheet = (e: any) => {
      if (e.param) {
        setActionSheetResult(`Selected: ${e.param.type || "Cancelled"}`);
      }
    };

    document.addEventListener("wv.dialog", handleConfirm);
    document.addEventListener("wv.actionsheet", handleActionSheet);

    return () => {
      document.removeEventListener("wv.dialog", handleConfirm);
      document.removeEventListener("wv.actionsheet", handleActionSheet);
    };
  }, []);

  const handleShowLoading = async () => {
    setError("");
    setSuccess("");
    try {
      await showLoadingBox();
      setSuccess("Loading box shown");

      // Auto hide after 2 seconds
      setTimeout(async () => {
        await hideLoadingBox();
        setSuccess("Loading box hidden");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show loading");
    }
  };

  const handleHideKeyboard = async () => {
    setError("");
    setSuccess("");
    try {
      await hideKeyboard();
      setSuccess("Keyboard hidden successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hide keyboard");
    }
  };

  const handleShowToast = async () => {
    setError("");
    setSuccess("");
    try {
      await toast({ message: toastMessage, duration: toastDuration });
      setSuccess("Toast shown successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show toast");
    }
  };

  const handleShowAlert = async () => {
    setError("");
    setSuccess("");
    try {
      await alert({
        message: alertMessage,
        okbutton: "OK",
        identifier: "alert_demo",
      });
      setSuccess("Alert shown successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show alert");
    }
  };

  const handleShowConfirm = async () => {
    setError("");
    setSuccess("");
    setConfirmResult("");
    try {
      await confirm({
        message: confirmMessage,
        okbutton: "OK",
        cancelbutton: "Cancel",
        _index: 12345,
      });
      setSuccess("Confirm dialog shown");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show confirm");
    }
  };

  const handleShowPrompt = async () => {
    setError("");
    setSuccess("");
    setPromptResult("");
    try {
      const result = await prompt({
        title: "Enter something",
        message: "Please enter your input",
        hint: "Type here...",
        okbutton: "Submit",
        cancelbutton: "Cancel",
      });
      setPromptResult(
        result.ok ? `You entered: ${result.inputValue}` : "Prompt cancelled"
      );
      setSuccess("Prompt shown successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to show prompt");
    }
  };

  const handleShowActionSheet = async () => {
    setError("");
    setSuccess("");
    setActionSheetResult("");
    try {
      await showActionSheet({
        title: "Choose an option",
        _index: 32768,
        buttons: ["Option 1", "Option 2", "Option 3", "Option 4"],
      });
      setSuccess("Action sheet shown");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to show action sheet"
      );
    }
  };

  const handleUpdateNavBar = async () => {
    setError("");
    setSuccess("");
    try {
      await updateNavBar({
        title: "Custom Title",
        titleColor: "#FF00FF",
        backgroundColor: "#00FFFF",
        barStyle: "normal",
        hideBackButton: "false",
        theme: "dark",
      });
      setSuccess("Navigation bar updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update nav bar");
    }
  };

  const handleGetNavBarHeight = async () => {
    setError("");
    setSuccess("");
    try {
      const result = await getNavBarHeight();
      setNavBarHeight(result.height);
      setSuccess(`Nav bar height: ${result.height}px`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get nav bar height"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          UI Interaction
        </h1>
        <p className="text-gray-600">
          Test various UI interaction APIs including loading, dialogs, toasts,
          and more
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <FiCheckCircle className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Loading Box */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiLoader className="mr-2 text-blue-600" />
            Loading Box
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Show and hide loading indicators
          </p>
          <button
            onClick={handleShowLoading}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Loading (Auto-hide in 2s)
          </button>
        </div>

        {/* Keyboard */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiCommand className="mr-2 text-purple-600" />
            Keyboard Control
          </h2>
          <input
            type="text"
            placeholder="Type something then click hide"
            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
          <button
            onClick={handleHideKeyboard}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Hide Keyboard
          </button>
        </div>

        {/* Toast */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiMessageSquare className="mr-2 text-green-600" />
            Toast Message
          </h2>
          <input
            type="text"
            value={toastMessage}
            onChange={(e) => setToastMessage(e.target.value)}
            placeholder="Toast message"
            className="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <input
            type="number"
            value={toastDuration}
            onChange={(e) => setToastDuration(Number(e.target.value))}
            placeholder="Duration (seconds)"
            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <button
            onClick={handleShowToast}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Toast
          </button>
        </div>

        {/* Alert */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiAlertCircle className="mr-2 text-orange-600" />
            Alert Dialog
          </h2>
          <input
            type="text"
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            placeholder="Alert message"
            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
          <button
            onClick={handleShowAlert}
            className="w-full py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Alert
          </button>
        </div>

        {/* Confirm */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheckCircle className="mr-2 text-indigo-600" />
            Confirm Dialog
          </h2>
          <input
            type="text"
            value={confirmMessage}
            onChange={(e) => setConfirmMessage(e.target.value)}
            placeholder="Confirm message"
            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={handleShowConfirm}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Confirm
          </button>
          {confirmResult && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-800">{confirmResult}</p>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiMessageSquare className="mr-2 text-pink-600" />
            Prompt Dialog
          </h2>
          <button
            onClick={handleShowPrompt}
            className="w-full py-3 px-6 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Prompt
          </button>
          {promptResult && (
            <div className="mt-3 p-3 bg-pink-50 rounded-lg">
              <p className="text-sm text-pink-800">{promptResult}</p>
            </div>
          )}
        </div>

        {/* Action Sheet */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiGrid className="mr-2 text-teal-600" />
            Action Sheet
          </h2>
          <button
            onClick={handleShowActionSheet}
            className="w-full py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Show Action Sheet
          </button>
          {actionSheetResult && (
            <div className="mt-3 p-3 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-800">{actionSheetResult}</p>
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiNavigation className="mr-2 text-cyan-600" />
            Navigation Bar
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleUpdateNavBar}
              className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
            >
              Update Nav Bar
            </button>
            <button
              onClick={handleGetNavBarHeight}
              className="w-full py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
            >
              Get Nav Bar Height
            </button>
            {navBarHeight !== null && (
              <div className="p-3 bg-cyan-50 rounded-lg">
                <p className="text-sm text-cyan-800">
                  Height: {navBarHeight}px
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Interaction APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUI.showLoadingBox
            </code>{" "}
            - Show loading indicator
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUI.hideKeyboard
            </code>{" "}
            - Hide soft keyboard
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUIToast.toast
            </code>{" "}
            - Show toast messages
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUIDialog.alert
            </code>{" "}
            - Show alert dialogs
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUIDialog.confirm
            </code>{" "}
            - Show confirm dialogs
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUIDialog.prompt
            </code>{" "}
            - Show input prompts
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVUIActionSheet.show
            </code>{" "}
            - Show action sheets
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNavigationBar.update
            </code>{" "}
            - Customize navigation bar
          </li>
        </ul>
      </div>
    </div>
  );
};
