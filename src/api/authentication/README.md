# Authentication API

Secure user authentication and authorization code management for seamless integration with AppViettel's identity system.

## Overview

The Authentication API enables your miniapp to authenticate users through AppViettel's OAuth system. Retrieve authorization codes with customizable scopes to access user information and services while maintaining security and privacy.

## Available Functions

### `getAuthCode`

Retrieve an OAuth authorization code for the current user with specified permission scopes.

**Parameters:**
- `appId` (string) - Your miniapp's unique application identifier
- `scopes` (string[]) - Array of permission scopes (default: `["auth_user"]`)

**Common Scopes:**
- `auth_user` - Basic user authentication
- `auth_email` - Access to user email
- `auth_phone` - Access to user phone number
- `auth_profile` - Access to user profile information

**Returns:** Promise resolving to the authorization code string

**Use Cases:**
- User login and authentication
- Accessing user profile data
- Integrating with backend services
- SSO (Single Sign-On) implementation

## Example Usage

```typescript
import { getAuthCode } from './api/authentication/getAuthCode';

// Basic authentication
getAuthCode('your-app-id')
  .then(authCode => {
    console.log('Auth code:', authCode);
    // Send to your backend for token exchange
  })
  .catch(error => {
    console.error('Authentication failed:', error);
  });

// Request multiple scopes
getAuthCode('your-app-id', ['auth_user', 'auth_email', 'auth_phone'])
  .then(authCode => {
    // Exchange code for access token on backend
    fetch('https://your-backend.com/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code: authCode })
    });
  });
```

## Security Best Practices

- Never expose your app credentials in client-side code
- Exchange authorization codes on your backend server
- Use appropriate scopes - only request what you need
- Handle authorization errors gracefully
- Implement token refresh mechanisms

## Requirements

- WindVane bridge must be available
- Valid miniapp `appId` registered with AppViettel
- User consent for requested scopes
- Must run within AppViettel environment
