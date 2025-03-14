
/**
 * Utility functions for Bortle scale descriptions and visualizations
 */

/**
 * Get Bortle scale description based on the value
 */
export function getBortleScaleDescription(bortleScale: number): string {
  // Round to the nearest integer for description lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const descriptions = {
    1: "Excellent dark sky, Milky Way casts shadows",
    2: "Truly dark sky, Milky Way highly structured",
    3: "Rural sky, some light pollution but good detail",
    4: "Rural/suburban transition, moderate light pollution",
    5: "Suburban sky, Milky Way washed out overhead",
    6: "Bright suburban sky, Milky Way only at zenith",
    7: "Suburban/urban transition, no Milky Way visible",
    8: "City sky, can see only Moon, planets, brightest stars",
    9: "Inner city sky, only very brightest celestial objects visible"
  };
  
  return descriptions[scale as keyof typeof descriptions] || "Unknown light pollution level";
}

/**
 * Get Bortle scale color for visualization
 */
export function getBortleScaleColor(bortleScale: number): string {
  // Round to the nearest integer for color lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const colors = {
    1: "#000033", // Near black/dark blue
    2: "#000066", // Very dark blue
    3: "#0000cc", // Dark blue
    4: "#0099ff", // Medium blue
    5: "#33cc33", // Green
    6: "#ffff00", // Yellow
    7: "#ff9900", // Orange
    8: "#ff0000", // Red
    9: "#ff00ff"  // Magenta
  };
  
  return colors[scale as keyof typeof colors] || "#ffffff";
}
