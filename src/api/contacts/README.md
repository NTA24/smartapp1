# Contacts API

Access and manage device contacts for enhanced user experience and social features.

## Overview

The Contacts API allows your miniapp to interact with the device's contact list. Request permissions, search contacts, select contacts through native UI, and add new contacts programmatically. Perfect for social features, communication apps, and contact management.

## Available Functions

### `askAuth`

Request permission to access device contacts.

**Use Cases:**
- Initial permission request flow
- Permission denied recovery
- Settings guidance for enabling contacts access

---

### `authStatus`

Check the current authorization status for contacts access.

**Use Cases:**
- Verify permission before accessing contacts
- Conditional UI based on permission state
- Permission status monitoring

---

### `choose`

Open the native contact picker to let users select contacts.

**Use Cases:**
- Share content with contacts
- Add friends or connections
- Select recipients for messages

---

### `find`

Search for specific contacts by criteria.

**Use Cases:**
- Contact search functionality
- Auto-complete contact fields
- Find contacts by name, phone, or email

---

### `addPhoneContact`

Programmatically add a new contact to the device.

**Use Cases:**
- Save contact after business card scan
- Create contact from form data
- Quick add contact buttons

## Example Usage

```typescript
import {
  askAuth,
  authStatus,
  choose,
  find,
  addPhoneContact
} from './api/contacts';

// Request permission
askAuth()
  .then(result => {
    console.log('Permission granted:', result);
  });

// Check permission status
authStatus()
  .then(status => {
    if (status === 'authorized') {
      // Access contacts
    }
  });

// Pick a contact
choose()
  .then(contact => {
    console.log('Selected contact:', contact);
  });

// Search contacts
find({ name: 'John' })
  .then(contacts => {
    console.log('Found contacts:', contacts);
  });

// Add new contact
addPhoneContact({
  name: 'Jane Doe',
  phone: '+84123456789',
  email: 'jane@example.com'
})
  .then(() => {
    console.log('Contact added!');
  });
```

## Permission Flow

```typescript
// Best practice: Check before asking
authStatus().then(status => {
  switch(status) {
    case 'authorized':
      // Access contacts freely
      break;
    case 'denied':
      // Show explanation, guide to settings
      break;
    case 'not_determined':
      // Request permission
      askAuth();
      break;
  }
});
```

## Privacy Considerations

- Only request contacts permission when necessary
- Explain why you need access before requesting
- Respect user's decision if permission is denied
- Never store contacts without user consent
- Handle permission errors gracefully

## Requirements

- WindVane bridge must be available
- Contacts permission required
- Must run within AppViettel environment
- User must grant explicit permission
