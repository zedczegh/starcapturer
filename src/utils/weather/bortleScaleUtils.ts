
/**
 * Utilities for working with Bortle scale data
 * This is a more organized version of the previous utils
 */
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Get descriptive text for a Bortle scale value
 * @param bortleScale The Bortle scale value (1-9)
 * @param t Translation function (optional)
 * @returns Description of the Bortle scale
 */
export function getBortleDescription(bortleScale: number | null, t?: (en: string, zh: string) => string): string {
  // Default translation function if not provided
  const translate = t || ((en: string, zh: string) => en);
  
  if (bortleScale === null) {
    return translate(
      "Unable to determine light pollution level.",
      "无法确定光污染级别。"
    );
  }
  
  // Ensure scale is between 1-9
  const scale = Math.max(1, Math.min(9, Math.round(bortleScale)));
  
  switch (scale) {
    case 1:
      return translate(
        "Excellent dark site. The Milky Way casts shadows. Astronomical objects like M33 are visible to the naked eye.",
        "极佳的黑暗地点。银河能投下影子。类似M33这样的天文目标可以肉眼可见。"
      );
    case 2:
      return translate(
        "Typical dark site. Airglow is visible. The Milky Way is highly structured.",
        "典型的黑暗地点。可以看到大气辉光。银河的结构清晰可见。"
      );
    case 3:
      return translate(
        "Rural sky. Some light pollution but the Milky Way still appears complex.",
        "乡村天空。有轻微光污染，但银河仍然呈现复杂结构。"
      );
    case 4:
      return translate(
        "Rural/suburban transition. Modest light pollution. Milky Way visible well above the horizon.",
        "乡村/郊区过渡区。中等光污染。银河在地平线上方清晰可见。"
      );
    case 5:
      return translate(
        "Suburban sky. Light pollution obvious. Milky Way very weak or invisible near horizon.",
        "郊区天空。光污染明显。银河在地平线附近非常微弱或不可见。"
      );
    case 6:
      return translate(
        "Bright suburban sky. Milky Way only visible at zenith. Many Messier objects difficult to see.",
        "明亮的郊区天空。银河只在天顶附近可见。许多梅西耶天体难以观测。"
      );
    case 7:
      return translate(
        "Suburban/urban transition. Entire sky has grayish-white hue. Strong light domes.",
        "郊区/城市过渡区。整个天空呈灰白色调。有强烈的光穹。"
      );
    case 8:
      return translate(
        "City sky. Sky glows whitish-gray or orange. Many stars forming constellations invisible.",
        "城市天空。天空呈现白灰色或橙色辉光。许多形成星座的恒星不可见。"
      );
    case 9:
      return translate(
        "Inner city sky. Entire sky brightly lit. Only a few stars visible.",
        "城市中心天空。整个天空明亮发光。只有少数几颗恒星可见。"
      );
    default:
      return translate(
        "Unknown light pollution level.",
        "未知光污染级别。"
      );
  }
}

/**
 * Get color based on Bortle scale
 * @param bortleScale The Bortle scale value (1-9)
 * @returns Hex color code representing the Bortle scale
 */
export function getBortleScaleColor(bortleScale: number | null): string {
  if (bortleScale === null) return "#777777";
  
  // Ensure scale is between 1-9
  const scale = Math.max(1, Math.min(9, Math.round(bortleScale)));
  
  // Colors from excellent dark site (blue) to inner city (red)
  const colors = [
    "#0a1172", // 1: Excellent dark site (deep blue)
    "#0e38b1", // 2: Typical dark site (blue)
    "#1e56e8", // 3: Rural sky (lighter blue)
    "#267f00", // 4: Rural/suburban transition (green)
    "#7fa100", // 5: Suburban sky (yellow-green)
    "#e6c600", // 6: Bright suburban sky (yellow)
    "#e67e00", // 7: Suburban/urban transition (orange)
    "#e63900", // 8: City sky (red-orange)
    "#e60026", // 9: Inner city sky (red)
  ];
  
  return colors[scale - 1];
}

/**
 * Get a simplified description suitable for UI display
 */
export function getSimpleBortleDescription(bortleScale: number | null, t?: (en: string, zh: string) => string): string {
  // Default translation function if not provided
  const translate = t || ((en: string, zh: string) => en);
  
  if (bortleScale === null) {
    return translate("Unknown", "未知");
  }
  
  // Ensure scale is between 1-9
  const scale = Math.max(1, Math.min(9, Math.round(bortleScale)));
  
  switch (scale) {
    case 1:
      return translate("Exceptional Dark Sky", "极佳暗空");
    case 2:
      return translate("Truly Dark Sky", "真正暗空");
    case 3:
      return translate("Rural Dark Sky", "乡村暗空");
    case 4:
      return translate("Rural Sky", "乡村天空");
    case 5:
      return translate("Suburban Sky", "郊区天空");
    case 6:
      return translate("Bright Suburban Sky", "明亮郊区天空");
    case 7:
      return translate("Light Polluted Sky", "光污染天空");
    case 8:
      return translate("City Sky", "城市天空");
    case 9:
      return translate("Inner City Sky", "城市中心天空");
    default:
      return translate("Unknown", "未知");
  }
}
