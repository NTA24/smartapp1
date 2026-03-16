import React, { useMemo, useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCopy, FiExternalLink, FiXCircle } from "react-icons/fi";
import { copyToClipboard } from "../../api/base/copyToClipboard";
import { openBrowser } from "../../api/base/openBrowser";
import { closeMiniApp } from "../../api/base/closeMiniApp";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const BaseAPIsPage: React.FC = () => {
  const location = useLocation();
  const [clipboardText, setClipboardText] = useState("Hello from MiniApp!");
  const [browserUrl, setBrowserUrl] = useState("https://www.viettel.com.vn");
  const clipboardRef = useRef<HTMLDivElement>(null);
  const browserRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLDivElement>(null);
  const { run, loading, feedback } = useApiCall();

  const sections = useMemo(
    () => [
      { id: "clipboard", label: "Clipboard", ref: clipboardRef, icon: FiCopy },
      { id: "browser", label: "Browser", ref: browserRef, icon: FiExternalLink },
      { id: "close", label: "Close App", ref: closeRef, icon: FiXCircle },
    ],
    []
  );

  // Handle hash navigation (remains the same)
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    const section = sections.find((s) => s.id === hash);
    if (section?.ref.current) {
      setTimeout(() => {
        section.ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [location.hash, sections]);

  const handleCopyToClipboard = async () => {
    await run(() => copyToClipboard(clipboardText), {
      successMessage: "Text copied to clipboard successfully!",
    });
  };

  const handleOpenBrowser = async () => {
    await run(() => openBrowser(browserUrl), {
      successMessage: "Browser opened successfully",
    });
  };

  const handleCloseMiniApp = async () => {
    if (!window.confirm("Are you sure you want to close this MiniApp?")) {
      return;
    }
    await run(() => closeMiniApp(), {
      successMessage: "Closing MiniApp...",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Base APIs</h1>
        <p className="text-gray-600">
          Core utilities and base functionality for MiniApp development.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 sticky top-0 z-10">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </a>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {feedback && (
        <div className="mb-6">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      {/* Clipboard */}
      <div
        ref={clipboardRef}
        id="clipboard"
        className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiCopy className="mr-2 text-blue-600" />
          Copy to Clipboard
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text to Copy
            </label>
            <input
              type="text"
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={handleCopyToClipboard}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            Copy to Clipboard
          </button>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>API:</strong> <code>WVBase.copyToClipboard</code>
          </div>
        </div>
      </div>

      {/* App Install Check (Temporarily Not Available) */}
      {/*
      <div ref={installRef} id="install" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiSmartphone className="mr-2 text-green-600" />
          Check App Installation
        </h2>
        <div className="space-y-4">
          <div className="opacity-60 italic p-4 text-yellow-700 text-center bg-yellow-50 border border-yellow-100 rounded-lg">
            Coming soon: App installation checks
          </div>
        </div>
      </div>
      */}

      {/* Notify (Temporarily Not Available) */}
      {/*
      <div ref={notifyRef} id="notify" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiBell className="mr-2 text-purple-600" />
          Send Event Notification
        </h2>
        <div className="space-y-4">
          <div className="opacity-60 italic p-4 text-yellow-800 text-center bg-yellow-50 border border-yellow-100 rounded-lg">
            Coming soon: Event notification API
          </div>
        </div>
      </div>
      */}

      {/* Open Browser */}
      <div
        ref={browserRef}
        id="browser"
        className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiExternalLink className="mr-2 text-orange-600" />
          Open External Browser
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="text"
              value={browserUrl}
              onChange={(e) => setBrowserUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={handleOpenBrowser}
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
          >
            Open in Browser
          </button>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>API:</strong> <code>WVBase.openBrowser</code>
          </div>
        </div>
      </div>

      {/* Background Color (Temporarily Not Available) */}
      {/*
      <div ref={backgroundRef} id="background" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiMonitor className="mr-2 text-pink-600" />
          Set Background Color
        </h2>
        <div className="space-y-4">
          <div className="opacity-60 italic p-4 text-yellow-800 text-center bg-yellow-50 border border-yellow-100 rounded-lg">
            Coming soon: Set background color API
          </div>
        </div>
      </div>
      */}

      {/* Can I Use (Temporarily Not Available) */}
      {/*
      <div ref={canUseRef} id="can-use" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiZap className="mr-2 text-indigo-600" />
          Check API Availability
        </h2>
        <div className="space-y-4">
          <div className="opacity-60 italic p-4 text-yellow-800 text-center bg-yellow-50 border border-yellow-100 rounded-lg">
            Coming soon: API availability check
          </div>
        </div>
      </div>
      */}

      {/* Close MiniApp */}
      <div
        ref={closeRef}
        id="close"
        className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-24"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FiXCircle className="mr-2 text-red-600" />
          Close MiniApp
        </h2>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <strong>Warning:</strong> This will close the entire MiniApp
          </div>
          <button
            onClick={handleCloseMiniApp}
            className="w-full py-3 px-6 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            Close MiniApp
          </button>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>API:</strong> <code>WVMiniApp.close</code>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Base APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • <strong>Currently available:</strong> Clipboard, Open Browser,
            Close App
          </li>
          <li>
            • App Install Check, Event Notification, Set Background Color, and
            API Availability will be available soon.
          </li>
          <li>• See documentation for up-to-date API support and roadmap.</li>
        </ul>
      </div>
    </div>
  );
};
