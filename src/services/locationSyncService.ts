
/**
 * Service to synchronize location updates between different parts of the application
 */

// Custom event for location updates
const LOCATION_UPDATE_EVENT = 'location_update';

// Interface for location data
export interface LocationUpdate {
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  source?: string;
}

/**
 * Publish a location update event that other components can listen for
 */
export function publishLocationUpdate(locationData: LocationUpdate): void {
  // Create a custom event with the location data
  const event = new CustomEvent(LOCATION_UPDATE_EVENT, {
    detail: locationData,
    bubbles: true
  });
  
  // Dispatch the event on the window object so it's globally available
  window.dispatchEvent(event);
  
  // Also save to localStorage for persistence between page refreshes
  try {
    localStorage.setItem('latest_siqs_location', JSON.stringify(locationData));
    console.log(`Location update published: ${locationData.name}`);
  } catch (error) {
    console.error('Failed to save location to localStorage', error);
  }
}

/**
 * Subscribe to location update events
 */
export function subscribeToLocationUpdates(callback: (location: LocationUpdate) => void): () => void {
  // Create the event handler
  const handleLocationUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<LocationUpdate>;
    callback(customEvent.detail);
  };
  
  // Add the event listener
  window.addEventListener(LOCATION_UPDATE_EVENT, handleLocationUpdate);
  
  // Return a function to unsubscribe
  return () => {
    window.removeEventListener(LOCATION_UPDATE_EVENT, handleLocationUpdate);
  };
}

/**
 * Get the latest saved location from localStorage
 */
export function getLatestLocation(): LocationUpdate | null {
  try {
    const savedLocation = localStorage.getItem('latest_siqs_location');
    return savedLocation ? JSON.parse(savedLocation) : null;
  } catch (error) {
    console.error('Failed to retrieve location from localStorage', error);
    return null;
  }
}
