# Multimedia API

Capture photos and videos, save media to device, manage local storage, and play system sounds.

## Overview

The Multimedia API provides comprehensive media handling and local storage capabilities. Capture photos and videos, save images to the photo library, choose videos, play system sounds, and manage persistent key-value storage. Essential for media-rich applications and data persistence.

## Available Functions

### Media Capture & Management

#### `takePhoto`

Launch the camera to capture a photo.

**Use Cases:**
- Profile picture capture
- Document scanning
- Photo upload features

---

#### `chooseVideo`

Open video picker to select videos from device library.

**Use Cases:**
- Video upload
- Video sharing
- Media selection

---

#### `saveImage`

Save an image to the device's photo library.

**Use Cases:**
- Download images
- Save generated graphics
- Export photos

---

#### `saveVideoToPhotosAlbum`

Save a video to the device's photo album.

**Use Cases:**
- Download videos
- Export recordings
- Save media content

---

#### `playSystemSound`

Play predefined system sounds and alerts.

**Use Cases:**
- Audio feedback
- Notification sounds
- Alert tones

### Local Storage

#### `getItem`

Retrieve a value from local storage by key.

**Use Cases:**
- Load saved preferences
- Retrieve cached data
- Read persistent state

---

#### `setItem`

Store a key-value pair in local storage.

**Use Cases:**
- Save user preferences
- Cache data locally
- Persist app state

---

#### `removeItem`

Remove a specific item from local storage.

**Use Cases:**
- Clear specific cached data
- Remove outdated entries
- User logout cleanup

---

#### `clearStorage`

Asynchronously clear all local storage data.

**Use Cases:**
- Reset app data
- Logout cleanup
- Clear cache

---

#### `clearStorageSync`

Synchronously clear all local storage data.

**Use Cases:**
- Immediate data cleanup
- Sync reset operations

## Example Usage

### Photo Capture
```typescript
import { takePhoto, saveImage } from './api/multimedia';

// Take photo
takePhoto({
  quality: 80,
  sourceType: 'camera'
})
  .then(photo => {
    console.log('Photo captured:', photo.path);
    uploadPhoto(photo.path);
  });

// Save image to device
saveImage({
  imageUrl: 'https://example.com/image.jpg'
})
  .then(() => {
    toast({ message: 'Image saved to photos!' });
  });
```

### Video Handling
```typescript
import { chooseVideo, saveVideoToPhotosAlbum } from './api/multimedia';

// Choose video from library
chooseVideo({
  maxDuration: 60, // seconds
  sourceType: 'album'
})
  .then(video => {
    console.log('Video selected:', video.path);
    uploadVideo(video.path);
  });

// Save video
saveVideoToPhotosAlbum({
  videoPath: '/path/to/video.mp4'
})
  .then(() => {
    console.log('Video saved!');
  });
```

### Local Storage
```typescript
import {
  getItem,
  setItem,
  removeItem,
  clearStorage
} from './api/multimedia';

// Save data
setItem({
  key: 'user_preferences',
  value: JSON.stringify({
    theme: 'dark',
    language: 'vi',
    notifications: true
  })
})
  .then(() => {
    console.log('Preferences saved');
  });

// Load data
getItem({ key: 'user_preferences' })
  .then(value => {
    const preferences = JSON.parse(value);
    applyPreferences(preferences);
  })
  .catch(() => {
    // Use default preferences
    applyDefaultPreferences();
  });

// Remove specific item
removeItem({ key: 'temp_data' });

// Clear all storage
clearStorage()
  .then(() => {
    console.log('Storage cleared');
  });
```

### System Sounds
```typescript
import { playSystemSound } from './api/multimedia';

// Play notification sound
playSystemSound({ soundId: 'notification' });

// Success sound
playSystemSound({ soundId: 'success' });

// Error sound
playSystemSound({ soundId: 'error' });
```

## Common Patterns

### Profile Picture Update
```typescript
async function updateProfilePicture() {
  try {
    const photo = await takePhoto({ quality: 90 });
    const uploadResult = await uploadToServer(photo.path);

    // Save reference in local storage
    await setItem({
      key: 'profile_picture',
      value: uploadResult.url
    });

    toast({ message: 'Profile picture updated!' });
  } catch (error) {
    console.error('Failed to update picture:', error);
  }
}
```

### Persistent Settings
```typescript
// Save settings
async function saveSettings(settings) {
  await setItem({
    key: 'app_settings',
    value: JSON.stringify(settings)
  });
}

// Load settings on app start
async function loadSettings() {
  try {
    const data = await getItem({ key: 'app_settings' });
    return JSON.parse(data);
  } catch {
    return getDefaultSettings();
  }
}
```

### Media Download
```typescript
async function downloadAndSave(imageUrl) {
  showLoadingBox({ message: 'Downloading...' });

  try {
    await saveImage({ imageUrl });
    hideLoadingBox();
    toast({ message: 'Saved to photos!' });
    playSystemSound({ soundId: 'success' });
  } catch (error) {
    hideLoadingBox();
    alert({ title: 'Error', message: 'Failed to save image' });
  }
}
```

## Storage Limits

- Storage capacity varies by device
- Typical limit: 5-10MB for local storage
- For large data, consider file system or remote storage
- Monitor storage usage

## Best Practices

### Media
- Compress images before upload
- Request camera/photo permissions
- Handle permission denials
- Validate media files
- Show progress for large operations

### Storage
- Use meaningful key names
- Serialize complex objects to JSON
- Handle missing keys gracefully
- Clear unused data periodically
- Don't store sensitive data unencrypted

## Requirements

- WindVane bridge must be available
- Camera/photo library permissions required
- Storage permissions may be required
- Must run within AppViettel environment

## Privacy & Permissions

- Request camera permission before `takePhoto()`
- Request photo library permission before `saveImage()`
- Explain why permissions are needed
- Handle permission denials gracefully
