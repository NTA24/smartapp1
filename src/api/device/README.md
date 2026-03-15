# Device API

Access device information, system capabilities, and hardware specifications.

## Overview

The Device API provides comprehensive access to device and system information. Retrieve details about the device model, OS version, screen dimensions, and other system capabilities to optimize your miniapp's behavior and UI for different devices.

## Available Functions

### `getSystemInfo`

Retrieve detailed system and device information.

**Returns:** Object containing device specifications, OS details, screen info, and capabilities

**Use Cases:**
- Responsive UI adjustments
- Feature compatibility checks
- Analytics and diagnostics
- Platform-specific logic

---

### `nativeDetector`

Detect if the app is running in a native environment vs web browser.

**Use Cases:**
- Environment-specific feature toggling
- Native vs web flow differentiation
- Development vs production detection

## System Information

The system info typically includes:
- Device model and manufacturer
- Operating system and version
- Screen dimensions and pixel ratio
- App version information
- Network capabilities
- Available storage
- Language and locale settings

## Example Usage

```typescript
import { getSystemInfo, nativeDetector } from './api/device';

// Get system information
getSystemInfo()
  .then(info => {
    console.log('Device:', info.model);
    console.log('OS:', info.platform, info.osVersion);
    console.log('Screen:', info.screenWidth, 'x', info.screenHeight);

    // Adjust UI for screen size
    if (info.screenWidth < 375) {
      enableCompactMode();
    }

    // Platform-specific features
    if (info.platform === 'iOS') {
      enableIOSFeatures();
    }
  });

// Check environment
nativeDetector()
  .then(isNative => {
    if (isNative) {
      // Use native features
      enableNativeAPIs();
    } else {
      // Fallback to web APIs
      useWebFallback();
    }
  });
```

## Responsive Design

```typescript
getSystemInfo().then(info => {
  const { screenWidth, screenHeight, pixelRatio } = info;

  // Calculate safe dimensions
  const safeWidth = screenWidth / pixelRatio;

  // Responsive breakpoints
  if (safeWidth < 375) {
    layout = 'compact';
  } else if (safeWidth < 768) {
    layout = 'medium';
  } else {
    layout = 'wide';
  }
});
```

## Analytics Integration

```typescript
getSystemInfo().then(info => {
  analytics.track('session_start', {
    device: info.model,
    os: `${info.platform} ${info.osVersion}`,
    app_version: info.appVersion,
    screen_resolution: `${info.screenWidth}x${info.screenHeight}`
  });
});
```

## Best Practices

- Cache system info at app startup
- Use device info for responsive layouts
- Log device info for debugging
- Respect device capabilities and limitations
- Test on various device types

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- No special permissions required for basic info
