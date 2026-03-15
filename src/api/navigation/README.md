# Navigation API

Navigate between miniapps and manage cross-application routing within the AppViettel ecosystem.

## Overview

The Navigation API enables seamless navigation between different miniapps within the AppViettel superapp. Launch other miniapps, pass data between apps, and create integrated multi-app experiences. Essential for building connected services and cross-app workflows.

## Available Functions

### `navigateToMiniapp`

Navigate from your current miniapp to another miniapp within AppViettel.

**Parameters:**
- `appId` (string, required) - Target miniapp's unique identifier
- `path` (string, optional) - Specific path/page within the target miniapp
- `extraData` (object, optional) - Data to pass to the target miniapp

**Returns:** Promise that resolves when navigation is initiated

**Use Cases:**
- Cross-app workflows
- Service integration
- Deep linking between miniapps
- Multi-step processes across apps

## Example Usage

```typescript
import { navigateToMiniapp } from './api/navigation/navigateToMiniapp';

// Basic navigation
navigateToMiniapp({
  appId: 'com.viettel.shopping'
})
  .then(() => {
    console.log('Navigation initiated');
  })
  .catch(error => {
    console.error('Navigation failed:', error);
  });

// Navigate to specific page
navigateToMiniapp({
  appId: 'com.viettel.shopping',
  path: '/product/12345'
})
  .then(() => {
    console.log('Navigating to product page');
  });

// Navigate with data
navigateToMiniapp({
  appId: 'com.viettel.payment',
  path: '/checkout',
  extraData: {
    amount: 100000,
    orderId: 'ORD-2024-001',
    items: [
      { id: 1, name: 'Product A', price: 50000 },
      { id: 2, name: 'Product B', price: 50000 }
    ]
  }
})
  .then(() => {
    console.log('Navigating to payment with order data');
  });
```

## Common Use Cases

### E-commerce Flow
```typescript
// Shopping app -> Payment app
function proceedToCheckout(orderData) {
  navigateToMiniapp({
    appId: 'com.viettel.payment',
    path: '/checkout',
    extraData: {
      orderId: orderData.id,
      amount: orderData.total,
      items: orderData.items,
      returnUrl: '/orders'
    }
  });
}
```

### Service Integration
```typescript
// Main app -> Booking service
function bookService(serviceId) {
  navigateToMiniapp({
    appId: 'com.viettel.booking',
    path: '/book',
    extraData: {
      serviceId,
      userId: currentUser.id,
      source: 'home_app'
    }
  });
}
```

### Customer Support
```typescript
// Any app -> Support chat
function openSupport(context) {
  navigateToMiniapp({
    appId: 'com.viettel.support',
    path: '/chat',
    extraData: {
      userName: currentUser.name,
      context: context,
      referrer: 'shopping_app'
    }
  });
}
```

### Loyalty Program
```typescript
// Navigate to rewards app
function viewRewards() {
  navigateToMiniapp({
    appId: 'com.viettel.rewards',
    path: '/my-points',
    extraData: {
      userId: currentUser.id
    }
  });
}
```

## Receiving Navigation Data

When your miniapp is opened via navigation, access the passed data:

```typescript
// In the target miniapp
window.addEventListener('miniappLaunched', (event) => {
  const { path, extraData } = event.detail;

  console.log('Opened with path:', path);
  console.log('Received data:', extraData);

  // Handle the navigation
  if (path === '/checkout') {
    loadCheckout(extraData);
  }
});
```

## Deep Linking Patterns

### Path-based Navigation
```typescript
// Navigate to specific features
navigateToMiniapp({
  appId: 'com.viettel.shop',
  path: '/category/electronics'
});

navigateToMiniapp({
  appId: 'com.viettel.shop',
  path: '/product/12345'
});

navigateToMiniapp({
  appId: 'com.viettel.shop',
  path: '/cart'
});
```

### Data Passing
```typescript
// Complex data transfer
navigateToMiniapp({
  appId: 'com.viettel.target',
  extraData: {
    action: 'create',
    type: 'appointment',
    data: {
      date: '2024-12-15',
      time: '14:00',
      service: 'consultation'
    },
    metadata: {
      source: 'home_screen',
      campaignId: 'PROMO2024'
    }
  }
});
```

## Error Handling

```typescript
navigateToMiniapp({
  appId: 'com.viettel.someapp'
})
  .catch(error => {
    if (error.message.includes('not available')) {
      // Miniapp not installed or not accessible
      alert({
        title: 'App Not Available',
        message: 'Please update AppViettel to access this feature'
      });
    } else if (error.message.includes('appId is required')) {
      // Invalid parameters
      console.error('Navigation error: Missing appId');
    } else {
      // Other errors
      console.error('Navigation failed:', error);
    }
  });
```

## Best Practices

- Always validate `appId` before navigation
- Handle navigation errors gracefully
- Keep `extraData` payload reasonable (avoid large objects)
- Use meaningful path structures
- Document your miniapp's supported paths
- Validate received data in target miniapp
- Provide fallback options if navigation fails
- Consider user experience during transitions

## Return Navigation

```typescript
// Return to previous miniapp
function goBack() {
  // Use closeMiniApp to return
  closeMiniApp();
}

// Return with result data
function returnWithData(resultData) {
  // Emit event before closing
  window.dispatchEvent(new CustomEvent('miniappResult', {
    detail: resultData
  }));

  closeMiniApp();
}
```

## Requirements

- WindVane bridge must be available
- Valid target miniapp `appId`
- Target miniapp must be accessible/installed
- Must run within AppViettel environment
- Both miniapps must be registered in AppViettel ecosystem

## Security Considerations

- Validate and sanitize all received data
- Don't pass sensitive information in `extraData`
- Verify the source of navigation events
- Implement proper authentication for sensitive operations
- Use secure communication for sensitive data transfer
