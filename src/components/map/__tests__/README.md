
# Marker Components Tests

This directory contains test files for map marker components. 

## Available Components for Testing

The `MarkerBackup.tsx` file contains stable versions of all marker components that can be used for testing:

- UserLocationMarker - Shows the user's current location
- LocationMarker - Displays astronomical viewing locations
- CommunityMapMarker - Shows community-shared viewing spots
- TakahashiMarkerSVG - SVG icon for telescope markers
- MarkerEventHandler - Handles marker interaction events
- MarkerUtils - Helper utilities for creating and styling markers
- LocationPopupContent - Content display for map markers

## Testing Considerations

When writing tests for these components:

1. Import the backup versions from `MarkerBackup.tsx` instead of the original components
2. Mock any required context providers (like LanguageContext, AuthContext)
3. Test marker rendering, interactions, and popup behavior
4. Verify correct handling of hover states and touch events

## Example Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { MarkerBackup } from '../MarkerBackup';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock components that might be used internally
jest.mock('react-leaflet', () => ({
  Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="map-popup">{children}</div>
}));

describe('UserLocationMarker', () => {
  it('renders correctly with position', () => {
    render(
      <LanguageProvider>
        <MarkerBackup.UserLocationMarker position={[35.6812, 139.7671]} />
      </LanguageProvider>
    );
    expect(screen.getByTestId('map-marker')).toBeInTheDocument();
  });
});
```
