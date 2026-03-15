# Bluetooth API

Connect and communicate with Bluetooth Low Energy (BLE) devices for IoT integrations and wireless peripherals.

## Overview

The Bluetooth API provides comprehensive BLE functionality, enabling your miniapp to discover, connect, and interact with Bluetooth devices. From scanning for nearby devices to reading/writing characteristics, this API supports full-featured Bluetooth Low Energy communication.

## Available Functions

### `requestAuthorization`

Request Bluetooth permission from the user.

**Use Cases:**
- Initial Bluetooth permission request
- Check permission status

---

### `bluetoothScan`

Start scanning for nearby Bluetooth Low Energy devices.

**Use Cases:**
- Discover available BLE devices
- Find smart devices and peripherals
- IoT device discovery

---

### `stopScan`

Stop the active Bluetooth scan operation.

**Use Cases:**
- Conserve battery after finding desired device
- End device discovery process

---

### `connect`

Establish a connection to a Bluetooth device.

**Use Cases:**
- Connect to selected BLE device
- Establish communication channel

---

### `disconnect`

Disconnect from a connected Bluetooth device.

**Use Cases:**
- Release Bluetooth resources
- Clean disconnection on app close

---

### `getServices`

Retrieve available GATT services from connected device.

**Use Cases:**
- Discover device capabilities
- List available services

---

### `getCharacteristics`

Get characteristics for a specific GATT service.

**Use Cases:**
- Find readable/writable characteristics
- Discover device features

---

### `readValue`

Read data from a BLE characteristic.

**Use Cases:**
- Read sensor data
- Get device status

---

### `writeValue`

Write data to a BLE characteristic.

**Use Cases:**
- Send commands to device
- Configure device settings

---

### `startNotifications`

Subscribe to characteristic value changes.

**Use Cases:**
- Real-time sensor monitoring
- Live data streaming

---

### `stopNotifications`

Unsubscribe from characteristic notifications.

**Use Cases:**
- Stop monitoring when not needed
- Conserve battery

## Example Usage

```typescript
import {
  bluetoothScan,
  connect,
  getServices,
  readValue,
  writeValue
} from './api/bluetooth';

// Scan for devices
bluetoothScan()
  .then(() => {
    console.log('Scanning for devices...');
  });

// Connect to device
connect({ deviceId: 'device-uuid' })
  .then(() => {
    console.log('Connected!');
    return getServices();
  })
  .then(services => {
    // Read from characteristic
    return readValue({
      serviceId: 'service-uuid',
      characteristicId: 'char-uuid'
    });
  });

// Write to device
writeValue({
  serviceId: 'service-uuid',
  characteristicId: 'char-uuid',
  value: '0x01'
});
```

## Common Use Cases

- Smart home device control
- Fitness tracker integration
- Health monitoring devices
- IoT sensor communication
- Wireless peripheral management

## Requirements

- WindVane bridge must be available
- Bluetooth permission required
- Device must support Bluetooth Low Energy
- Must run within AppViettel environment
