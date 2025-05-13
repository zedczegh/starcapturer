
/**
 * Extracts location information from a URL string that contains location profile links
 * Supports multiple location profile formats: /location/lat,lng, /astro-spot/id, and /location/loc-lat-lng
 */
export const extractLocationFromUrl = (text: string): any | null => {
  if (!text) return null;
  
  // Define regex patterns for different location types
  const locationPatterns = [
    // Pattern for /location/{latitude},{longitude} URLs
    /https?:\/\/[^\/]+\/location\/(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Pattern for relative /location/{latitude},{longitude} URLs
    /\/location\/(-?\d+\.\d+),(-?\d+\.\d+)/,
    // Pattern for /location/loc-{latitude}-{longitude} URLs (new format)
    /https?:\/\/[^\/]+\/location\/loc-(-?\d+\.\d+)-(-?\d+\.\d+)/,
    // Pattern for relative /location/loc-{latitude}-{longitude} URLs (new format)
    /\/location\/loc-(-?\d+\.\d+)-(-?\d+\.\d+)/
  ];
  
  const astroSpotPatterns = [
    // Pattern for /astro-spot/{id} URLs
    /https?:\/\/[^\/]+\/astro-spot\/([a-zA-Z0-9-]+)/,
    // Pattern for relative /astro-spot/{id} URLs
    /\/astro-spot\/([a-zA-Z0-9-]+)/
  ];
  
  // Check for location coordinate links
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        console.log(`Location link detected: lat=${latitude}, lng=${longitude}`);
        return {
          name: "Shared Location",
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          fromLink: true
        };
      }
    }
  }
  
  // Check for astro spot links
  for (const pattern of astroSpotPatterns) {
    const match = text.match(pattern);
    if (match) {
      const spotId = match[1];
      
      // Return just the spotId for now, the actual component will fetch details
      return {
        name: "Shared AstroSpot",
        spotId,
        timestamp: new Date().toISOString(),
        fromLink: true,
        isAstroSpot: true
      };
    }
  }
  
  return null;
};
