# Call API

Initiate phone calls and access device dialer functionality for seamless communication.

## Overview

The Call API enables your miniapp to initiate phone calls directly from the app. Whether you need to dial a number with user confirmation or make a call immediately, these functions provide simple phone integration.

## Available Functions

### `dial`

Open the device dialer with a pre-filled phone number, allowing the user to confirm before calling.

**Use Cases:**
- Customer support contact buttons
- "Call us" features
- Contact emergency services with confirmation

---

### `call`

Immediately initiate a phone call to the specified number.

**Use Cases:**
- Emergency call buttons
- Quick dial features
- Automated calling workflows

## Example Usage

```typescript
import { dial, call } from './api/call';

// Open dialer with number (user confirms)
dial('1900123456')
  .then(() => {
    console.log('Dialer opened');
  });

// Direct call (immediate)
call('1900123456')
  .then(() => {
    console.log('Call initiated');
  })
  .catch(error => {
    console.error('Call failed:', error);
  });
```

## Use Case Examples

### Customer Support
```typescript
// Support button
<button onClick={() => dial('1900-SUPPORT')}>
  Contact Support
</button>
```

### Emergency Contact
```typescript
// Emergency call with confirmation
function emergencyCall() {
  if (confirm('Call emergency services?')) {
    call('113');
  }
}
```

## Best Practices

- Use `dial()` for user-initiated calls (shows confirmation)
- Use `call()` sparingly and only when immediate calling is expected
- Always inform users before making automatic calls
- Format phone numbers appropriately for the region
- Handle call failures gracefully

## Requirements

- WindVane bridge must be available
- Phone call permission may be required
- Device must have calling capability
- Must run within AppViettel environment

## Platform Considerations

- Some devices may require additional permissions for direct calling
- Users can deny call permission
- Consider fallback to `dial()` if `call()` fails
