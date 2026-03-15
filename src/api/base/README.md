# Base API

Essential utilities for clipboard operations, browser navigation, miniapp lifecycle management, and system integrations.

## Overview

The Base API provides fundamental functions that every miniapp may need. From managing the clipboard to opening external browsers, checking app installations, and controlling your miniapp's lifecycle, these utilities form the foundation of miniapp functionality.

## Available Functions

### `canIUse`

Check if a specific WindVane API or feature is available in the current environment.

**Use Cases:**
- Feature detection before using APIs
- Graceful degradation for unsupported features
- Version compatibility checking

---

### `closeMiniApp`

Programmatically close and exit the current miniapp.

**Use Cases:**
- Exit after completing a task
- Logout and close functionality
- Error states requiring app termination

---

### `copyToClipboard`

Copy text content to the device clipboard.

**Use Cases:**
- Copy referral codes or promo codes
- Share text content
- Copy confirmation numbers

---

### `isAppsInstalled`

Check if specific applications are installed on the device.

**Use Cases:**
- Conditional deep linking
- Alternative app recommendations
- Feature availability based on installed apps

---

### `isInstall`

Check if a specific application is installed on the device.

**Use Cases:**
- Verify third-party app availability
- Conditional feature display
- App integration flows

---

### `notify`

Send notifications or trigger system events.

**Use Cases:**
- Local notifications
- Event broadcasting
- System alerts

---

### `openBrowser`

Open a URL in the device's default external browser.

**Use Cases:**
- Open external websites
- Navigate to terms of service
- Launch help documentation

---

### `setBackgroundColor`

Customize the background color of your miniapp.

**Use Cases:**
- Brand consistency
- Theme customization
- Visual feedback during loading

## Example Usage

```typescript
import { copyToClipboard } from './api/base/copyToClipboard';
import { openBrowser } from './api/base/openBrowser';
import { closeMiniApp } from './api/base/closeMiniApp';
import { canIUse } from './api/base/canIUse';

// Copy to clipboard
copyToClipboard('PROMO2024')
  .then(() => {
    console.log('Copied successfully!');
  });

// Open external URL
openBrowser('https://example.com');

// Check feature availability
canIUse('WVLocation.getLocation')
  .then(available => {
    if (available) {
      // Use location API
    }
  });

// Close miniapp
closeMiniApp();
```

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- Some functions may require user permissions or confirmations
