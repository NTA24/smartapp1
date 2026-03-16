import React, { useState, useEffect } from "react";
import { FiActivity } from "react-icons/fi";
import { listenBlow, stopListenBlow } from "../../api/motion/blow";
import { listenGyro } from "../../api/motion/gyro";
import { listeningShake } from "../../api/motion/shake";
import { vibrate } from "../../api/motion/vibrate";
import {
  startAccelerometer,
  stopAccelerometer,
} from "../../api/motion/accelerometer";
import { startCompass, stopCompass } from "../../api/motion/compass";
import { useApiCall } from "../../hooks/useApiCall";
import { StatusMessage } from "../../components/common/StatusMessage";

export const MotionPage: React.FC = () => {
  const [blowActive, setBlowActive] = useState(false);
  const [blowData, setBlowData] = useState("");
  const [gyroActive, setGyroActive] = useState(false);
  const [gyroData, setGyroData] = useState("");
  const [shakeActive, setShakeActive] = useState(false);
  const [shakeData, setShakeData] = useState("");
  const [vibrateDuration, setVibrateDuration] = useState(1000);
  const [accelerometerActive, setAccelerometerActive] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState("");
  const [compassActive, setCompassActive] = useState(false);
  const [compassData, setCompassData] = useState("");
  const { run, feedback, showFeedback, loading } = useApiCall();

  useEffect(() => {
    const handleBlow = (e: any) => {
      setBlowData(`Blow detected! Pass: ${e.param?.pass || "N/A"}`);
    };

    const handleGyro = (e: any) => {
      if (e.param) {
        setGyroData(
          `X: ${e.param.x?.toFixed(3)}, Y: ${e.param.y?.toFixed(
            3
          )}, Z: ${e.param.z?.toFixed(3)}`
        );
      }
    };

    const handleShake = (e: any) => {
      if (e.param) {
        setShakeData(
          `Shake detected! X: ${e.param.x?.toFixed(2)}, Y: ${e.param.y?.toFixed(
            2
          )}, Z: ${e.param.z?.toFixed(2)}`
        );
      }
    };

    const handleAccelerometer = (e: any) => {
      if (e.param) {
        setAccelerometerData(
          `X: ${e.param.x?.toFixed(3)}, Y: ${e.param.y?.toFixed(
            3
          )}, Z: ${e.param.z?.toFixed(3)}`
        );
      }
    };

    const handleCompass = (e: any) => {
      if (e.param) {
        setCompassData(
          `Direction: ${e.param.direction}°, Time: ${e.param.timestamp}`
        );
      }
    };

    document.addEventListener("motion.blow", handleBlow);
    document.addEventListener("motion.gyro", handleGyro);
    document.addEventListener("motion.shake", handleShake);
    document.addEventListener(
      "WVMotion.Event.accelerometer",
      handleAccelerometer
    );
    document.addEventListener("WVMotion.Event.compass", handleCompass);

    return () => {
      document.removeEventListener("motion.blow", handleBlow);
      document.removeEventListener("motion.gyro", handleGyro);
      document.removeEventListener("motion.shake", handleShake);
      document.removeEventListener(
        "WVMotion.Event.accelerometer",
        handleAccelerometer
      );
      document.removeEventListener("WVMotion.Event.compass", handleCompass);
    };
  }, []);

  const handleToggleBlow = async () => {
    if (blowActive) {
      await run(() => stopListenBlow(), {
        successMessage: "Blow detection stopped",
      });
      setBlowActive(false);
      setBlowData("");
    } else {
      await run(() => listenBlow({ time: 0 }), {
        successMessage: "Blow detection started",
      });
      setBlowActive(true);
    }
  };

  const handleToggleGyro = async () => {
    if (gyroActive) {
      await run(() => listenGyro({ on: false }), {
        successMessage: "Gyroscope stopped",
      });
      setGyroActive(false);
      setGyroData("");
    } else {
      await run(() => listenGyro({ on: true, frequency: 100 }), {
        successMessage: "Gyroscope started",
      });
      setGyroActive(true);
    }
  };

  const handleToggleShake = async () => {
    if (shakeActive) {
      await run(() => listeningShake({ on: false }), {
        successMessage: "Shake detection stopped",
      });
      setShakeActive(false);
      setShakeData("");
    } else {
      await run(() => listeningShake({ on: true, frequency: 500 }), {
        successMessage: "Shake detection started",
      });
      setShakeActive(true);
    }
  };

  const handleVibrate = async () => {
    await run(() => vibrate({ duration: vibrateDuration }), {
      successMessage: `Vibrating for ${vibrateDuration}ms`,
    });
  };

  const handleToggleAccelerometer = async () => {
    if (accelerometerActive) {
      await run(() => stopAccelerometer(), {
        successMessage: "Accelerometer stopped",
      });
      setAccelerometerActive(false);
      setAccelerometerData("");
    } else {
      await run(() => startAccelerometer({ interval: "normal" }), {
        successMessage: "Accelerometer started",
      });
      setAccelerometerActive(true);
    }
  };

  const handleToggleCompass = async () => {
    if (compassActive) {
      await run(() => stopCompass(), { successMessage: "Compass stopped" });
      setCompassActive(false);
      setCompassData("");
    } else {
      await run(() => startCompass({ interval: "normal" }), {
        successMessage: "Compass started",
      });
      setCompassActive(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Motion Detection
        </h1>
        <p className="text-gray-600">
          Accelerometer, gyroscope, compass, and gesture detection
        </p>
      </div>

      {feedback && (
        <div className="mb-6">
          <StatusMessage type={feedback.type} message={feedback.message} />
        </div>
      )}

      <div className="space-y-6">
        {/* Blow Detection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-blue-600" />
            Blow Detection
          </h2>
          <button
            onClick={handleToggleBlow}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : blowActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {blowActive ? "Stop Blow Detection" : "Start Blow Detection"}
          </button>
          {blowData && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{blowData}</p>
            </div>
          )}
        </div>

        {/* Gyroscope */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-purple-600" />
            Gyroscope
          </h2>
          <button
            onClick={handleToggleGyro}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : gyroActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {gyroActive ? "Stop Gyroscope" : "Start Gyroscope"}
          </button>
          {gyroData && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">{gyroData}</p>
            </div>
          )}
        </div>

        {/* Shake Detection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-green-600" />
            Shake Detection
          </h2>
          <button
            onClick={handleToggleShake}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : shakeActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {shakeActive ? "Stop Shake Detection" : "Start Shake Detection"}
          </button>
          {shakeData && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">{shakeData}</p>
            </div>
          )}
        </div>

        {/* Vibration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-orange-600" />
            Vibration
          </h2>
          <input
            type="number"
            value={vibrateDuration}
            onChange={(e) => setVibrateDuration(Number(e.target.value))}
            placeholder="Duration (ms)"
            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
          <button
            onClick={handleVibrate}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            Vibrate Device
          </button>
        </div>

        {/* Accelerometer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-indigo-600" />
            Accelerometer
          </h2>
          <button
            onClick={handleToggleAccelerometer}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : accelerometerActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {accelerometerActive ? "Stop Accelerometer" : "Start Accelerometer"}
          </button>
          {accelerometerData && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-800">{accelerometerData}</p>
            </div>
          )}
        </div>

        {/* Compass */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FiActivity className="mr-2 text-pink-600" />
            Compass
          </h2>
          <button
            onClick={handleToggleCompass}
            disabled={loading}
            className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : compassActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-pink-600 hover:bg-pink-700"
            }`}
          >
            {compassActive ? "Stop Compass" : "Start Compass"}
          </button>
          {compassData && (
            <div className="mt-3 p-3 bg-pink-50 rounded-lg">
              <p className="text-sm text-pink-800">{compassData}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Motion APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.listenBlow
            </code>{" "}
            - Detect blow gesture
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.listenGyro
            </code>{" "}
            - Monitor gyroscope (rotation)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.listeningShake
            </code>{" "}
            - Detect shake gesture
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.vibrate
            </code>{" "}
            - Vibrate device
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.startAccelerometer
            </code>{" "}
            - Monitor acceleration
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVMotion.startCompass
            </code>{" "}
            - Monitor compass direction
          </li>
          <li>
            • All sensors can be stopped individually when no longer needed
          </li>
          <li>• Sensor data updates in real-time via event listeners</li>
        </ul>
      </div>
    </div>
  );
};
