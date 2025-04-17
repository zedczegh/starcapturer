
/**
 * Utility functions for working with Bortle scale data
 */

/**
 * Get a descriptive text for a given Bortle scale value
 * @param bortleScale The Bortle scale value (1-9)
 * @param t Translation function (optional)
 * @returns Description text for the Bortle scale
 */
export function getBortleDescription(bortleScale: number | null, t?: any): string {
  if (!bortleScale) return t ? 
    t("No light pollution data available.", "无光污染数据可用。") : 
    "No light pollution data available.";
    
  switch (bortleScale) {
    case 1:
      return t ? 
        t("Excellent dark-sky site. The Milky Way casts shadows on the ground.", 
          "极佳的黑暗天空。银河在地上投下阴影。") : 
        "Excellent dark-sky site. The Milky Way casts shadows on the ground.";
    case 2:
      return t ? 
        t("Truly dark site. The Milky Way is highly structured.", 
          "真正的黑暗地点。银河高度结构化。") : 
        "Truly dark site. The Milky Way is highly structured.";
    case 3:
      return t ? 
        t("Rural sky. Some light pollution visible at the horizon.", 
          "乡村天空。地平线有些许光污染。") : 
        "Rural sky. Some light pollution visible at the horizon.";
    case 4:
      return t ? 
        t("Rural/suburban transition. Modest light domes over population centers.", 
          "乡村/郊区过渡。人口中心上方有适度的光穹。") : 
        "Rural/suburban transition. Modest light domes over population centers.";
    case 5:
      return t ? 
        t("Suburban sky. The Milky Way is dim.", 
          "郊区天空。银河暗淡。") : 
        "Suburban sky. The Milky Way is dim.";
    case 6:
      return t ? 
        t("Bright suburban sky. Milky Way only visible at zenith.", 
          "明亮的郊区天空。银河仅在天顶可见。") : 
        "Bright suburban sky. Milky Way only visible at zenith.";
    case 7:
      return t ? 
        t("Suburban/urban transition. The Milky Way is nearly invisible.", 
          "郊区/城市过渡。银河几乎不可见。") : 
        "Suburban/urban transition. The Milky Way is nearly invisible.";
    case 8:
      return t ? 
        t("City sky. No Milky Way, only the brightest stars visible.", 
          "城市天空。没有银河，只有最亮的恒星可见。") : 
        "City sky. No Milky Way, only the brightest stars visible.";
    case 9:
      return t ? 
        t("Inner-city sky. Only the very brightest stars visible.", 
          "市中心天空。只有最亮的恒星可见。") : 
        "Inner-city sky. Only the very brightest stars visible.";
    default:
      return t ? 
        t(`Bortle scale ${bortleScale}: Undefined scale value.`, 
          `波尔特等级 ${bortleScale}：未定义的等级值。`) : 
        `Bortle scale ${bortleScale}: Undefined scale value.`;
  }
}

/**
 * Get the recommended minimum magnification for astrophotography based on Bortle scale
 * @param bortleScale The Bortle scale (1-9)
 * @returns Recommended minimum magnification
 */
export function getRecommendedMinMagnification(bortleScale: number | null): number {
  if (!bortleScale) return 100; // Default value
  
  // Higher Bortle scales require higher magnification to overcome light pollution
  switch (bortleScale) {
    case 1:
    case 2:
      return 50; // Very dark skies allow lower magnification
    case 3:
    case 4:
      return 80; // Rural/suburban transition
    case 5:
    case 6:
      return 100; // Suburban skies
    case 7:
    case 8:
      return 150; // Urban skies require higher magnification
    case 9:
      return 200; // Inner-city skies require maximum magnification
    default:
      return 100;
  }
}
