import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { FiPlay, FiTrash2, FiCopy, FiCode } from "react-icons/fi";
import { toast } from "../../api/interaction/toast";

const DEFAULT_CODE = `// Example 1: Using pre-loaded APIs (easy way)
await toast({
  message: "Hello from API Playground!",
  duration: 2
});

// Example 2: Direct WindVane.call for custom APIs (your use case!)
const customApiResult = await new Promise((resolve, reject) => {
  WindVane.call(
    "ViettelDevServices",  // Your custom service class
    "clearCache",          // Your custom method
    { appId: "test123" },  // Your custom params
    (result) => resolve(result),  // Success callback
    (error) => reject(error)      // Error callback
  );
});

// Try other pre-loaded APIs:
// - await getSystemInfo()
// - await getBatteryInfo()
// - await getNetworkType()
// - await appState()

return {
  success: true,
  message: "Custom API called successfully!",
  customResult: customApiResult
};`;

export const PlaygroundPage: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Add type definitions for WindVane
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare global {
        interface Window {
          WindVane: {
            call: (
              className: string,
              methodName: string,
              params: any,
              options: any,
              onSuccess: (result: any) => void,
              onError: (error: any) => void
            ) => void;
          };
        }
      }
      export {};
      `,
      "file:///windvane.d.ts",
    );
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setOutput("");
    setError("");

    try {
      // Create an async function from the code
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;

      // Import all available API functions
      const apiContext = {
        // Interaction APIs
        toast: (await import("../../api/interaction/toast")).toast,
        alert: (await import("../../api/interaction/alert")).alert,
        confirm: (await import("../../api/interaction/confirm")).confirm,
        prompt: (await import("../../api/interaction/prompt")).prompt,
        showActionSheet: (await import("../../api/interaction/showActionSheet"))
          .showActionSheet,
        showLoadingBox: (await import("../../api/interaction/showLoadingBox"))
          .showLoadingBox,
        hideLoadingBox: (await import("../../api/interaction/hideLoadingBox"))
          .hideLoadingBox,
        hideKeyboard: (await import("../../api/interaction/hideKeyboard"))
          .hideKeyboard,
        getNavBarHeight: (await import("../../api/interaction/getNavBarHeight"))
          .getNavBarHeight,
        updateNavBar: (await import("../../api/interaction/updateNavBar"))
          .updateNavBar,

        // Base APIs
        copyToClipboard: (await import("../../api/base/copyToClipboard"))
          .copyToClipboard,
        canIUse: (await import("../../api/base/canIUse")).canIUse,
        openBrowser: (await import("../../api/base/openBrowser")).openBrowser,
        setBackgroundColor: (await import("../../api/base/setBackgroundColor"))
          .setBackgroundColor,
        closeMiniApp: (await import("../../api/base/closeMiniApp"))
          .closeMiniApp,
        isInstall: (await import("../../api/base/isInstall")).isInstall,
        isAppsInstalled: (await import("../../api/base/isAppsInstalled"))
          .isAppsInstalled,
        notify: (await import("../../api/base/notify")).notify,

        // Device APIs
        getSystemInfo: (await import("../../api/device/getSystemInfo"))
          .getSystemInfo,
        isSimulator: (await import("../../api/device/nativeDetector"))
          .isSimulator,
        getCurrentUsage: (await import("../../api/device/nativeDetector"))
          .getCurrentUsage,
        getDeviceYear: (await import("../../api/device/nativeDetector"))
          .getDeviceYear,
        getModelInfo: (await import("../../api/device/nativeDetector"))
          .getModelInfo,
        getSafeAreaInsets: (await import("../../api/device/nativeDetector"))
          .getSafeAreaInsets,

        // App APIs
        appState: (await import("../../api/app/appState")).appState,
        getNotificationSettings: (
          await import("../../api/app/getNotificationSettings")
        ).getNotificationSettings,
        openSettings: (await import("../../api/app/openSettings")).openSettings,

        // Authentication
        getAuthCode: (await import("../../api/authentication/getAuthCode"))
          .getAuthCode,

        // Network
        getNetworkType: (await import("../../api/network/getNetworkType"))
          .getNetworkType,

        // Battery
        getBatteryInfo: (await import("../../api/battery/getBatteryInfo"))
          .getBatteryInfo,
        getBatteryInfoSync: (
          await import("../../api/battery/getBatteryInfoSync")
        ).getBatteryInfoSync,

        // Screen
        captureScreen: (await import("../../api/screen/capture")).captureScreen,
        setScreenBrightness: (await import("../../api/screen/brightness"))
          .setScreenBrightness,
        getScreenBrightness: (await import("../../api/screen/brightness"))
          .getScreenBrightness,
        getOrientation: (await import("../../api/screen/getOrientation"))
          .getOrientation,
        setOrientation: (await import("../../api/screen/setOrientation"))
          .setOrientation,

        // Motion
        vibrate: (await import("../../api/motion/vibrate")).vibrate,
        startCompass: (await import("../../api/motion/compass")).startCompass,
        stopCompass: (await import("../../api/motion/compass")).stopCompass,
        startAccelerometer: (await import("../../api/motion/accelerometer"))
          .startAccelerometer,
        stopAccelerometer: (await import("../../api/motion/accelerometer"))
          .stopAccelerometer,
        listeningShake: (await import("../../api/motion/shake")).listeningShake,
        listenBlow: (await import("../../api/motion/blow")).listenBlow,
        stopListenBlow: (await import("../../api/motion/blow")).stopListenBlow,
        listenGyro: (await import("../../api/motion/gyro")).listenGyro,

        // Sound
        beep: (await import("../../api/sound/beep")).beep,

        // Call
        dial: (await import("../../api/call/dial")).dial,
        call: (await import("../../api/call/call")).call,

        // Location
        getLocation: (await import("../../api/location/getLocation"))
          .getLocation,
        searchLocation: (await import("../../api/location/searchLocation"))
          .searchLocation,

        // Scan
        scan: (await import("../../api/scan/scan")).scan,

        // Contacts
        askAuth: (await import("../../api/contacts/askAuth")).askAuth,
        authStatus: (await import("../../api/contacts/authStatus")).authStatus,
        choose: (await import("../../api/contacts/choose")).choose,
        find: (await import("../../api/contacts/find")).find,
        addPhoneContact: (await import("../../api/contacts/addPhoneContact"))
          .addPhoneContact,

        // File APIs
        chooseFiles: (await import("../../api/file/chooseFiles")).chooseFiles,
        downloadFile: (await import("../../api/file/downloadFile"))
          .downloadFile,
        uploadFile: (await import("../../api/file/uploadFile")).uploadFile,
        readFile: (await import("../../api/file/readFile")).readFile,
        writeFile: (await import("../../api/file/writeFile")).writeFile,
        getFileInfo: (await import("../../api/file/getFileInfo")).getFileInfo,
        getDataByFilePath: (await import("../../api/file/getDataByFilePath"))
          .getDataByFilePath,

        // Multimedia
        takePhoto: (await import("../../api/multimedia/takePhoto")).takePhoto,
        saveImage: (await import("../../api/multimedia/saveImage")).saveImage,
        chooseVideo: (await import("../../api/multimedia/chooseVideo"))
          .chooseVideo,
        saveVideoToPhotosAlbum: (
          await import("../../api/multimedia/saveVideoToPhotosAlbum")
        ).saveVideoToPhotosAlbum,
        playSystemSound: (await import("../../api/multimedia/playSystemSound"))
          .playSystemSound,

        // Storage
        getItem: (await import("../../api/multimedia/getItem")).getItem,
        setItem: (await import("../../api/multimedia/setItem")).setItem,
        removeItem: (await import("../../api/multimedia/removeItem"))
          .removeItem,
        clearStorage: (await import("../../api/multimedia/clearStorage"))
          .clearStorage,
        clearStorageSync: (
          await import("../../api/multimedia/clearStorageSync")
        ).clearStorageSync,

        // Cookie
        readCookie: (await import("../../api/cookie/readCookie")).readCookie,
        writeCookie: (await import("../../api/cookie/writeCookie")).writeCookie,

        // Permissions
        authorize: (await import("../../api/permissions/authorize")).authorize,
        getSetting: (await import("../../api/permissions/getSetting"))
          .getSetting,

        // Bluetooth
        requestAuthorization: (
          await import("../../api/bluetooth/requestAuthorization")
        ).requestAuthorization,
        bluetoothScan: (await import("../../api/bluetooth/bluetoothScan"))
          .bluetoothScan,
        stopScan: (await import("../../api/bluetooth/stopScan")).stopScan,
        connect: (await import("../../api/bluetooth/connect")).connect,
        disconnect: (await import("../../api/bluetooth/disconnect")).disconnect,
        getServices: (await import("../../api/bluetooth/getServices"))
          .getServices,
        getCharacteristics: (
          await import("../../api/bluetooth/getCharacteristics")
        ).getCharacteristics,
        writeValue: (await import("../../api/bluetooth/writeValue")).writeValue,
        readValue: (await import("../../api/bluetooth/readValue")).readValue,
        startNotifications: (
          await import("../../api/bluetooth/startNotifications")
        ).startNotifications,
        stopNotifications: (
          await import("../../api/bluetooth/stopNotifications")
        ).stopNotifications,

        // Viettel specific
        clearAuthCache: (await import("../../api/viettel/dev/clearAuthCache"))
          .clearAuthCache,

        // Utilities
        console: console,
        JSON: JSON,
        window: window,

        // Direct WindVane access for custom APIs
        WindVane: window.WindVane,
      };

      // Remove import statements from the code
      let processedCode = code
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, "")
        .replace(/import\s*\{[^}]*\}\s*from\s*['"].*?['"];?\n?/g, "");

      // Create function with API context
      const userFunction = new AsyncFunction(
        ...Object.keys(apiContext),
        processedCode,
      );

      // Execute the function with the API context
      const result = await userFunction(...Object.values(apiContext));

      // Display the result
      if (result !== undefined) {
        setOutput(
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result),
        );
      } else {
        setOutput("Execution completed successfully (no return value)");
      }
    } catch (err: any) {
      // Better error formatting
      let errorMessage = "";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.stack) {
          errorMessage += "\n\nStack trace:\n" + err.stack;
        }
      } else if (typeof err === "object" && err !== null) {
        try {
          errorMessage = JSON.stringify(err, null, 2);
        } catch {
          errorMessage = String(err);
        }
      } else {
        errorMessage = String(err);
      }
      setError(errorMessage);
      console.error("Execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearCode = () => {
    setCode(DEFAULT_CODE);
    setOutput("");
    setError("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ message: "Code copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FiCode className="text-blue-600" />
                API Playground
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Test and experiment with WindVane APIs in real-time
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copyCode}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiCopy size={14} />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                onClick={clearCode}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                onClick={executeCode}
                disabled={isExecuting}
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                <FiPlay size={14} />
                {isExecuting ? "Running..." : "Run Code"}
              </button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gray-800 px-3 sm:px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <span className="text-gray-300 text-xs sm:text-sm font-medium">
              TypeScript Editor
            </span>
            <span className="text-gray-400 text-xs hidden sm:inline">
              All WindVane APIs are available
            </span>
          </div>
          <div className="border-b border-gray-200">
            <Editor
              height="350px"
              defaultLanguage="typescript"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Success Output */}
          {output && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-600 px-3 sm:px-4 py-2">
                <span className="text-white text-xs sm:text-sm font-medium">
                  Output (Success)
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <pre className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap font-mono bg-green-50 p-3 sm:p-4 rounded border border-green-200 overflow-x-auto">
                  {output}
                </pre>
              </div>
            </div>
          )}

          {/* Error Output */}
          {error && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red-600 px-3 sm:px-4 py-2">
                <span className="text-white text-xs sm:text-sm font-medium">
                  Error (Debug)
                </span>
              </div>
              <div className="p-3 sm:p-4">
                <pre className="text-xs sm:text-sm text-red-700 whitespace-pre-wrap font-mono bg-red-50 p-3 sm:p-4 rounded border border-red-200 overflow-x-auto">
                  {error}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3">
            Quick Guide
          </h3>
          <ul className="space-y-2 text-blue-800 text-xs sm:text-sm">
            <li>
              • All WindVane APIs are pre-imported and ready to use (no need for
              import statements)
            </li>
            <li>• Write your code using async/await syntax for API calls</li>
            <li>
              • Use{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                return
              </code>{" "}
              to display results in the output panel
            </li>
            <li>
              • Errors will be displayed in the debug panel below the editor
            </li>
            <li>
              • Example APIs:{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                toast
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                getSystemInfo
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                getBatteryInfo
              </code>
              ,{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                getLocation
              </code>
            </li>
            <li>
              • <strong>Custom APIs:</strong> Access{" "}
              <code className="bg-blue-100 px-1 sm:px-2 py-1 rounded text-xs">
                WindVane
              </code>{" "}
              directly to call any custom service
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
