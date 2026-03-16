import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiAlertCircle, FiSave, FiArrowLeft } from "react-icons/fi";

export const BrowserPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);

  // Track form changes
  useEffect(() => {
    const hasData =
      formData.name.trim() !== "" ||
      formData.email.trim() !== "" ||
      formData.message.trim() !== "";
    setHasUnsavedChanges(hasData);
  }, [formData]);

  // Handle browser back button and navigation attempts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", location.pathname);
        setShowConfirmDialog(true);
        setNextLocation("back");
      }
    };

    // Add current state to history to detect back button
    window.history.pushState(null, "", location.pathname);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Simulate save
    alert("Form data saved successfully!");
    setFormData({ name: "", email: "", message: "" });
    setHasUnsavedChanges(false);
  };

  const handleNavigateAway = (path: string) => {
    if (hasUnsavedChanges) {
      setNextLocation(path);
      setShowConfirmDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleConfirmLeave = () => {
    setHasUnsavedChanges(false);
    setShowConfirmDialog(false);
    if (nextLocation === "back") {
      navigate(-1);
    } else if (nextLocation) {
      navigate(nextLocation);
    }
  };

  const handleCancelLeave = () => {
    setShowConfirmDialog(false);
    setNextLocation(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Browser Interaction
        </h1>
        <p className="text-gray-600">
          Demonstrating browser back button interception and form data
          protection
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <FiAlertCircle className="mr-2 text-blue-600" />
            Form Data Protection
          </h2>
          <p className="text-sm text-gray-600">
            Try filling out the form below and pressing the browser's back
            button or navigating away. You'll be prompted to confirm if you
            want to lose your unsaved changes.
          </p>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
            <FiAlertCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">You have unsaved changes</p>
              <p className="mt-1">
                Your form data will be lost if you navigate away without
                saving.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your message"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <FiSave className="mr-2" />
            Save Form
          </button>
          <button
            onClick={() => handleNavigateAway("/")}
            className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
          >
            <FiArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>

        {/* Test Navigation Links */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Test Navigation
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Click these links to test the unsaved changes warning:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleNavigateAway("/")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigateAway("/interaction")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors"
            >
              Interaction Page
            </button>
            <button
              onClick={() => handleNavigateAway("/multimedia")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors"
            >
              Multimedia
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start mb-4">
                <FiAlertCircle className="text-yellow-500 text-2xl mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Do you want to save the form data?
                  </h3>
                  <p className="text-sm text-gray-600">
                    You have unsaved changes. If you leave this page, your
                    changes will be lost.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Leave Without Saving
                </button>
                <button
                  onClick={handleCancelLeave}
                  className="flex-1 py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-lg transition-colors"
                >
                  Stay on Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          How It Works
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • <strong>beforeunload</strong> event prevents page refresh/close
            when form has data
          </li>
          <li>
            • <strong>popstate</strong> event intercepts browser back button
            navigation
          </li>
          <li>
            • Custom navigation wrapper shows confirmation dialog before routing
          </li>
          <li>• Form state tracking detects when user has entered any data</li>
          <li>
            • History API manipulation ensures back button can be intercepted
          </li>
        </ul>
      </div>
    </div>
  );
};
