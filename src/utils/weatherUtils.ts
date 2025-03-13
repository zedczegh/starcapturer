
/**
 * Helper functions for Chinese translations and weather data formatting
 */

// Moon phase translations
export function getMoonPhaseInChinese(phase: string): string {
  const translations: { [key: string]: string } = {
    "New Moon": "新月",
    "Waxing Crescent": "眉月",
    "First Quarter": "上弦月",
    "Waxing Gibbous": "盈凸月",
    "Full Moon": "满月",
    "Waning Gibbous": "亏凸月",
    "Last Quarter": "下弦月",
    "Waning Crescent": "残月",
    "Unknown": "未知"
  };
  return translations[phase] || phase;
}

// Seeing condition translations
export function getSeeingConditionInChinese(condition: string): string {
  const translations: { [key: string]: string } = {
    "Excellent": "极佳",
    "Good": "良好",
    "Average": "一般",
    "Poor": "较差",
    "Very Poor": "非常差",
    "Unknown": "未知"
  };
  return translations[condition] || condition;
}

// Format Bortle scale with description
export function formatBortleScale(value: number, t: (en: string, zh: string) => string) {
  // Ensure Bortle scale is a valid number between 1-9
  let sanitizedValue = value;
  if (isNaN(value) || value < 1) sanitizedValue = 1;
  if (value > 9) sanitizedValue = 9;
  
  if (sanitizedValue <= 1) return `1 (${t("Excellent Dark", "极暗")})`;
  if (sanitizedValue <= 3) return `${sanitizedValue.toFixed(1)} (${t("Very Dark", "很暗")})`;
  if (sanitizedValue <= 5) return `${sanitizedValue.toFixed(1)} (${t("Suburban", "郊区")})`;
  if (sanitizedValue <= 7) return `${sanitizedValue.toFixed(1)} (${t("Bright Suburban", "明亮郊区")})`;
  return `${sanitizedValue.toFixed(1)} (${t("City", "城市")})`;
}

// Get AQI color based on value
export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return "text-green-400";
  if (aqi <= 100) return "text-yellow-400";
  if (aqi <= 150) return "text-orange-400";
  if (aqi <= 200) return "text-red-400";
  if (aqi <= 300) return "text-purple-400";
  return "text-rose-700";
}

// Get AQI description based on value
export function getAQIDescription(aqi: number, t: (en: string, zh: string) => string): string {
  if (aqi <= 50) return t("Good", "优");
  if (aqi <= 100) return t("Moderate", "中等");
  if (aqi <= 150) return t("Unhealthy for Sensitive Groups", "对敏感人群不健康");
  if (aqi <= 200) return t("Unhealthy", "不健康");
  if (aqi <= 300) return t("Very Unhealthy", "非常不健康");
  return t("Hazardous", "危险");
}
