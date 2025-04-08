
/**
 * Simple check if a location is likely to be a water area
 * This is a placeholder for a more sophisticated check that could use
 * an actual geographic API or dataset
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Boolean indicating if location is likely a water area
 */
export const isWaterLocation = (latitude: number, longitude: number): boolean => {
  // This is a simplified check that can be enhanced later with actual API calls
  // For now, it's based on known large water bodies
  
  // Check Pacific Ocean (very approximate)
  const isPacific = 
    ((longitude < -70 && longitude > -180) || (longitude > 140)) && 
    (latitude < 60 && latitude > -60);
  
  // Check Atlantic Ocean (very approximate)
  const isAtlantic = 
    (longitude < -30 && longitude > -70) && 
    (latitude < 60 && latitude > -60);
  
  // Check Indian Ocean (very approximate)
  const isIndian = 
    (longitude > 40 && longitude < 120) && 
    (latitude < 30 && latitude > -60);
  
  // Check Mediterranean Sea (very approximate)
  const isMediterranean = 
    (longitude > 0 && longitude < 40) && 
    (latitude > 30 && latitude < 45);
  
  // Check Caribbean Sea (very approximate)
  const isCaribbean = 
    (longitude < -60 && longitude > -90) && 
    (latitude > 10 && latitude < 25);
  
  // Check Gulf of Mexico (very approximate)
  const isGulfMexico = 
    (longitude < -80 && longitude > -98) && 
    (latitude > 18 && latitude < 30);
  
  // Check Bay of Bengal
  const isBayOfBengal =
    (longitude > 80 && longitude < 95) &&
    (latitude > 5 && latitude < 22);
  
  // Check South China Sea
  const isSouthChinaSea =
    (longitude > 105 && longitude < 120) &&
    (latitude > 0 && latitude < 25);
  
  return isPacific || isAtlantic || isIndian || isMediterranean || 
         isCaribbean || isGulfMexico || isBayOfBengal || isSouthChinaSea;
};
