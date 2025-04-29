
// Add missing exported function
export const getBortleScaleData = async (latitude: number, longitude: number): Promise<number> => {
  // Default bortle scale value if we can't fetch data
  const defaultBortleScale = 4;
  
  try {
    // In a real application, this would fetch data from an API
    // For now, return simulated data based on location
    
    // Urban areas tend to have higher bortle scale values
    // Rural areas tend to have lower values
    
    // Simple simulation: higher latitudes and longitudes get lower bortle scale values
    const latitudeFactor = Math.abs(latitude) / 90;  // 0-1
    const longitudeFactor = Math.abs(longitude) / 180;  // 0-1
    
    // Calculate a value between 1 and 9
    const calculatedBortle = Math.round(9 - (latitudeFactor + longitudeFactor) * 4);
    
    // Ensure value is within Bortle scale range (1-9)
    return Math.max(1, Math.min(9, calculatedBortle));
  } catch (error) {
    console.error("Error getting Bortle scale data:", error);
    return defaultBortleScale;
  }
};
