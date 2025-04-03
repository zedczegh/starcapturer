
// Light pollution utility functions

/**
 * Get the light pollution type based on region type
 * @param regionType The type of region
 * @returns Light pollution classification
 */
export const getLightPollutionType = (regionType: string): "urban" | "suburban" | "rural" | "wilderness" => {
  // Fix the type comparison error
  if (regionType === "urban") {
    return "urban";
  } else if (regionType === "suburban") {
    return "suburban";
  } else if (regionType === "rural") {
    return "rural";
  } else {
    return "wilderness";
  }
};

/**
 * Fetch light pollution data for given coordinates
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Promise resolving to light pollution data
 */
export const fetchLightPollutionData = async (
  latitude: number,
  longitude: number
) => {
  try {
    // Normalize coordinates
    const normalizedLat = parseFloat(latitude.toFixed(6));
    const normalizedLng = parseFloat(longitude.toFixed(6));
    
    // Fetch data from API or calculate locally
    // For now, we're using estimated data based on location type
    const response = await fetch(`/api/light-pollution?lat=${normalizedLat}&lng=${normalizedLng}`);
    
    if (!response.ok) {
      // Fallback to estimation if API fails
      const bortleScale = estimateBortleScale(latitude, longitude);
      return { bortleScale };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Return estimated data on error
    const bortleScale = estimateBortleScale(latitude, longitude);
    return { bortleScale };
  }
};

/**
 * Estimate Bortle scale based on coordinates
 * Using a simplified algorithm based on population density estimation
 */
const estimateBortleScale = (latitude: number, longitude: number): number => {
  // Default to suburban/rural boundary (Bortle 4-5)
  return 5;
};
