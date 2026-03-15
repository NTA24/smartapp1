# Cookie API

Read and write cookies for data persistence and session management across app sessions.

## Overview

The Cookie API provides simple cookie management functionality, allowing your miniapp to store and retrieve cookie data. Use cookies for session persistence, user preferences, and lightweight data storage.

## Available Functions

### `readCookie`

Read cookie values from the browser or app environment.

**Parameters:**
- Cookie name or configuration

**Use Cases:**
- Retrieve session tokens
- Read user preferences
- Check authentication state

---

### `writeCookie`

Write or update cookie values.

**Parameters:**
- Cookie name, value, and optional configuration (expiry, path, domain)

**Use Cases:**
- Store session data
- Save user preferences
- Persist authentication tokens

## Example Usage

```typescript
import { readCookie, writeCookie } from './api/cookie';

// Write a cookie
writeCookie({
  name: 'session_id',
  value: 'abc123xyz',
  expires: 7 // days
})
  .then(() => {
    console.log('Cookie saved');
  });

// Read a cookie
readCookie('session_id')
  .then(value => {
    console.log('Session ID:', value);
  })
  .catch(() => {
    console.log('Cookie not found');
  });

// Store user preferences
writeCookie({
  name: 'theme',
  value: 'dark',
  expires: 365
});
```

## Use Cases

### Session Management
```typescript
// Save login session
writeCookie({
  name: 'auth_token',
  value: token,
  expires: 30,
  secure: true
});

// Check session on app launch
readCookie('auth_token')
  .then(token => {
    if (token) {
      // User is logged in
      loadUserData();
    }
  });
```

### User Preferences
```typescript
// Save settings
writeCookie({
  name: 'settings',
  value: JSON.stringify(userSettings),
  expires: 365
});

// Load settings
readCookie('settings')
  .then(data => {
    const settings = JSON.parse(data);
    applySettings(settings);
  });
```

## Best Practices

- Set appropriate expiration times
- Use secure cookies for sensitive data
- Don't store large amounts of data (use storage API instead)
- Clear cookies on logout
- Handle cookie read failures gracefully
- Validate cookie data before use

## Data Limits

- Cookie size limits may apply (typically 4KB per cookie)
- Total cookie limit per domain may vary
- For larger data, consider using the Multimedia/Storage API

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- Cookie permissions may be required
- Respect user privacy settings
