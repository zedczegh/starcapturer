/**
 * Bortle Scale Color Mapping
 * Reference: https://en.wikipedia.org/wiki/Bortle_scale
 */

export interface BortleScaleInfo {
  scale: number;
  name: string;
  color: string;
  description: string;
}

export const BORTLE_SCALE_DATA: BortleScaleInfo[] = [
  {
    scale: 1,
    name: "Excellent dark sky",
    color: "#000000", // Black
    description: "The darkest skies available on Earth"
  },
  {
    scale: 2,
    name: "Typical dark sky",
    color: "#1a1a2e", // Very dark blue-black
    description: "Truly dark site"
  },
  {
    scale: 3,
    name: "Rural sky",
    color: "#2d4059", // Dark blue
    description: "Rural areas"
  },
  {
    scale: 4,
    name: "Rural/suburban transition",
    color: "#4a5d7c", // Medium blue
    description: "Rural/suburban transition"
  },
  {
    scale: 5,
    name: "Suburban sky",
    color: "#7b8fa3", // Light blue-gray
    description: "Suburban areas"
  },
  {
    scale: 6,
    name: "Bright suburban sky",
    color: "#ffcc66", // Light orange
    description: "Bright suburban sky"
  },
  {
    scale: 7,
    name: "Suburban/urban transition",
    color: "#ff9933", // Orange
    description: "Suburban/urban transition"
  },
  {
    scale: 8,
    name: "City sky",
    color: "#ff6600", // Bright orange
    description: "City sky"
  },
  {
    scale: 9,
    name: "Inner-city sky",
    color: "#ff0000", // Red
    description: "Inner-city sky - heavily light polluted"
  }
];

export const getBortleColor = (bortleScale: number | null | undefined): string => {
  if (!bortleScale) return "#808080"; // Gray for unknown
  
  const clamped = Math.max(1, Math.min(9, Math.round(bortleScale)));
  return BORTLE_SCALE_DATA[clamped - 1].color;
};

export const getBortleInfo = (bortleScale: number | null | undefined): BortleScaleInfo | null => {
  if (!bortleScale) return null;
  
  const clamped = Math.max(1, Math.min(9, Math.round(bortleScale)));
  return BORTLE_SCALE_DATA[clamped - 1];
};

export const getBortleOpacity = (bortleScale: number | null | undefined): number => {
  if (!bortleScale) return 0.3;
  
  // Higher Bortle scale (more pollution) = more visible/opaque
  const normalized = (bortleScale - 1) / 8; // 0 to 1 range
  return 0.3 + (normalized * 0.5); // 0.3 to 0.8 range
};
