# Motion API

Access accelerometer, gyroscope, compass, and motion sensors for immersive and interactive experiences.

## Overview

The Motion API provides access to device motion sensors, enabling your miniapp to detect device orientation, movement, gestures, and direction. Create interactive experiences, fitness tracking, gesture controls, and augmented reality features.

## Available Functions

### `accelerometer`

Access the device's accelerometer to measure acceleration forces.

**Use Cases:**
- Step counter
- Shake detection
- Motion-based games
- Activity tracking

---

### `gyroscope`

Access the gyroscope sensor to measure device rotation and orientation.

**Use Cases:**
- 360° panorama viewers
- Rotation-based controls
- Stabilization features
- VR/AR applications

---

### `compass`

Get the device's heading direction using the magnetometer.

**Use Cases:**
- Navigation apps
- Directional indicators
- Augmented reality
- Map orientation

---

### `vibrate`

Trigger device vibration with customizable patterns.

**Use Cases:**
- Haptic feedback
- Notifications
- Game effects
- Alert confirmation

---

### `shake`

Detect shake gestures on the device.

**Use Cases:**
- Shake to refresh
- Shake to undo
- Random selection (dice roll)
- Gesture shortcuts

---

### `blow`

Detect blowing into the device microphone.

**Use Cases:**
- Interactive games
- Fun Easter eggs
- Novel user interactions

---

### `gyro`

Alternative gyroscope access for device orientation.

**Use Cases:**
- Tilt controls
- Balance games
- Screen rotation detection

## Example Usage

```typescript
import {
  accelerometer,
  gyroscope,
  compass,
  vibrate,
  shake,
  blow
} from './api/motion';

// Accelerometer
accelerometer.start((data) => {
  console.log('X:', data.x);
  console.log('Y:', data.y);
  console.log('Z:', data.z);

  // Detect shake
  const acceleration = Math.sqrt(data.x**2 + data.y**2 + data.z**2);
  if (acceleration > 15) {
    console.log('Device shaken!');
  }
});

// Gyroscope
gyroscope.start((data) => {
  console.log('Alpha:', data.alpha);
  console.log('Beta:', data.beta);
  console.log('Gamma:', data.gamma);

  // Rotate content based on device orientation
  rotateView(data.alpha, data.beta, data.gamma);
});

// Compass
compass.start((heading) => {
  console.log('Heading:', heading, 'degrees');
  updateMapOrientation(heading);
});

// Vibrate
vibrate({
  duration: 200 // milliseconds
});

// Pattern vibration
vibrate({
  pattern: [100, 50, 100, 50, 200]
});

// Shake detection
shake.start(() => {
  console.log('Shake detected!');
  refreshContent();
  vibrate({ duration: 100 });
});

// Blow detection
blow.start(() => {
  console.log('User blew into mic!');
  playAnimation();
});
```

## Common Use Cases

### Shake to Refresh
```typescript
shake.start(() => {
  vibrate({ duration: 50 });
  refreshData();
  toast({ message: 'Refreshing...' });
});
```

### Step Counter
```typescript
let steps = 0;
let lastY = 0;

accelerometer.start((data) => {
  const deltaY = Math.abs(data.y - lastY);

  if (deltaY > 1.2) {
    steps++;
    updateStepCount(steps);
  }

  lastY = data.y;
});
```

### Compass Navigation
```typescript
compass.start((heading) => {
  // Calculate direction to destination
  const bearing = calculateBearing(
    currentLocation,
    destination
  );

  // Show arrow pointing to destination
  const relativeAngle = bearing - heading;
  rotateArrow(relativeAngle);
});
```

### Tilt-Based Game Control
```typescript
gyroscope.start((data) => {
  // Use device tilt to control game character
  const tiltX = data.gamma; // -90 to 90
  const tiltY = data.beta;  // -180 to 180

  moveCharacter(tiltX, tiltY);
});
```

### Haptic Feedback
```typescript
function buttonClick() {
  // Light tap feedback
  vibrate({ duration: 10 });
}

function errorOccurred() {
  // Error pattern
  vibrate({ pattern: [100, 50, 100] });
}

function successAction() {
  // Success pattern
  vibrate({ pattern: [50, 50, 50] });
}
```

## Best Practices

- Stop sensors when not needed to conserve battery
- Use appropriate sensor sampling rates
- Calibrate sensors if necessary
- Handle permission requests
- Test on multiple devices
- Provide non-motion alternatives
- Consider accessibility implications

## Battery Considerations

Motion sensors can consume significant battery:
- Start sensors only when needed
- Stop sensors when app is backgrounded
- Use lower sampling rates when possible
- Batch sensor readings

## Accessibility

- Always provide alternative input methods
- Don't rely solely on motion gestures
- Consider users with limited mobility
- Make shake sensitivity adjustable

## Requirements

- WindVane bridge must be available
- Motion sensor permissions may be required
- Device must have required sensors
- Must run within AppViettel environment
- iOS 13+ or Android 5.0+ for full sensor support

## Cleanup

```typescript
// Always stop sensors when done
componentWillUnmount() {
  accelerometer.stop();
  gyroscope.stop();
  compass.stop();
  shake.stop();
}
```
