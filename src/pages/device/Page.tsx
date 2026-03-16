import React from "react";
import { SystemInfoComponent } from "./SystemInfoComponent";
import { DetectorComponent } from "./DetectorComponent";

export const DevicePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Device</h1>
        <p className="text-gray-600">
          Device information and capabilities detection
        </p>
      </div>

      <div className="space-y-6">
        <SystemInfoComponent />
        <DetectorComponent />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Device APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVSystem.getSystemInfo
            </code>{" "}
            - Get comprehensive system information (async)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVSystem.getSystemInfoSync
            </code>{" "}
            - Get system information synchronously
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNativeDetector.isSimulator
            </code>{" "}
            - Check if running on simulator/emulator
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNativeDetector.getCurrentUsage
            </code>{" "}
            - Get CPU and memory usage (use sparingly)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNativeDetector.getDeviceYear
            </code>{" "}
            - Get device release year (performance indicator)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNativeDetector.getModelInfo
            </code>{" "}
            - Get device brand, model, and platform details
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVNativeDetector.getSafeAreaInsets
            </code>{" "}
            - Get safe area insets (iOS 11+, full-screen devices)
          </li>
        </ul>
      </div>
    </div>
  );
};
