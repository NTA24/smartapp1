# Screen API

Control screen brightness, orientation, and capture screenshots for enhanced visual experiences.

## Overview

The Screen API provides control over display settings and screen capture capabilities. Adjust brightness levels, lock or change screen orientation, and capture screenshots programmatically. Essential for media apps, games, and applications requiring specific display configurations.

## Available Functions

### `brightness`

Get or set the screen brightness level.

**Use Cases:**
- Auto-brightness adjustment
- Reading mode with increased brightness
- Video playback optimization
- Battery-saving dim mode

---

### `setOrientation`

Lock the screen to a specific orientation (portrait or landscape).

**Use Cases:**
- Video player (landscape mode)
- Game orientation locking
- Form filling (portrait mode)
- Camera/photo capture

---

### `getOrientation`

Get the current screen orientation.

**Use Cases:**
- Responsive layout adjustments
- Orientation-aware features
- UI adaptation

---

### `capture`

Capture a screenshot of the current screen.

**Use Cases:**
- Share functionality
- Bug reporting
- Receipt/proof generation
- Content saving

## Example Usage

```typescript
import {
  brightness,
  setOrientation,
  getOrientation,
  capture
} from './api/screen';

// Get current brightness
brightness.get()
  .then(level => {
    console.log('Current brightness:', level);
  });

// Set brightness (0.0 to 1.0)
brightness.set(0.8)
  .then(() => {
    console.log('Brightness updated');
  });

// Lock to landscape
setOrientation('landscape')
  .then(() => {
    console.log('Screen locked to landscape');
  });

// Get current orientation
getOrientation()
  .then(orientation => {
    console.log('Current orientation:', orientation);
  });

// Capture screenshot
capture()
  .then(screenshot => {
    console.log('Screenshot saved:', screenshot.path);
    saveImage({ imageUrl: screenshot.path });
  });
```

## Common Use Cases

### Video Player
```typescript
class VideoPlayer {
  async play(videoUrl) {
    // Save current settings
    this.originalBrightness = await brightness.get();
    this.originalOrientation = await getOrientation();

    // Optimize for video
    await brightness.set(1.0);
    await setOrientation('landscape');

    // Play video
    this.player.src = videoUrl;
    this.player.play();
  }

  async stop() {
    // Restore original settings
    await brightness.set(this.originalBrightness);
    await setOrientation('auto');
  }
}
```

### Reading Mode
```typescript
async function enableReadingMode() {
  // Increase brightness for comfortable reading
  const current = await brightness.get();

  await brightness.set(Math.max(current, 0.7));

  // Lock to portrait for reading
  await setOrientation('portrait');

  toast({ message: 'Reading mode enabled' });
}

async function disableReadingMode() {
  // Return to auto brightness
  await brightness.set(0.5);
  await setOrientation('auto');
}
```

### Screenshot Sharing
```typescript
async function shareScreen() {
  try {
    showLoadingBox({ message: 'Capturing...' });

    // Capture screenshot
    const screenshot = await capture();

    hideLoadingBox();

    // Ask user what to do
    const action = await showActionSheet({
      title: 'Screenshot Captured',
      options: ['Save to Photos', 'Share', 'Cancel']
    });

    switch(action) {
      case 0:
        await saveImage({ imageUrl: screenshot.path });
        toast({ message: 'Saved to photos!' });
        break;
      case 1:
        await shareImage(screenshot.path);
        break;
    }
  } catch (error) {
    hideLoadingBox();
    alert({ title: 'Error', message: 'Failed to capture screenshot' });
  }
}
```

### Game Orientation Lock
```typescript
class Game {
  async start() {
    // Lock orientation for gameplay
    await setOrientation('landscape');

    // Increase brightness
    this.savedBrightness = await brightness.get();
    await brightness.set(1.0);

    this.isRunning = true;
  }

  async exit() {
    // Restore settings
    await setOrientation('auto');
    await brightness.set(this.savedBrightness);

    this.isRunning = false;
  }
}
```

### Adaptive UI Based on Orientation
```typescript
async function setupOrientation() {
  const orientation = await getOrientation();

  if (orientation === 'landscape') {
    // Show side-by-side layout
    enableTwoColumnLayout();
  } else {
    // Show stacked layout
    enableSingleColumnLayout();
  }
}

// Monitor orientation changes
setInterval(async () => {
  const current = await getOrientation();

  if (current !== this.lastOrientation) {
    this.lastOrientation = current;
    await setupOrientation();
  }
}, 1000);
```

### Battery Saver Mode
```typescript
async function enableBatterySaver() {
  // Reduce brightness to save battery
  const current = await brightness.get();

  if (current > 0.3) {
    await brightness.set(0.3);

    toast({
      message: 'Battery saver: brightness reduced'
    });
  }
}
```

### Screenshot for Bug Report
```typescript
async function reportBug(description) {
  try {
    // Capture current screen
    const screenshot = await capture();

    // Upload with bug report
    const report = await submitBugReport({
      description,
      screenshot: screenshot.path,
      timestamp: new Date().toISOString(),
      deviceInfo: await getSystemInfo()
    });

    toast({ message: 'Bug report submitted. Thank you!' });
  } catch (error) {
    console.error('Failed to submit bug report:', error);
  }
}
```

## Orientation Values

- `portrait` - Vertical orientation
- `landscape` - Horizontal orientation
- `auto` - Automatic rotation based on device position

## Brightness Values

- Range: `0.0` (minimum) to `1.0` (maximum)
- Typical values:
  - `0.2` - Very dim (battery saver)
  - `0.5` - Medium brightness
  - `0.8` - Bright (indoor use)
  - `1.0` - Maximum (outdoor use)

## Best Practices

### Brightness
- Save original brightness before changing
- Restore brightness when leaving the feature
- Don't force maximum brightness unnecessarily
- Consider battery impact
- Respect system auto-brightness settings

### Orientation
- Always restore to auto when done
- Lock orientation only when necessary
- Handle both orientations in UI
- Test thoroughly in both modes
- Provide visual feedback when locking

### Screenshots
- Request permission if required
- Inform user before capturing
- Provide clear feedback
- Handle storage errors
- Respect privacy (don't capture sensitive data)

## Performance Considerations

- Brightness changes may take a moment to apply
- Orientation changes trigger layout recalculation
- Screenshot capture can be slow on large screens
- Avoid frequent brightness adjustments

## Privacy & Security

- Screenshots may contain sensitive information
- Ask permission before capturing
- Don't capture screens with passwords/PINs
- Clear screenshot data when no longer needed
- Respect user privacy

## Requirements

- WindVane bridge must be available
- Brightness control may require permission
- Screenshot may require storage permission
- Orientation lock may not work on all devices
- Must run within AppViettel environment

## Platform Differences

### iOS
- Brightness changes affect system brightness
- Orientation lock may be restricted
- Screenshot saved to temporary location

### Android
- Brightness may need permission
- Orientation lock more reliable
- Screenshot permissions may vary

## Cleanup

```typescript
// Always restore settings when leaving
class ScreenManager {
  async initialize() {
    this.originalBrightness = await brightness.get();
    this.originalOrientation = await getOrientation();
  }

  async restore() {
    await brightness.set(this.originalBrightness);
    await setOrientation('auto');
  }
}

// Use in components
componentWillUnmount() {
  screenManager.restore();
}
```
