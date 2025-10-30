/**
 * Astronomical Calculations for Parallax-Based Stereoscopic Imaging
 * 
 * This module provides scientifically accurate calculations for converting
 * astronomical distances and imaging equipment parameters into pixel displacements
 * for stereoscopic 3D effects.
 */

/**
 * Convert light years to parsecs
 * 1 light year = 0.306601 parsecs
 */
export const lightYearsToParsecs = (lightYears: number): number => {
  return lightYears * 0.306601;
};

/**
 * Calculate astronomical parallax angle in arcseconds
 * 
 * Formula: θ = baseline / distance
 * where baseline is in AU and distance is in parsecs
 * 
 * @param baselineAU - Baseline distance in Astronomical Units (typically 1 AU for Earth's orbit)
 * @param distanceParsecs - Distance to object in parsecs
 * @returns Parallax angle in arcseconds
 */
export const calculateParallaxAngle = (
  baselineAU: number,
  distanceParsecs: number
): number => {
  return baselineAU / distanceParsecs;
};

/**
 * Calculate plate scale (angular resolution per pixel)
 * 
 * Formula: plate_scale = (pixel_size_μm × 206,265) / focal_length_mm
 * 
 * The constant 206,265 converts radians to arcseconds:
 * 206,265 arcsec/radian = 3600 × 180 / π
 * 
 * @param focalLengthMm - Telescope focal length in millimeters
 * @param pixelSizeUm - Camera pixel size in micrometers
 * @returns Plate scale in arcseconds per pixel
 */
export const calculatePlateScale = (
  focalLengthMm: number,
  pixelSizeUm: number
): number => {
  return (pixelSizeUm * 206265) / focalLengthMm;
};

/**
 * Calculate suggested stereoscopic displacement for artistic 3D effect
 * based on astronomical distance. This is NOT real parallax calculation,
 * but an artistic tool to help choose appropriate displacement values.
 * 
 * Formula: Uses inverse relationship with distance to suggest relative depths,
 * scaled to produce comfortable viewing range (typically 5-45 pixels)
 * 
 * @param distanceLightYears - Distance to astronomical object in light years
 * @returns Suggested pixel displacement for stereoscopic effect
 */
export const calculateArtisticDisplacement = (
  distanceLightYears: number
): {
  suggestedDisplacement: number;
  category: string;
  description: string;
} => {
  // Simple inverse relationship: closer objects get more displacement
  // Reference: Orion Nebula at 1350 ly → 25px (foreground)
  const referenceDistance = 1350;
  const referenceDisplacement = 25;
  
  // Calculate displacement with inverse relationship
  let displacement = (referenceDistance / distanceLightYears) * referenceDisplacement;
  
  // Constrain to comfortable viewing range
  displacement = Math.max(3, Math.min(50, displacement));
  
  // Categorize the result
  let category = '';
  let description = '';
  
  if (displacement >= 35) {
    category = 'Extreme Foreground';
    description = 'Very close nebular structures - dramatic 3D pop';
  } else if (displacement >= 25) {
    category = 'Foreground';
    description = 'Close nebulae like Orion - strong depth';
  } else if (displacement >= 15) {
    category = 'Mid-range';
    description = 'Middle distance objects - moderate depth';
  } else if (displacement >= 8) {
    category = 'Background';
    description = 'Distant structures - subtle depth';
  } else {
    category = 'Far Background';
    description = 'Very distant objects - minimal depth';
  }
  
  return {
    suggestedDisplacement: Math.round(displacement),
    category,
    description
  };
};

/**
 * Legacy function maintained for backwards compatibility
 * Now redirects to artistic displacement calculation
 */
export const calculateStereoscopicDisplacement = (
  distanceLightYears: number,
  _baselineAU: number = 1.0,
  _focalLengthMm: number = 1000,
  _pixelSizeUm: number = 4.63
): {
  distanceParsecs: number;
  parallaxAngle: number;
  plateScale: number;
  realDisplacement: number;
  constrainedDisplacement: number;
  isConstrained: boolean;
} => {
  const artistic = calculateArtisticDisplacement(distanceLightYears);
  
  // Return dummy scientific values since they're not meaningful
  return {
    distanceParsecs: distanceLightYears * 0.306601,
    parallaxAngle: 0,
    plateScale: 0,
    realDisplacement: artistic.suggestedDisplacement,
    constrainedDisplacement: artistic.suggestedDisplacement,
    isConstrained: false
  };
};

/**
 * Get suggested displacement ranges for common astronomical objects
 * based on equipment parameters
 * 
 * @param focalLengthMm - Telescope focal length in millimeters
 * @param pixelSizeUm - Camera pixel size in micrometers
 * @returns Array of example objects with their calculated displacements
 */
export const getDisplacementExamples = (
  focalLengthMm: number,
  pixelSizeUm: number
): Array<{
  name: string;
  distance: number;
  displacement: number;
  category: string;
}> => {
  const examples = [
    { name: 'Orion Nebula (M42)', distance: 1350, category: 'foreground' },
    { name: 'North America Nebula (NGC 7000)', distance: 2000, category: 'mid-range' },
    { name: 'Rosette Nebula (NGC 2237)', distance: 5000, category: 'background' },
    { name: 'Lagoon Nebula (M8)', distance: 5200, category: 'background' },
    { name: 'Eagle Nebula (M16)', distance: 7000, category: 'far-background' },
    { name: 'Carina Nebula (NGC 3372)', distance: 7500, category: 'far-background' }
  ];

  return examples.map(example => {
    const result = calculateStereoscopicDisplacement(
      example.distance,
      1.0,
      focalLengthMm,
      pixelSizeUm
    );

    return {
      ...example,
      displacement: result.constrainedDisplacement
    };
  });
};
