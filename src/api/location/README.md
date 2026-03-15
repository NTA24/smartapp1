# Location API

Retrieve GPS coordinates, address information, and search for locations with high accuracy.

## Overview

The Location API provides access to the device's GPS and location services. Get the user's current position with optional high accuracy mode, retrieve address details, and search for specific locations. Essential for maps, delivery, and location-based services.

## Available Functions

### `getLocation`

Retrieve the device's current geographic location with optional address information.

**Parameters:**
- `enableHighAccuracy` (string, optional) - Request high accuracy GPS mode
- `address` (boolean, optional) - Include reverse geocoded address information

**Returns:** Promise resolving to location object with coordinates and optional address

**Location Data:**
- `coords.latitude` - Latitude coordinate
- `coords.longitude` - Longitude coordinate
- `coords.accuracy` - Accuracy in meters
- `address.city` - City name (if address enabled)
- `address.province` - Province/state
- `address.area` - District/area
- `address.road` - Street name
- `address.addressLine` - Full formatted address

**Use Cases:**
- User location for services
- Store/location finder
- Delivery address detection
- Map centering

---

### `searchLocation`

Search for locations by name, address, or coordinates.

**Use Cases:**
- Location search functionality
- Address autocomplete
- Place finder
- Point of interest search

## Example Usage

```typescript
import { getLocation, searchLocation } from './api/location';

// Get current location (basic)
getLocation()
  .then(location => {
    console.log('Lat:', location.coords.latitude);
    console.log('Lng:', location.coords.longitude);
    console.log('Accuracy:', location.coords.accuracy, 'meters');
  });

// Get location with address
getLocation({
  enableHighAccuracy: 'true',
  address: true
})
  .then(location => {
    console.log('Position:', location.coords);
    console.log('Address:', location.address.addressLine);
    console.log('City:', location.address.city);
  });

// Search for locations
searchLocation({ query: 'coffee shop near me' })
  .then(results => {
    results.forEach(place => {
      console.log(place.name, place.address);
    });
  });
```

## Common Use Cases

### Store Locator
```typescript
getLocation({ address: true })
  .then(location => {
    const { latitude, longitude } = location.coords;

    // Find nearest stores
    const nearbyStores = findStoresNear(latitude, longitude);

    // Display on map
    displayMap(latitude, longitude, nearbyStores);
  });
```

### Delivery Address
```typescript
getLocation({
  enableHighAccuracy: 'true',
  address: true
})
  .then(location => {
    // Pre-fill delivery form
    form.address = location.address.addressLine;
    form.city = location.address.city;
    form.latitude = location.coords.latitude;
    form.longitude = location.coords.longitude;
  });
```

### Location Search
```typescript
// Search as user types
function handleSearchInput(query) {
  searchLocation({ query })
    .then(results => {
      displaySearchResults(results);
    });
}
```

## Best Practices

- Request permission before accessing location
- Use high accuracy sparingly (consumes more battery)
- Cache location data when appropriate
- Handle permission denials gracefully
- Provide fallback for manual address entry
- Show loading indicator during location fetch
- Set timeouts for location requests

## Privacy Considerations

- Always explain why you need location access
- Only request location when necessary
- Don't track user location without consent
- Respect user's privacy settings
- Clear location data when no longer needed

## Accuracy Modes

**Standard Accuracy:**
- Faster
- Lower battery consumption
- Suitable for general location (city-level)

**High Accuracy:**
- Slower
- Higher battery consumption
- Precise coordinates (meter-level)
- Use for navigation and precise positioning

## Requirements

- WindVane bridge must be available
- Location permission required
- GPS/location services must be enabled
- Network connectivity for address lookup
- Must run within AppViettel environment

## Error Handling

```typescript
getLocation()
  .catch(error => {
    if (error.message.includes('permission')) {
      // Guide user to enable location permission
      showPermissionDialog();
    } else if (error.message.includes('timeout')) {
      // Retry or use cached location
      useCachedLocation();
    } else {
      // Fallback to manual entry
      showManualAddressForm();
    }
  });
```
