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
 * Calculate pixel displacement from parallax angle and plate scale
 * 
 * @param parallaxAngleArcsec - Parallax angle in arcseconds
 * @param plateScaleArcsecPerPixel - Plate scale in arcseconds per pixel
 * @param constrainForViewing - Whether to constrain the result to comfortable viewing maximum (50px)
 * @returns Pixel displacement amount
 */
export const calculateDisplacementFromParallax = (
  parallaxAngleArcsec: number,
  plateScaleArcsecPerPixel: number,
  constrainForViewing: boolean = true
): number => {
  const rawDisplacement = parallaxAngleArcsec / plateScaleArcsecPerPixel;

  if (constrainForViewing) {
    // Only constrain maximum for comfortable stereoscopic viewing
    // No minimum - let users see even subtle effects
    return Math.min(50, rawDisplacement);
  }

  return rawDisplacement;
};

/**
 * Complete parallax-to-pixel displacement calculation
 * 
 * This function combines all the steps to convert astronomical distance
 * and imaging equipment parameters into a pixel displacement value suitable
 * for stereoscopic 3D imaging.
 * 
 * @param distanceLightYears - Distance to astronomical object in light years
 * @param baselineAU - Baseline distance in AU (default: 1 AU for Earth's orbit)
 * @param focalLengthMm - Telescope focal length in millimeters
 * @param pixelSizeUm - Camera pixel size in micrometers
 * @returns Object containing all intermediate and final values
 */
export const calculateStereoscopicDisplacement = (
  distanceLightYears: number,
  baselineAU: number = 1.0,
  focalLengthMm: number,
  pixelSizeUm: number
): {
  distanceParsecs: number;
  parallaxAngle: number;
  plateScale: number;
  realDisplacement: number;
  constrainedDisplacement: number;
  isConstrained: boolean;
} => {
  // Step 1: Convert distance to parsecs
  const distanceParsecs = lightYearsToParsecs(distanceLightYears);

  // Step 2: Calculate parallax angle
  const parallaxAngle = calculateParallaxAngle(baselineAU, distanceParsecs);

  // Step 3: Calculate plate scale from equipment
  const plateScale = calculatePlateScale(focalLengthMm, pixelSizeUm);

  // Step 4: Calculate real pixel displacement
  const realDisplacement = calculateDisplacementFromParallax(
    parallaxAngle,
    plateScale,
    false // Don't constrain for scientific accuracy
  );

  // Step 5: Calculate constrained displacement for viewing
  const constrainedDisplacement = calculateDisplacementFromParallax(
    parallaxAngle,
    plateScale,
    true // Constrain to 3-50px for comfortable viewing
  );

  const isConstrained = Math.abs(realDisplacement - constrainedDisplacement) > 0.01;

  return {
    distanceParsecs,
    parallaxAngle,
    plateScale,
    realDisplacement,
    constrainedDisplacement,
    isConstrained
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
