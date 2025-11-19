/**
 * Hyperspeed effect utilities for starfield animation
 */

/**
 * Calculate whirlpool distortion effect
 */
export function calculateWhirlpoolDistortion(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  fadeFactor: number,
  pulseModulation: number
): { newX: number; newY: number } {
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  const normalizedDistance = distance / maxDistance;
  
  // More dramatic spiral angle
  const spiralAngle = normalizedDistance * Math.PI * 8 * fadeFactor * pulseModulation;
  const cos = Math.cos(spiralAngle);
  const sin = Math.sin(spiralAngle);
  
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  
  // More dramatic compression
  const compressionFactor = 1 - (normalizedDistance * 0.95 * fadeFactor * pulseModulation);
  
  return {
    newX: centerX + rotatedX * compressionFactor,
    newY: centerY + rotatedY * compressionFactor
  };
}

/**
 * Calculate star trail effect
 */
export function calculateStarTrail(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  fadeFactor: number,
  pulseModulation: number
): { newX: number; newY: number; trailLength: number } {
  const dx = x - centerX;
  const dy = y - centerY;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // More dramatic radial stretch
  const stretchFactor = 1 + (distance / Math.max(centerX, centerY)) * 2.5 * fadeFactor * pulseModulation;
  const trailLength = distance * 0.25 * fadeFactor * pulseModulation;
  
  return {
    newX: centerX + dx * stretchFactor,
    newY: centerY + dy * stretchFactor,
    trailLength
  };
}

/**
 * Calculate fade factor for hyperspeed effects
 */
export function calculateHyperspeedFade(progress: number): number {
  // Extended fade in/out periods
  const fadeInEnd = 0.35;
  const fadeOutStart = 0.65;
  
  let fadeFactor = 0;
  
  if (progress < fadeInEnd) {
    const linearFade = progress / fadeInEnd;
    fadeFactor = Math.pow(linearFade, 1.5); // Ease in curve
  } else if (progress < fadeOutStart) {
    fadeFactor = 1;
  } else {
    const linearFadeOut = (1 - progress) / (1 - fadeOutStart);
    fadeFactor = Math.pow(linearFadeOut, 1.5); // Ease out curve
  }
  
  return fadeFactor;
}

/**
 * Calculate pulse modulation for breathing effect
 */
export function calculatePulseModulation(time: number, frequency: number = 2): number {
  const pulsePhase = time * frequency;
  return 0.5 + Math.sin(pulsePhase) * 0.5; // 0.0 to 1.0 range
}
