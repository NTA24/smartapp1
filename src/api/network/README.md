# Network API

Monitor network connectivity status and connection type for adaptive application behavior.

## Overview

The Network API provides real-time network status monitoring, allowing your miniapp to detect connectivity changes and adapt to different network conditions. Check connection type (WiFi, cellular, none) to optimize data usage and provide better user experiences.

## Available Functions

### `getNetworkType`

Retrieve the current network connection type and status.

**Returns:** Promise resolving to network information object

**Network Types:**
- `wifi` - Connected via WiFi
- `cellular` - Connected via mobile data (3G/4G/5G)
- `none` - No network connection
- `unknown` - Network status unknown

**Use Cases:**
- Adaptive content loading
- Data usage optimization
- Offline mode handling
- Connection quality indicators

## Example Usage

```typescript
import { getNetworkType } from './api/network/getNetworkType';

// Check network status
getNetworkType()
  .then(network => {
    console.log('Network type:', network.type);
    console.log('Is connected:', network.isConnected);

    switch(network.type) {
      case 'wifi':
        // Enable high-quality content
        enableHDVideo();
        break;

      case 'cellular':
        // Use data-saving mode
        enableDataSaver();
        showDataUsageWarning();
        break;

      case 'none':
        // Show offline mode
        enableOfflineMode();
        showOfflineMessage();
        break;
    }
  });
```

## Common Use Cases

### Adaptive Media Loading
```typescript
async function loadMedia() {
  const network = await getNetworkType();

  if (network.type === 'wifi') {
    // Load high quality
    loadImages({ quality: 'high' });
    enableAutoplay();
  } else if (network.type === 'cellular') {
    // Load optimized version
    loadImages({ quality: 'medium' });
    disableAutoplay();
    showDataWarning();
  } else {
    // Use cached content only
    loadCachedContent();
  }
}
```

### Data Usage Warning
```typescript
async function beforeLargeDownload(fileSize) {
  const network = await getNetworkType();

  if (network.type === 'cellular') {
    const confirmed = await confirm({
      title: 'Data Usage Warning',
      message: `This will use ${fileSize}MB of mobile data. Continue?`
    });

    if (!confirmed) {
      return false;
    }
  }

  return true;
}
```

### Offline Mode
```typescript
async function checkConnectivity() {
  const network = await getNetworkType();

  if (network.type === 'none') {
    // Enable offline features
    showOfflineBanner();
    loadCachedData();
    disableSyncFeatures();
  } else {
    // Online mode
    hideOfflineBanner();
    syncData();
    enableAllFeatures();
  }
}
```

### Network-Aware Sync
```typescript
async function syncData() {
  const network = await getNetworkType();

  if (network.type === 'none') {
    // Queue for later
    queueSyncWhenOnline();
    return;
  }

  if (network.type === 'cellular') {
    // Sync essential data only
    await syncEssentialData();
  } else {
    // Full sync on WiFi
    await syncAllData();
  }
}
```

## Network Monitoring

```typescript
// Monitor network changes
class NetworkMonitor {
  constructor() {
    this.checkInterval = null;
    this.currentType = null;
  }

  start(callback) {
    // Check immediately
    this.check(callback);

    // Poll for changes
    this.checkInterval = setInterval(() => {
      this.check(callback);
    }, 5000); // Check every 5 seconds
  }

  async check(callback) {
    const network = await getNetworkType();

    if (network.type !== this.currentType) {
      this.currentType = network.type;
      callback(network);
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Usage
const monitor = new NetworkMonitor();
monitor.start((network) => {
  console.log('Network changed to:', network.type);
  updateUI(network);
});
```

## User Experience Patterns

### Connection Status Banner
```typescript
async function updateConnectionBanner() {
  const network = await getNetworkType();

  if (network.type === 'none') {
    showBanner({
      message: 'No internet connection',
      type: 'error',
      persistent: true
    });
  } else if (network.type === 'cellular') {
    showBanner({
      message: 'Using mobile data',
      type: 'warning',
      dismissible: true
    });
  } else {
    hideBanner();
  }
}
```

### Smart Retry Logic
```typescript
async function fetchWithRetry(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    const network = await getNetworkType();

    if (network.type === 'none') {
      throw new Error('No internet connection');
    }

    // Retry on other errors
    return fetch(url, options);
  }
}
```

## Best Practices

- Check network before large downloads
- Adapt content quality to connection type
- Cache content for offline access
- Provide meaningful offline experiences
- Warn users about data usage on cellular
- Don't spam network checks (use reasonable intervals)
- Handle connection state changes gracefully
- Queue operations when offline

## Performance Considerations

- Network checks are lightweight but avoid excessive polling
- Cache network status for short periods
- Use event-driven updates when possible
- Debounce network status changes
- Consider battery impact of frequent checks

## Requirements

- WindVane bridge must be available
- Network information permission may be required
- Must run within AppViettel environment

## Limitations

- Network status is a snapshot, not real-time
- Actual connection quality may vary
- Some devices may report inaccurate status
- Polling required for continuous monitoring
- Battery impact with frequent checks
