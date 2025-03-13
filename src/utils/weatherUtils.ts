
/**
 * Helper functions for Chinese translations and weather data formatting
 */

// Moon phase translations with improved accuracy
export function getMoonPhaseInChinese(phase: string): string {
  const translations: { [key: string]: string } = {
    "New Moon": "新月",
    "Waxing Crescent": "蛾眉月",
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

// Seeing condition translations with improved clarity
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

// Format Bortle scale with description - enhanced for better visualization
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

// Get AQI color based on value - with optimized color ranges
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

// Convert weather condition to Chinese for better UX
export function getWeatherConditionInChinese(condition: string): string {
  const translations: { [key: string]: string } = {
    "Clear": "晴朗",
    "Sunny": "晴天",
    "Partly Cloudy": "局部多云",
    "Cloudy": "多云",
    "Overcast": "阴天",
    "Mist": "薄雾",
    "Fog": "雾",
    "Light Rain": "小雨",
    "Moderate Rain": "中雨",
    "Heavy Rain": "大雨",
    "Light Snow": "小雪",
    "Moderate Snow": "中雪",
    "Heavy Snow": "大雪",
    "Thunderstorm": "雷暴",
    "Drizzle": "毛毛雨",
    "Haze": "霾",
    "Smoke": "烟雾",
    "Dust": "尘土",
    "Sand": "沙尘",
    "Squalls": "狂风",
    "Tornado": "龙卷风",
    "Hurricane": "飓风",
    "Hot": "炎热",
    "Cold": "寒冷",
    "Windy": "有风"
  };
  
  for (const [key, value] of Object.entries(translations)) {
    if (condition.includes(key)) {
      return value;
    }
  }
  
  return condition;
}

// Optimize weather condition classification for more accurate SIQS calculations
export function classifyWeatherCondition(condition: string): 'good' | 'moderate' | 'poor' | 'bad' {
  const lowerCondition = condition.toLowerCase();
  
  const goodConditions = ['clear', 'sunny', 'fair'];
  const moderateConditions = ['partly cloudy', 'partly', 'few clouds'];
  const poorConditions = ['cloudy', 'overcast', 'mist', 'haze'];
  const badConditions = ['rain', 'snow', 'drizzle', 'sleet', 'fog', 'thunderstorm', 'storm'];
  
  if (goodConditions.some(c => lowerCondition.includes(c))) return 'good';
  if (moderateConditions.some(c => lowerCondition.includes(c))) return 'moderate';
  if (poorConditions.some(c => lowerCondition.includes(c))) return 'poor';
  if (badConditions.some(c => lowerCondition.includes(c))) return 'bad';
  
  return 'moderate'; // Default to moderate if unknown
}
