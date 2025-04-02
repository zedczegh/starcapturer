
/**
 * Utility functions for Dark Sky Meter compatibility
 * These functions ensure our measurements align with industry standards
 */

// Convert magnitudes per square arcsecond (MPSAS) to Bortle scale
export function mpsasToBortle(mpsas: number): number {
  // Standard conversion based on IDA and Dark Sky Meter guidelines
  if (mpsas >= 21.99) return 1;       // Class 1: Excellent dark-sky site
  if (mpsas >= 21.89) return 2;       // Class 2: Truly dark site
  if (mpsas >= 21.69) return 3;       // Class 3: Rural sky
  if (mpsas >= 20.49) return 4;       // Class 4: Rural/suburban transition
  if (mpsas >= 19.50) return 5;       // Class 5: Suburban sky
  if (mpsas >= 18.94) return 6;       // Class 6: Bright suburban sky
  if (mpsas >= 18.38) return 7;       // Class 7: Suburban/urban transition
  if (mpsas >= 17.80) return 8;       // Class 8: City sky
  return 9;                           // Class 9: Inner-city sky
}

// Convert Bortle scale to approximate MPSAS
export function bortleToMpsas(bortleScale: number): number {
  // Calculate MPSAS based on Bortle scale
  // More accurate than a simple lookup table by allowing non-integer Bortle values
  switch (Math.floor(bortleScale)) {
    case 1: return 21.99 + (22.10 - 21.99) * (2 - bortleScale);
    case 2: return 21.89 + (21.99 - 21.89) * (3 - bortleScale);
    case 3: return 21.69 + (21.89 - 21.69) * (4 - bortleScale);
    case 4: return 20.49 + (21.69 - 20.49) * (5 - bortleScale);
    case 5: return 19.50 + (20.49 - 19.50) * (6 - bortleScale);
    case 6: return 18.94 + (19.50 - 18.94) * (7 - bortleScale);
    case 7: return 18.38 + (18.94 - 18.38) * (8 - bortleScale);
    case 8: return 17.80 + (18.38 - 17.80) * (9 - bortleScale);
    case 9: return 17.00 + (17.80 - 17.00) * (10 - bortleScale);
    default: return 19.50; // Default to suburban sky (Bortle 5)
  }
}

// Convert camera-measured sky brightness to MPSAS
export function rawBrightnessToMpsas(brightness: number): number {
  // This function converts raw camera brightness values to MPSAS
  // Dark Sky Meter uses a calibration curve for this conversion
  // The formula below is an approximation of their algorithm
  
  // Brightness is typically 0-255 from camera sensors
  // We need to convert this to MPSAS (typically 16-22 range)
  
  // Invert the scale (darker = higher MPSAS)
  const invertedBrightness = 255 - brightness;
  
  // Apply calibration curve (approximation)
  // This curve is based on empirical measurements and DSM documentation
  if (invertedBrightness <= 0) return 16.0; // Very bright urban sky
  
  // Logarithmic transformation to match how human eye perceives brightness
  // and how MPSAS scale works (logarithmic)
  const baseLog = Math.log(invertedBrightness) / Math.log(255);
  
  // Scale to MPSAS range (16-22)
  return 16.0 + (baseLog * 6.0);
}

// Calculate Bortle scale from camera measurement
export function cameraBrightnessToBortle(brightness: number): number {
  const mpsas = rawBrightnessToMpsas(brightness);
  return mpsasToBortle(mpsas);
}

// Additional Dark Sky Meter factors that we should consider
export const additionalFactors = [
  {
    name: "Airglow",
    description: "Natural atmospheric light that can affect measurements",
    impact: "Can artificially increase measured sky brightness"
  },
  {
    name: "Sensor calibration",
    description: "Different camera sensors have different sensitivity",
    impact: "Requires device-specific calibration for accuracy"
  },
  {
    name: "Measurement angle",
    description: "Sky brightness varies with angle from zenith",
    impact: "Measurements should be taken at zenith (straight up)"
  },
  {
    name: "Integration time",
    description: "Longer exposure captures more light",
    impact: "Standardized exposure times needed for consistent results"
  }
];
