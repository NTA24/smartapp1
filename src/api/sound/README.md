# Sound API

Play system sounds and beeps for audio feedback and notifications.

## Overview

The Sound API provides simple audio playback capabilities for system sounds and beeps. Add audio feedback to user interactions, play notification sounds, and create more engaging user experiences with minimal code.

## Available Functions

### `beep`

Play a simple beep sound for audio feedback.

**Use Cases:**
- Button press feedback
- Alert notifications
- Timer/countdown sounds
- Error/warning audio cues
- Success confirmations

## Example Usage

```typescript
import { beep } from './api/sound/beep';

// Play a simple beep
beep()
  .then(() => {
    console.log('Beep played');
  });

// Beep on button click
function handleButtonClick() {
  beep();
  processAction();
}

// Beep with error handling
beep()
  .catch(error => {
    console.error('Failed to play beep:', error);
  });
```

## Common Use Cases

### Button Feedback
```typescript
function Button({ onClick, children }) {
  const handleClick = async () => {
    // Play beep for feedback
    await beep();

    // Execute action
    onClick();
  };

  return <button onClick={handleClick}>{children}</button>;
}
```

### Form Validation
```typescript
async function validateForm(formData) {
  const errors = checkValidation(formData);

  if (errors.length > 0) {
    // Error beep
    await beep();

    alert({
      title: 'Validation Error',
      message: errors.join('\n')
    });

    return false;
  }

  // Success - use success sound from multimedia API
  await playSystemSound({ soundId: 'success' });
  return true;
}
```

### Timer/Countdown
```typescript
class Timer {
  constructor(seconds) {
    this.remaining = seconds;
  }

  async start() {
    const interval = setInterval(async () => {
      this.remaining--;

      // Beep on last 3 seconds
      if (this.remaining <= 3 && this.remaining > 0) {
        await beep();
      }

      // Final beep
      if (this.remaining === 0) {
        await beep();
        await beep(); // Double beep
        clearInterval(interval);
        this.onComplete();
      }

      this.updateDisplay();
    }, 1000);
  }
}
```

### Notification
```typescript
async function showNotification(message, type) {
  // Play beep
  await beep();

  // Show toast
  toast({
    message,
    type,
    duration: 3000
  });
}
```

### Game Interaction
```typescript
class Game {
  async onCorrectAnswer() {
    await beep();
    this.score += 10;
    this.showFeedback('Correct!');
  }

  async onWrongAnswer() {
    // Different pattern - multiple beeps
    await beep();
    await sleep(100);
    await beep();

    this.showFeedback('Wrong!');
  }

  async onLevelComplete() {
    // Success pattern
    for (let i = 0; i < 3; i++) {
      await beep();
      await sleep(100);
    }
  }
}
```

### Barcode Scanner Feedback
```typescript
async function scanBarcode() {
  const result = await scan();

  // Success beep
  await beep();

  // Also vibrate
  await vibrate({ duration: 50 });

  processBarcode(result.content);
}
```

### Accessibility Enhancement
```typescript
// Audio cue for important actions
async function deleteItem(itemId) {
  const confirmed = await confirm({
    title: 'Delete Item',
    message: 'Are you sure?'
  });

  if (confirmed) {
    // Warning beep before deletion
    await beep();
    await sleep(200);
    await beep();

    await performDelete(itemId);

    toast({ message: 'Item deleted' });
  }
}
```

## Sound Patterns

### Single Beep
```typescript
// Quick feedback
await beep();
```

### Double Beep
```typescript
// Confirmation
await beep();
await sleep(100);
await beep();
```

### Triple Beep
```typescript
// Warning or completion
for (let i = 0; i < 3; i++) {
  await beep();
  await sleep(150);
}
```

### Rapid Beeps
```typescript
// Alert
for (let i = 0; i < 5; i++) {
  await beep();
  await sleep(50);
}
```

## Combining with Other Feedback

### Audio + Visual
```typescript
async function showSuccess() {
  // Beep
  await beep();

  // Visual feedback
  toast({ message: '✓ Success!' });

  // Animation
  playSuccessAnimation();
}
```

### Audio + Haptic
```typescript
async function confirmAction() {
  // Sound
  await beep();

  // Vibration
  await vibrate({ duration: 50 });

  // Visual
  highlightElement();
}
```

### Audio + Visual + Haptic (Complete Feedback)
```typescript
async function completeTransaction() {
  // Triple feedback for important actions
  await Promise.all([
    beep(),
    vibrate({ duration: 100 }),
    showSuccessAnimation()
  ]);

  toast({ message: 'Transaction complete!' });
}
```

## Best Practices

### User Experience
- Use beeps sparingly to avoid annoyance
- Provide option to disable sounds
- Use different patterns for different actions
- Keep beeps short and pleasant
- Consider combining with haptic feedback

### Performance
- Beeps are lightweight and fast
- Don't spam beep calls
- Use async/await for sequential beeps
- Handle errors gracefully

### Accessibility
- Provide visual alternatives to audio
- Don't rely solely on beeps for critical feedback
- Consider users who are hearing impaired
- Test with screen readers

### Context
```typescript
// Good: Meaningful audio feedback
async function handlePayment() {
  const result = await processPayment();

  if (result.success) {
    await beep(); // Success feedback
    toast({ message: 'Payment successful' });
  } else {
    await beep();
    await beep(); // Error pattern
    alert({ title: 'Error', message: result.error });
  }
}

// Bad: Unnecessary beeps
async function handleTyping() {
  // Don't beep on every keystroke
  await beep(); // ❌ Annoying
}
```

## Settings Integration

```typescript
// Respect user sound preferences
class SoundManager {
  constructor() {
    this.soundEnabled = true;
    this.loadSettings();
  }

  async loadSettings() {
    const settings = await getItem({ key: 'sound_settings' });
    this.soundEnabled = settings?.enabled ?? true;
  }

  async playBeep() {
    if (this.soundEnabled) {
      await beep();
    }
  }

  async toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    await setItem({
      key: 'sound_settings',
      value: JSON.stringify({ enabled: this.soundEnabled })
    });
  }
}

// Usage
const soundManager = new SoundManager();
await soundManager.playBeep(); // Only plays if enabled
```

## Limitations

- Basic beep sound only (for more sounds, use Multimedia API)
- Sound may be muted by device settings
- No control over beep duration or pitch
- May not play if device is in silent mode

## Alternative APIs

For more advanced audio features, consider:
- **Multimedia API** - `playSystemSound()` for various system sounds
- **Custom Audio** - Use HTML5 audio for custom sounds
- **Vibrate API** - Haptic feedback as alternative

## Requirements

- WindVane bridge must be available
- Audio output capability required
- Device not in silent mode (typically)
- Must run within AppViettel environment

## Platform Considerations

### iOS
- Respects device silent switch
- May be affected by volume settings
- System sounds take precedence

### Android
- Respects notification volume
- May play even in vibrate mode (depends on settings)
- More consistent across devices
