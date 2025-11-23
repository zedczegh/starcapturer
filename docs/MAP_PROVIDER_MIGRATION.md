# Map Provider Migration Guide

## Overview

The application now supports switching between **Leaflet (OpenStreetMap)** and **AMap (高德地图)** as map providers through an admin-only toggle. All existing map functionality remains intact regardless of which provider is active.

## Admin Controls

### Accessing the Toggle
1. Navigate to **About → SIQS System** (`/about/siqs`)
2. Scroll to the **SIQS Analytics Dashboard** (admin-only section)
3. Find the **Map Provider Settings** card at the top
4. Toggle between Leaflet and AMap

### What the Toggle Does
- **Leaflet (Default)**: Uses OpenStreetMap tiles, global coverage
- **AMap**: Uses 高德地图, optimized for China with detailed local data
- Settings are saved to localStorage and persist across sessions
- Switching providers will trigger a refresh of all map components

## Architecture

### Core Files Created

1. **`src/contexts/MapProviderContext.tsx`**
   - Global context for managing active map provider
   - Handles localStorage persistence
   - Pre-loads AMap scripts when selected
   - Provides `useMapProvider()` hook

2. **`src/types/map.ts`**
   - Unified type definitions for map abstraction
   - Provider-agnostic interfaces
   - Support for both Leaflet and AMap

3. **`src/services/map/MapProviderService.ts`**
   - Service layer for map initialization
   - Provides unified API for both providers
   - Handles provider-specific implementations

4. **`src/components/admin/MapProviderToggle.tsx`**
   - Admin UI component for switching providers
   - Shows current provider status
   - Displays loading state for AMap

### How It Works

```typescript
// Get current provider
const { provider, setProvider, isAMapReady } = useMapProvider();

// Switch providers (admin only)
setProvider('amap'); // or 'leaflet'

// Check if AMap is ready
if (provider === 'amap' && !isAMapReady) {
  // Show loading state
}
```

## Current Status

### ✅ Completed
- Map provider context and state management
- Admin toggle UI in SIQS dashboard
- Provider abstraction service layer
- Type definitions for unified map interface
- localStorage persistence
- AMap script preloading

### 🚧 Ready for Migration (Not Changed Yet)
All existing map components continue to use Leaflet. They are **ready** to be migrated but maintain full functionality:

- `src/components/community/CommunityMap.tsx`
- `src/components/photoPoints/map/LazyMapContainer.tsx`
- `src/components/location/MapDisplay.tsx`
- All marker and popup components

### ✨ What Stays the Same
**All SIQS functionality is completely map-agnostic:**
- ✅ Real-time SIQS calculation
- ✅ SIQS data fetching and caching
- ✅ Weather API calls
- ✅ Marker popups with SIQS scores
- ✅ Location geocoding
- ✅ User location markers
- ✅ Map click and drag handlers

## Migration Steps (When Ready)

### For Each Map Component:

1. **Import the provider context**
```typescript
import { useMapProvider } from '@/contexts/MapProviderContext';
```

2. **Check active provider**
```typescript
const { provider, isAMapReady } = useMapProvider();
```

3. **Conditional rendering**
```typescript
{provider === 'leaflet' ? (
  <LeafletMap {...props} />
) : (
  <AMapComponent {...props} />
)}
```

### Example Migration Pattern

```typescript
// Before (Leaflet only)
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const MyMap = () => {
  return (
    <MapContainer center={[lat, lng]} zoom={13}>
      <TileLayer url="..." />
      <Marker position={[lat, lng]} />
    </MapContainer>
  );
};

// After (Provider-aware)
import { useMapProvider } from '@/contexts/MapProviderContext';
import LeafletMapComponent from './LeafletMapComponent';
import AMapComponent from './AMapComponent';

const MyMap = () => {
  const { provider, isAMapReady } = useMapProvider();
  
  if (provider === 'amap' && !isAMapReady) {
    return <LoadingSpinner />;
  }
  
  return provider === 'leaflet' ? (
    <LeafletMapComponent />
  ) : (
    <AMapComponent />
  );
};
```

## SIQS Integration

**No changes needed!** All SIQS components are map-agnostic:

```typescript
<RealTimeSiqsProvider
  latitude={lat}
  longitude={lng}
  onSiqsCalculated={handleSiqsCalculated}
/>
```

The SIQS provider only needs coordinates - it doesn't care about the map provider. Marker popups with SIQS scores will work identically on both providers.

## Testing

### Test Checklist
- [ ] Toggle between providers in admin dashboard
- [ ] Verify localStorage persistence across page reloads
- [ ] Check all map pages (Photo Points, Community, Location Details)
- [ ] Confirm SIQS scores display correctly on both providers
- [ ] Test marker click events and popups
- [ ] Verify draggable markers work
- [ ] Test map click handlers for location selection

### Known Limitations
1. AMap requires an API key (to be configured in admin settings)
2. AMap loads asynchronously - show loading state while initializing
3. Coordinate systems differ: Leaflet uses [lat, lng], AMap uses [lng, lat]

## Future Enhancements

1. **Admin AMap Key Configuration**
   - Add input field in admin dashboard for AMap API key
   - Store in environment variables or encrypted storage
   - Validate key before switching to AMap

2. **Map Component Wrappers**
   - Create `<UnifiedMap>` component that handles provider switching
   - Unified `<UnifiedMarker>` and `<UnifiedPopup>` components
   - Automatic coordinate conversion

3. **Performance Optimization**
   - Lazy load provider-specific scripts only when needed
   - Cache map tiles for offline support
   - Optimize marker clustering for large datasets

## Support

For questions or issues:
- Check the troubleshooting section in main docs
- Review the map provider service implementation
- Test with console logs to debug provider switching
