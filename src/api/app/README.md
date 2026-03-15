# App API

Manage application state, notifications, and settings within the AppViettel environment.

## Overview

The App API provides functions to monitor and control your miniapp's lifecycle, manage notification settings, and navigate users to system settings. These APIs allow you to create responsive applications that adapt to app state changes and respect user notification preferences.

## Available Functions

### `appState`

Monitor application state changes to detect when your miniapp enters foreground or background.

**Use Cases:**
- Pause/resume activities based on app visibility
- Refresh data when app returns to foreground
- Save state when app goes to background

---

### `getNotificationSettings`

Retrieve the current notification settings and permissions for your miniapp.

**Use Cases:**
- Check if notifications are enabled
- Determine notification permission status
- Conditionally display notification-dependent features

---

### `openSettings`

Open the device or app settings screen, allowing users to modify permissions and preferences.

**Use Cases:**
- Direct users to enable notifications
- Guide users to grant required permissions
- Provide quick access to app settings

## Example Usage

```typescript
import { appState } from './api/app/appState';
import { getNotificationSettings } from './api/app/getNotificationSettings';
import { openSettings } from './api/app/openSettings';

// Monitor app state changes
appState()
  .then(state => {
    console.log('App state:', state);
  });

// Check notification settings
getNotificationSettings()
  .then(settings => {
    if (!settings.enabled) {
      // Prompt user to enable notifications
      openSettings();
    }
  });
```

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- Some functions may require user permissions
