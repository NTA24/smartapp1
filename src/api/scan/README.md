# Scan API

Scan QR codes and barcodes for quick data capture and processing.

## Overview

The Scan API provides native QR code and barcode scanning capabilities. Launch the device camera to scan codes, process various barcode formats, and integrate scanning features into your miniapp for payments, product lookup, authentication, and more.

## Available Functions

### `scan`

Launch the native camera scanner to read QR codes and barcodes.

**Parameters:**
- `openFlight` (boolean, optional) - Enable flight mode scanning
- `title` (string, optional) - Custom title for scanner screen

**Returns:** Promise resolving to scan result with content and format

**Scan Result:**
- `content` - The decoded text/data from the code
- `format` - Barcode format (QR_CODE, EAN_13, CODE_128, etc.)

**Supported Formats:**
- QR Code
- EAN-13, EAN-8
- UPC-A, UPC-E
- Code 128, Code 39
- Data Matrix
- PDF417
- Aztec

**Use Cases:**
- QR code payment processing
- Product barcode scanning
- Ticket validation
- Authentication codes
- URL deep links
- WiFi connection sharing
- Contact card scanning

## Example Usage

```typescript
import { scan } from './api/scan/scan';

// Basic QR/barcode scan
scan()
  .then(result => {
    console.log('Scanned:', result.content);
    console.log('Format:', result.format);

    // Process based on content
    handleScanResult(result);
  })
  .catch(error => {
    console.error('Scan failed:', error);
  });

// Scan with custom title
scan({
  title: 'Scan QR Code to Pay'
})
  .then(result => {
    processPayment(result.content);
  });

// Advanced scan with options
scan({
  title: 'Scan Product Barcode',
  openFlight: true
})
  .then(result => {
    if (result.format === 'EAN_13') {
      lookupProduct(result.content);
    }
  });
```

## Common Use Cases

### Payment QR Code
```typescript
async function scanPaymentQR() {
  try {
    const result = await scan({
      title: 'Scan QR Code to Pay'
    });

    // Parse payment data
    const paymentData = JSON.parse(result.content);

    // Confirm payment
    const confirmed = await confirm({
      title: 'Confirm Payment',
      message: `Pay ${paymentData.amount} VND to ${paymentData.merchant}?`
    });

    if (confirmed) {
      await processPayment(paymentData);
      toast({ message: 'Payment successful!' });
    }
  } catch (error) {
    alert({
      title: 'Scan Failed',
      message: 'Please try again'
    });
  }
}
```

### Product Lookup
```typescript
async function scanProductBarcode() {
  try {
    const result = await scan({
      title: 'Scan Product Barcode'
    });

    // Show loading
    showLoadingBox({ message: 'Looking up product...' });

    // Lookup product by barcode
    const product = await fetchProduct(result.content);

    hideLoadingBox();

    // Display product details
    showProductDetails(product);
  } catch (error) {
    hideLoadingBox();
    alert({
      title: 'Product Not Found',
      message: 'Barcode not recognized'
    });
  }
}
```

### URL Deep Link
```typescript
async function scanQRLink() {
  try {
    const result = await scan({
      title: 'Scan QR Code'
    });

    // Check if it's a URL
    if (result.content.startsWith('http')) {
      // Confirm before opening
      const open = await confirm({
        title: 'Open Link?',
        message: result.content
      });

      if (open) {
        openBrowser(result.content);
      }
    } else {
      // Handle other QR content
      handleQRData(result.content);
    }
  } catch (error) {
    console.error('Scan error:', error);
  }
}
```

### Event Check-in
```typescript
async function checkInAttendee() {
  try {
    const result = await scan({
      title: 'Scan Ticket'
    });

    showLoadingBox({ message: 'Verifying ticket...' });

    // Verify ticket
    const ticket = await verifyTicket(result.content);

    hideLoadingBox();

    if (ticket.valid) {
      // Mark as checked in
      await checkIn(ticket.id);

      alert({
        title: 'Check-in Successful',
        message: `Welcome, ${ticket.attendeeName}!`
      });

      playSystemSound({ soundId: 'success' });
    } else {
      alert({
        title: 'Invalid Ticket',
        message: ticket.reason
      });

      playSystemSound({ soundId: 'error' });
    }
  } catch (error) {
    hideLoadingBox();
    console.error('Check-in failed:', error);
  }
}
```

### WiFi Sharing
```typescript
async function scanWiFiQR() {
  try {
    const result = await scan({
      title: 'Scan WiFi QR Code'
    });

    // Parse WiFi QR format: WIFI:T:WPA;S:SSID;P:password;;
    const wifiMatch = result.content.match(/WIFI:T:(.*?);S:(.*?);P:(.*?);;/);

    if (wifiMatch) {
      const [, security, ssid, password] = wifiMatch;

      toast({
        message: `WiFi: ${ssid}\nPassword copied to clipboard!`
      });

      copyToClipboard(password);
    }
  } catch (error) {
    console.error('WiFi scan failed:', error);
  }
}
```

## QR Code Data Formats

### Plain Text
```
Hello World
```

### URL
```
https://example.com/page
```

### vCard (Contact)
```
BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+84123456789
EMAIL:john@example.com
END:VCARD
```

### WiFi
```
WIFI:T:WPA;S:MyNetwork;P:password123;;
```

### JSON Data
```json
{
  "type": "payment",
  "amount": 100000,
  "merchant": "Store Name",
  "id": "TXN-123"
}
```

## Best Practices

### User Experience
- Show clear instructions before scanning
- Use descriptive scanner titles
- Provide cancel option
- Handle camera permission gracefully
- Show feedback for successful scans
- Vibrate or play sound on successful scan

### Security
```typescript
async function secureScan() {
  const result = await scan();

  // Validate scan result
  if (!result || !result.content) {
    throw new Error('Invalid scan');
  }

  // Sanitize URL before opening
  if (result.content.startsWith('http')) {
    const url = new URL(result.content);

    // Check against whitelist
    if (!isAllowedDomain(url.hostname)) {
      alert({
        title: 'Security Warning',
        message: 'This QR code links to an external site'
      });
      return;
    }
  }

  // Process safely
  handleScanResult(result);
}
```

### Error Handling
```typescript
scan()
  .then(result => {
    // Validate format
    if (result.format !== 'QR_CODE') {
      throw new Error('Only QR codes are supported');
    }

    // Process result
    processQRCode(result.content);
  })
  .catch(error => {
    if (error.message.includes('permission')) {
      alert({
        title: 'Camera Permission Required',
        message: 'Please enable camera access to scan codes'
      });
    } else if (error.message.includes('cancel')) {
      // User cancelled scan
      console.log('Scan cancelled');
    } else {
      alert({
        title: 'Scan Failed',
        message: 'Please try again'
      });
    }
  });
```

## Performance Tips

- Keep scanner UI simple and fast
- Process scan results asynchronously
- Cache lookup results when possible
- Provide instant visual feedback
- Don't block UI during processing

## Requirements

- WindVane bridge must be available
- Camera permission required
- Adequate lighting for scanning
- Clear, undamaged codes
- Must run within AppViettel environment

## Limitations

- Camera quality affects scan success
- Damaged or low-quality codes may not scan
- Very small or large codes may be difficult
- Requires user to hold steady
- Some exotic barcode formats may not be supported
