# Interaction API

Display alerts, toasts, action sheets, loading indicators, and manage navigation bar for rich user interactions.

## Overview

The Interaction API provides essential UI components for user communication and feedback. Show native dialogs, toast notifications, loading screens, and customize the navigation bar. These functions create polished, platform-native user experiences.

## Available Functions

### `alert`

Display a simple alert dialog with a message and OK button.

**Use Cases:**
- Important notifications
- Error messages
- Information dialogs

---

### `confirm`

Show a confirmation dialog with OK and Cancel buttons.

**Use Cases:**
- Delete confirmations
- Action confirmations
- Yes/No questions

---

### `prompt`

Display an input dialog to collect text from users.

**Use Cases:**
- Text input collection
- Quick data entry
- Name or comment prompts

---

### `toast`

Show a brief toast notification message.

**Use Cases:**
- Success messages
- Quick feedback
- Non-critical notifications

---

### `showActionSheet`

Display a native action sheet with multiple options.

**Use Cases:**
- Multiple action choices
- Context menus
- Share options

---

### `showLoadingBox`

Display a loading indicator with optional message.

**Use Cases:**
- Data loading states
- Processing indicators
- Background operations

---

### `hideLoadingBox`

Hide the currently displayed loading indicator.

**Use Cases:**
- Complete loading state
- Error handling
- Cancel operations

---

### `hideKeyboard`

Programmatically dismiss the on-screen keyboard.

**Use Cases:**
- Submit forms
- Navigation events
- Custom keyboard handling

---

### `updateNavBar`

Customize the navigation bar appearance and buttons.

**Use Cases:**
- Dynamic navigation
- Custom nav buttons
- Branding

---

### `getNavBarHeight`

Get the height of the navigation bar for layout calculations.

**Use Cases:**
- Precise layout positioning
- Scroll calculations
- Fixed header offsets

## Example Usage

```typescript
import {
  alert,
  confirm,
  toast,
  showActionSheet,
  showLoadingBox,
  hideLoadingBox
} from './api/interaction';

// Simple alert
alert({
  title: 'Success',
  message: 'Your data has been saved!'
});

// Confirmation dialog
confirm({
  title: 'Delete Item',
  message: 'Are you sure you want to delete this?'
})
  .then(confirmed => {
    if (confirmed) {
      deleteItem();
    }
  });

// Toast notification
toast({
  message: 'Copied to clipboard!',
  duration: 2000
});

// Action sheet
showActionSheet({
  title: 'Choose an action',
  options: ['Share', 'Edit', 'Delete', 'Cancel']
})
  .then(index => {
    switch(index) {
      case 0: shareItem(); break;
      case 1: editItem(); break;
      case 2: deleteItem(); break;
    }
  });

// Loading indicator
showLoadingBox({ message: 'Loading...' });

// Async operation
fetchData()
  .then(data => {
    hideLoadingBox();
    displayData(data);
  })
  .catch(error => {
    hideLoadingBox();
    alert({ title: 'Error', message: error.message });
  });
```

## Common Patterns

### Form Submission
```typescript
async function handleSubmit() {
  showLoadingBox({ message: 'Submitting...' });

  try {
    await submitForm(formData);
    hideLoadingBox();
    toast({ message: 'Form submitted successfully!' });
  } catch (error) {
    hideLoadingBox();
    alert({
      title: 'Submission Failed',
      message: error.message
    });
  }
}
```

### Delete Confirmation
```typescript
function deleteWithConfirmation(itemId) {
  confirm({
    title: 'Confirm Delete',
    message: 'This action cannot be undone.'
  })
    .then(confirmed => {
      if (confirmed) {
        deleteItem(itemId);
        toast({ message: 'Item deleted' });
      }
    });
}
```

### Navigation Bar Customization
```typescript
updateNavBar({
  title: 'My Page',
  backgroundColor: '#FF0000',
  rightButton: {
    text: 'Save',
    callback: handleSave
  }
});
```

## Best Practices

- Use appropriate dialog types for context
- Keep toast messages brief
- Always hide loading indicators
- Don't overuse alerts (prefer toasts for non-critical info)
- Provide clear action sheet options
- Handle dialog dismissals gracefully

## Requirements

- WindVane bridge must be available
- Must run within AppViettel environment
- UI interactions must be on main thread
