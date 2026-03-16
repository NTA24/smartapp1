import React, { useState } from "react";
import { FeatureCard } from "../components/FeatureCard";
import {
  FiLock,
  FiUser,
  FiGrid,
  FiNavigation,
  FiImage,
  FiFile,
  FiMapPin,
  FiDatabase,
  FiSmartphone,
  FiWifi,
  FiMonitor,
  FiActivity,
  FiVolume2,
  FiPhone,
  FiUsers,
  FiCamera,
  FiZap,
  FiBluetooth,
  FiCode,
  FiArrowLeft,
  FiTerminal,
} from "react-icons/fi";

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const featureCategories = [
    {
      icon: FiCode,
      title: "API Playground",
      description: "Interactive code editor for testing APIs",
      color: "violet",
      features: [
        "Live TypeScript editor",
        "Execute APIs in real-time",
        "Error debugging panel",
        "All WindVane APIs available",
      ],
      demoPath: "/playground",
    },
    {
      icon: FiArrowLeft,
      title: "Browser Interaction",
      description: "Browser back button and form data protection",
      color: "red",
      features: [
        "Intercept browser back button",
        "Form data protection",
        "Unsaved changes warning",
        "Custom confirmation dialogs",
      ],
      demoPath: "/browser",
    },
    {
      icon: FiLock,
      title: "Device Permissions",
      description: "Request and manage device permissions",
      color: "blue",
      features: [
        "Get device permissions status",
        "Request camera permission",
        "Request location permission",
        "Authorization handling",
      ],
      demoPath: "/permissions/device",
    },
    {
      icon: FiUser,
      title: "User Data Permission",
      description: "SSO authentication and user authorization",
      color: "purple",
      features: [
        "Get auth code via wv.getAuthCode",
        "SSO integration",
        "User authentication flow",
      ],
      demoPath: "/authentication/sso",
    },
    {
      icon: FiGrid,
      title: "Base APIs",
      description: "Core utilities and base functionality",
      color: "green",
      features: [
        "Clipboard operations",
        "Check app installation",
        "Toast notifications",
        "Open external browser",
        "Background color control",
        "API availability check",
        "Close MiniApp",
      ],
      demoPath: "/base/clipboard",
    },
    {
      icon: FiNavigation,
      title: "Navigation",
      description: "Page navigation and routing",
      color: "indigo",
      features: [
        "Navigate back (pop)",
        "Navigate forward (push)",
        "Navigate to other MiniApps",
        "Deep linking support",
      ],
      demoPath: "/navigation/pop",
    },
    {
      icon: FiGrid,
      title: "Interaction",
      description: "UI interactions, dialogs, and alerts",
      color: "pink",
      features: [
        "Loading indicators",
        "Keyboard control",
        "Toast messages",
        "Alert, confirm, prompt dialogs",
        "Action sheets",
        "Navigation bar customization",
      ],
      demoPath: "/interaction/loading",
    },
    {
      icon: FiImage,
      title: "Multimedia",
      description: "Images, video, audio, and camera",
      color: "orange",
      features: [
        "Save images to album",
        "Choose and save videos",
        "Play system sounds",
        "Take photos with camera",
        "Local storage operations",
      ],
      demoPath: "/multimedia/image",
    },
    {
      icon: FiFile,
      title: "File",
      description: "File operations and management",
      color: "yellow",
      features: [
        "Read and write files",
        "Get file information",
        "Download files",
        "Upload files",
        "Choose files from device",
      ],
      demoPath: "/file/read-write",
    },
    {
      icon: FiMapPin,
      title: "Geographical Location",
      description: "GPS and location services",
      color: "red",
      features: ["Get current location", "Search locations", "GPS coordinates"],
      demoPath: "/location/get",
    },
    {
      icon: FiDatabase,
      title: "Cookie",
      description: "Cookie read and write operations",
      color: "teal",
      features: ["Read cookies", "Write cookies", "Cookie management"],
      demoPath: "/cookie/operations",
    },
    {
      icon: FiSmartphone,
      title: "Device",
      description: "Device information and capabilities",
      color: "cyan",
      features: [
        "Get system information",
        "Device detection",
        "Check if simulator",
        "Get device year",
        "Safe area insets",
      ],
      demoPath: "/device/system-info",
    },
    {
      icon: FiWifi,
      title: "Network",
      description: "Network status and connectivity",
      color: "blue",
      features: [
        "Get network type",
        "Check connectivity",
        "Network status monitoring",
      ],
      demoPath: "/network/type",
    },
    {
      icon: FiMonitor,
      title: "Screen",
      description: "Screen orientation and brightness",
      color: "purple",
      features: [
        "Get screen orientation",
        "Set screen orientation",
        "Adjust brightness",
        "Screen capture",
      ],
      demoPath: "/screen/orientation",
    },
    {
      icon: FiActivity,
      title: "Motion Detection",
      description: "Accelerometer, gyroscope, and motion events",
      color: "green",
      features: [
        "Detect blow gesture",
        "Detect shake gesture",
        "Accelerometer data",
        "Gyroscope data",
        "Compass data",
        "Device vibration",
      ],
      demoPath: "/motion/gestures",
    },
    {
      icon: FiVolume2,
      title: "Sound",
      description: "Sound notifications and alerts",
      color: "orange",
      features: ["Play beep sound", "System notifications"],
      demoPath: "/sound/beep",
    },
    {
      icon: FiPhone,
      title: "Call",
      description: "Phone call functionality",
      color: "pink",
      features: ["Dial phone number", "Make phone calls"],
      demoPath: "/call/dial",
    },
    {
      icon: FiSmartphone,
      title: "App Information",
      description: "Application state and settings",
      color: "indigo",
      features: ["Get app state", "Notification settings", "Open app settings"],
      demoPath: "/app/state",
    },
    {
      icon: FiUsers,
      title: "Address Book",
      description: "Access and manage contacts",
      color: "teal",
      features: [
        "Request contacts permission",
        "Check authorization status",
        "Choose contacts",
        "Find contacts",
        "Add phone contact",
      ],
      demoPath: "/contacts/auth",
    },
    {
      icon: FiCamera,
      title: "Scan",
      description: "QR code and barcode scanning",
      color: "cyan",
      features: ["Scan QR codes", "Scan barcodes", "Camera integration"],
      demoPath: "/scan/qr",
    },
    {
      icon: FiZap,
      title: "Battery",
      description: "Battery information",
      color: "yellow",
      features: [
        "Get battery level",
        "Battery charging status",
        "Battery info sync/async",
      ],
      demoPath: "/battery/info",
    },
    {
      icon: FiBluetooth,
      title: "Bluetooth",
      description: "Bluetooth Low Energy (BLE) operations",
      color: "blue",
      features: [
        "Request BLE authorization",
        "Scan for devices",
        "Connect to devices",
        "Read/write characteristics",
        "Notifications handling",
      ],
      demoPath: "/bluetooth/scan",
    },
    {
      icon: FiTerminal,
      title: "Custom JSAPI",
      description: "VTDeviceService custom device APIs",
      color: "violet",
      features: [
        "Query contacts with filters",
        "Add Mini App to white list",
        "Remove Mini App from white list",
      ],
      demoPath: "/custom-jsapi",
    },
    {
      icon: FiActivity,
      title: "Other Features",
      description: "App lifecycle and special events",
      color: "purple",
      features: [
        "WindVane ready event",
        "App background event",
        "App active event",
        "Pull to refresh",
        "Infinite scroll",
      ],
      demoPath: "/events/lifecycle",
    },
  ];

  const filteredFeatures = featureCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.features.some((feature) =>
        feature.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              WindVane API Showcase
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive demos of WindVane APIs for Viettel MiniApp Platform
              development
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search APIs... (e.g., 'camera', 'location', 'bluetooth')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none shadow-sm text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            API Categories
          </h2>
          <p className="text-gray-600">
            {filteredFeatures.length} categor
            {filteredFeatures.length !== 1 ? "ies" : "y"} available
          </p>
        </div>

        {filteredFeatures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((category, index) => (
              <FeatureCard
                key={index}
                icon={category.icon}
                title={category.title}
                description={category.description}
                features={category.features}
                demoPath={category.demoPath}
                color={category.color}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No APIs found matching "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24</div>
              <div className="text-gray-600">API Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">80+</div>
              <div className="text-gray-600">WindVane APIs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                100%
              </div>
              <div className="text-gray-600">TypeScript</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">
                Official
              </div>
              <div className="text-gray-600">Documentation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
