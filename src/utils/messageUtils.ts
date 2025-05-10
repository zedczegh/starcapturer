
/**
 * Message utility functions
 */

/**
 * Check if a message payload contains location data
 */
export function isLocationPayload(payload: any): boolean {
  return (
    payload && 
    typeof payload === 'object' && 
    'latitude' in payload && 
    'longitude' in payload && 
    !isNaN(Number(payload.latitude)) && 
    !isNaN(Number(payload.longitude))
  );
}

/**
 * Format a message as a location share message
 */
export function formatLocationShareMessage(locationData: any, message?: string): {
  text: string;
  payload: any;
} {
  return {
    text: message || "Shared a location",
    payload: {
      id: locationData.id,
      name: locationData.name,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      siqs: locationData.siqs || locationData.siqsResult,
      timestamp: locationData.timestamp || new Date().toISOString(),
      certification: locationData.certification,
      isDarkSkyReserve: locationData.isDarkSkyReserve
    }
  };
}

/**
 * Extract location ID from a URL
 * Pattern: /location/{id} or /astro-spot/{id}
 */
export async function extractLocationIdFromUrl(text: string): Promise<any | null> {
  try {
    // Look for location URLs in the message
    const locationRegex = /(https?:\/\/[^\/]+)?\/(location|astro-spot)\/([^\/\s]+)/i;
    const match = text.match(locationRegex);
    
    if (!match) return null;
    
    const locationId = match[3];
    if (!locationId) return null;
    
    // For location pages that store coordinates in the ID
    if (locationId.includes(',')) {
      const [lat, lng] = locationId.split(',').map(Number);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Try to fetch basic location info from our app state
        try {
          const response = await fetch(`/api/location-info?lat=${lat}&lng=${lng}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {
          console.log("Could not fetch location details, using basic data");
        }
        
        // If fetch fails, return basic coordinates
        return {
          id: `loc-${lat.toFixed(6)}-${lng.toFixed(6)}`,
          name: "Shared Location",
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    // For astro-spot pages
    if (match[2] === 'astro-spot') {
      try {
        const response = await fetch(`/api/astro-spot/${locationId}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        console.log("Could not fetch astro-spot details");
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting location ID:", error);
    return null;
  }
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch (e) {
    return false;
  }
}
