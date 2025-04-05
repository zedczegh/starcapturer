
/**
 * Convert Bortle scale to Sky Quality Meter (SQM) value
 * @param bortleScale Bortle scale value (1-9)
 * @returns SQM value in mag/arcsec²
 */
export function calculateBortleToSQM(bortleScale: number): number {
  // Ensure valid input
  const validBortle = Math.min(9, Math.max(1, bortleScale));
  
  // Mapping based on established relationship between Bortle and SQM
  switch(Math.round(validBortle)) {
    case 1: return 21.7; // Class 1: Excellent dark-sky site
    case 2: return 21.5; // Class 2: Typical truly dark site
    case 3: return 21.3; // Class 3: Rural sky
    case 4: return 20.8; // Class 4: Rural/suburban transition
    case 5: return 19.5; // Class 5: Suburban sky
    case 6: return 18.5; // Class 6: Bright suburban sky
    case 7: return 17.8; // Class 7: Suburban/urban transition
    case 8: return 17.0; // Class 8: City sky
    case 9: return 16.0; // Class 9: Inner-city sky
    default: return 19.5; // Default: Class 5
  }
}

/**
 * Convert SQM value to Bortle scale
 * @param sqmValue SQM value in mag/arcsec²
 * @returns Bortle scale value (1-9)
 */
export function calculateSQMToBortle(sqmValue: number): number {
  if (sqmValue >= 21.7) return 1;
  if (sqmValue >= 21.5) return 2;
  if (sqmValue >= 21.0) return 3;
  if (sqmValue >= 20.0) return 4;
  if (sqmValue >= 19.0) return 5;
  if (sqmValue >= 18.0) return 6;
  if (sqmValue >= 17.5) return 7;
  if (sqmValue >= 16.5) return 8;
  return 9;
}
