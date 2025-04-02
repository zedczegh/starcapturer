
// Service to synchronize location data across components
import { BehaviorSubject } from 'rxjs';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  name?: string;
  timestamp?: string;
}

// Create a BehaviorSubject to stream location updates
const locationSubject = new BehaviorSubject<LocationUpdate | null>(null);

// Function to publish location updates
export const publishLocationUpdate = (location: LocationUpdate) => {
  console.log('Publishing location update:', location);
  locationSubject.next(location);
  
  // Also store in localStorage for persistence
  try {
    localStorage.setItem('current_location_sync', JSON.stringify({
      ...location,
      timestamp: location.timestamp || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to save location to localStorage:', error);
  }
};

// Function to get the current location
export const getCurrentLocation = (): LocationUpdate | null => {
  try {
    const savedLocation = localStorage.getItem('current_location_sync');
    return savedLocation ? JSON.parse(savedLocation) : null;
  } catch (error) {
    console.error('Failed to retrieve location from localStorage:', error);
    return null;
  }
};

// Subscribe to location updates
export const subscribeToLocationUpdates = (
  callback: (location: LocationUpdate | null) => void
) => {
  const subscription = locationSubject.subscribe(callback);
  
  // Return unsubscribe function
  return () => subscription.unsubscribe();
};

// Initialize from localStorage if available
try {
  const savedLocation = localStorage.getItem('current_location_sync');
  if (savedLocation) {
    const location = JSON.parse(savedLocation);
    // Don't publish, just set the current value
    locationSubject.next(location);
  }
} catch (error) {
  console.error('Failed to initialize from localStorage:', error);
}
