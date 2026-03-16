import React from "react";
import { BluetoothScanComponent } from "./BluetoothScanComponent";
import { BluetoothConnectComponent } from "./BluetoothConnectComponent";
import { BluetoothOperationsComponent } from "./BluetoothOperationsComponent";

export const BluetoothPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bluetooth Low Energy (BLE)
        </h1>
        <p className="text-gray-600">
          Scan, connect, and interact with Bluetooth Low Energy devices
        </p>
      </div>

      <div className="space-y-6">
        <BluetoothScanComponent />
        <BluetoothConnectComponent />
        <BluetoothOperationsComponent />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          About Bluetooth APIs
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.requestAuthorization
            </code>{" "}
            - Request Bluetooth permissions and enable Bluetooth
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.scan
            </code>{" "}
            - Scan for nearby BLE devices
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.connect
            </code>{" "}
            - Connect to a specific device
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.getServices
            </code>{" "}
            - Get available GATT services
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.getCharacteristics
            </code>{" "}
            - Get characteristics for a service
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.readValue
            </code>{" "}
            - Read characteristic value
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.writeValue
            </code>{" "}
            - Write value to characteristic (Base64 encoded)
          </li>
          <li>
            •{" "}
            <code className="bg-blue-100 px-2 py-0.5 rounded">
              WVBluetooth.startNotifications
            </code>{" "}
            - Enable notifications for characteristic changes
          </li>
          <li>
            • Event: WV.Event.WVBluetooth.discoverDevice (device discovered
            during scan)
          </li>
          <li>
            • Event: WV.Event.WVBluetooth.GATTServerDisconnected (device
            disconnected)
          </li>
          <li>
            • Event: WV.Event.WVBluetooth.characteristicValueChanged (value
            changed notification)
          </li>
        </ul>
      </div>
    </div>
  );
};
