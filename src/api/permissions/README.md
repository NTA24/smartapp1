# Permissions API

Request and manage device permissions for accessing sensitive features and user data.

## Overview

The Permissions API provides a centralized way to request, check, and manage permissions for various device features. Handle permission requests gracefully, check authorization status, and guide users through permission settings.

## Available Functions

### `authorize`

Request specific permissions from the user.

**Parameters:**
- Permission type(s) to request (location, camera, microphone, etc.)

**Use Cases:**
- Request location access
- Request camera permission
- Request microphone access
- Request contacts permission

---

### `getSetting`

Retrieve current permission settings and authorization status.

**Returns:** Object containing permission states for various features

**Use Cases:**
- Check permission status before using features
- Determine if permission was denied
- Guide users to settings if needed

## Permission Types

Common permissions include:
- `location` - GPS and location services
- `camera` - Camera access
- `microphone` - Audio recording
- `photos` - Photo library access
- `contacts` - Contact list access
- `bluetooth` - Bluetooth connectivity
- `notifications` - Push notifications
- `storage` - File system access

## Example Usage

```typescript
import { authorize, getSetting } from './api/permissions';

// Request permission
authorize({ scope: 'location' })
  .then(result => {
    if (result.authorized) {
      console.log('Location permission granted');
      // Proceed with location features
      getLocation();
    } else {
      console.log('Location permission denied');
      showPermissionDeniedMessage();
    }
  });

// Check current permission status
getSetting()
  .then(settings => {
    console.log('Location:', settings.location);
    console.log('Camera:', settings.camera);
    console.log('Microphone:', settings.microphone);

    // Handle based on status
    if (settings.location === 'denied') {
      showSettingsPrompt();
    }
  });
```

## Permission States

Permissions can have the following states:
- `authorized` - Permission granted
- `denied` - Permission denied by user
- `not_determined` - Permission not yet requested
- `restricted` - Permission restricted by system/policy

## Common Patterns

### Request Permission Flow
```typescript
async function requestLocationPermission() {
  // Check current status
  const settings = await getSetting();

  if (settings.location === 'authorized') {
    // Already have permission
    return true;
  }

  if (settings.location === 'denied') {
    // Previously denied, guide to settings
    const goToSettings = await confirm({
      title: 'Location Permission Required',
      message: 'Please enable location access in settings'
    });

    if (goToSettings) {
      openSettings();
    }
    return false;
  }

  // Request permission
  const result = await authorize({ scope: 'location' });
  return result.authorized;
}
```

### Feature Gating
```typescript
async function useCameraFeature() {
  const settings = await getSetting();

  switch(settings.camera) {
    case 'authorized':
      // Use camera
      takePhoto();
      break;

    case 'not_determined':
      // Request permission
      const result = await authorize({ scope: 'camera' });
      if (result.authorized) {
        takePhoto();
      }
      break;

    case 'denied':
      // Show explanation and guide to settings
      alert({
        title: 'Camera Access Required',
        message: 'Please enable camera access in settings to use this feature'
      });
      break;

    case 'restricted':
      // Feature unavailable
      alert({
        title: 'Camera Unavailable',
        message: 'Camera access is restricted on this device'
      });
      break;
  }
}
```

### Multiple Permissions
```typescript
async function requestMultiplePermissions() {
  const permissions = ['camera', 'microphone'];
  const results = {};

  for (const permission of permissions) {
    const result = await authorize({ scope: permission });
    results[permission] = result.authorized;
  }

  if (results.camera && results.microphone) {
    // All permissions granted
    startVideoRecording();
  } else {
    // Some permissions denied
    showMissingPermissionsError(results);
  }
}
```

### Permission-Aware UI
```typescript
async function updateUIBasedOnPermissions() {
  const settings = await getSetting();

  // Show/hide features based on permissions
  if (settings.location === 'authorized') {
    showLocationFeatures();
  } else {
    hideLocationFeatures();
    showPermissionPrompt('location');
  }

  if (settings.camera === 'authorized') {
    enableCameraButton();
  } else {
    disableCameraButton();
  }
}
```

## Best Practices

### Request at the Right Time
```typescript
// DON'T: Request all permissions on app start
// ❌ Bad
async function onAppStart() {
  await authorize({ scope: 'location' });
  await authorize({ scope: 'camera' });
  await authorize({ scope: 'contacts' });
}

// DO: Request when feature is used
// ✅ Good
async function onTakePhotoClick() {
  const result = await authorize({ scope: 'camera' });
  if (result.authorized) {
    takePhoto();
  }
}
```

### Provide Context
```typescript
async function requestLocationWithContext() {
  // Explain why before requesting
  const proceed = await confirm({
    title: 'Enable Location',
    message: 'We use your location to find nearby stores and services'
  });

  if (proceed) {
    await authorize({ scope: 'location' });
  }
}
```

### Handle Denials Gracefully
```typescript
async function handleDeniedPermission() {
  const result = await authorize({ scope: 'camera' });

  if (!result.authorized) {
    // Offer alternative
    const choice = await showActionSheet({
      title: 'Camera Access Denied',
      options: [
        'Open Settings',
        'Choose from Library',
        'Cancel'
      ]
    });

    switch(choice) {
      case 0:
        openSettings();
        break;
      case 1:
        chooseFromLibrary();
        break;
    }
  }
}
```

## Permission Best Practices

1. **Request in Context** - Only request when the user needs the feature
2. **Explain Why** - Clearly explain why permission is needed
3. **Provide Alternatives** - Offer workarounds when permission is denied
4. **Don't Block** - Allow app usage even without certain permissions
5. **Respect Choices** - Don't repeatedly ask for denied permissions
6. **Guide to Settings** - Help users enable permissions if needed
7. **Progressive Permissions** - Request permissions progressively as needed

## Privacy Guidelines

- Request minimum necessary permissions
- Explain data usage clearly
- Provide privacy policy link
- Allow users to revoke permissions
- Don't use permissions for unrelated purposes
- Be transparent about data collection
- Follow platform privacy guidelines

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- User must explicitly grant permissions
- Some permissions may require privacy policy

## Platform Differences

### iOS
- Permissions must be requested with usage description
- Some permissions show system dialog
- Users can revoke permissions in Settings

### Android
- Runtime permissions for dangerous permissions
- Some permissions are granted at install time
- Permission groups may be affected together
