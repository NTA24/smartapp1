# Battery API

Monitor device battery status, charging state, and power levels to optimize your miniapp's performance.

## Overview

The Battery API provides access to the device's battery information, allowing you to monitor power levels and charging status. Use this data to optimize resource-intensive operations, warn users about low battery, or adapt your app's behavior based on power state.

## Available Functions

### `getBatteryInfo`

Asynchronously retrieve the current battery status and level.

**Returns:** Promise resolving to battery information object

**Use Cases:**
- Display battery level to users
- Defer heavy operations when battery is low
- Show charging status indicators

---

### `getBatteryInfoSync`

Synchronously retrieve the current battery status and level.

**Returns:** Battery information object

**Use Cases:**
- Quick battery checks without async/await
- Real-time battery monitoring
- Immediate battery status in sync code paths

## Battery Information

The battery info object typically includes:
- Battery level (percentage)
- Charging status (charging/discharging)
- Battery health information

## Example Usage

```typescript
import { getBatteryInfo, getBatteryInfoSync } from './api/battery';

// Async: Get battery info
getBatteryInfo()
  .then(batteryInfo => {
    console.log('Battery level:', batteryInfo.level);
    console.log('Is charging:', batteryInfo.isCharging);

    if (batteryInfo.level < 20 && !batteryInfo.isCharging) {
      alert('Low battery! Consider charging your device.');
    }
  });

// Sync: Get battery info immediately
const battery = getBatteryInfoSync();
if (battery.level < 10) {
  // Disable resource-intensive features
  disableVideoAutoplay();
}
```

## Best Practices

- Monitor battery before starting intensive tasks (video processing, large downloads)
- Warn users when battery is critically low
- Reduce background activity when battery is low
- Respect user's battery by optimizing performance

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- Battery permission may be required on some platforms
