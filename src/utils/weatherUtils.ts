
/**
 * Translates seeing condition to Chinese
 */
export const getSeeingConditionInChinese = (condition: string): string => {
  switch (condition) {
    case "Excellent":
      return "极佳";
    case "Good":
      return "良好";
    case "Average":
      return "一般";
    case "Poor":
      return "较差";
    case "Very Poor":
      return "很差";
    default:
      return "一般";
  }
};

/**
 * Translates moon phase to Chinese
 */
export const getMoonPhaseInChinese = (phase: string): string => {
  switch (phase) {
    case "New Moon":
      return "新月";
    case "Waxing Crescent":
      return "蛾眉月";
    case "First Quarter":
      return "上弦月";
    case "Waxing Gibbous":
      return "盈凸月";
    case "Full Moon":
      return "满月";
    case "Waning Gibbous":
      return "亏凸月";
    case "Last Quarter":
      return "下弦月";
    case "Waning Crescent":
      return "残月";
    default:
      return phase;
  }
};

/**
 * Translates weather condition to Chinese
 */
export const getWeatherConditionInChinese = (condition: string): string => {
  switch (condition) {
    case "Clear":
      return "晴朗";
    case "Mostly Clear":
      return "大部晴朗";
    case "Partly Cloudy":
      return "部分多云";
    case "Mostly Cloudy":
      return "大部多云";
    case "Overcast":
      return "阴天";
    case "Light Rain":
    case "Slight rain":
      return "小雨";
    case "Moderate Rain":
    case "Moderate rain":
      return "中雨";
    case "Heavy Rain":
    case "Heavy rain":
      return "大雨";
    case "Thunderstorm":
      return "雷暴";
    case "Snow":
    case "Light snow":
      return "小雪";
    case "Moderate snow":
      return "中雪";
    case "Heavy snow":
      return "大雪";
    case "Fog":
      return "雾";
    case "Mist":
      return "薄雾";
    case "Haze":
      return "霾";
    case "Smoke":
      return "烟雾";
    case "Dust":
      return "尘土";
    case "Sand":
      return "沙尘";
    case "Ash":
      return "灰烬";
    case "Squall":
      return "暴风";
    case "Tornado":
      return "龙卷风";
    default:
      return condition;
  }
};

/**
 * Formats the temperature with appropriate unit
 */
export const formatTemperature = (temp: number, unit = 'C'): string => {
  if (unit === 'F') {
    return `${Math.round((temp * 9/5) + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

/**
 * Gets color class based on temperature
 */
export const getTemperatureColorClass = (temp: number): string => {
  if (temp < 0) return 'text-blue-500';
  if (temp < 10) return 'text-blue-400';
  if (temp < 20) return 'text-green-400';
  if (temp < 30) return 'text-yellow-400';
  if (temp < 35) return 'text-amber-500';
  return 'text-red-500';
};

/**
 * Gets AQI (Air Quality Index) category from numeric value
 */
export const getAQICategory = (aqi: number): {
  label: string;
  color: string;
  chineseLabel: string;
} => {
  if (aqi <= 50) {
    return { label: 'Good', color: 'text-green-400', chineseLabel: '优' };
  } else if (aqi <= 100) {
    return { label: 'Moderate', color: 'text-yellow-400', chineseLabel: '良' };
  } else if (aqi <= 150) {
    return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-400', chineseLabel: '轻度污染' };
  } else if (aqi <= 200) {
    return { label: 'Unhealthy', color: 'text-red-400', chineseLabel: '中度污染' };
  } else if (aqi <= 300) {
    return { label: 'Very Unhealthy', color: 'text-purple-400', chineseLabel: '重度污染' };
  } else {
    return { label: 'Hazardous', color: 'text-red-600', chineseLabel: '严重污染' };
  }
};

/**
 * Determines if an hour is during the night (good for astrophotography)
 */
export const isNightHour = (hour: number): boolean => {
  return hour >= 20 || hour <= 5; // 8PM to 5AM
};

/**
 * Gets the weather icon name based on cloud cover and precipitation
 */
export const getWeatherIconFromConditions = (
  cloudCover: number,
  precipitation: number = 0,
  isNight: boolean = false
): string => {
  if (precipitation > 5) {
    return isNight ? 'cloud-rain' : 'cloud-rain';
  }
  
  if (precipitation > 0) {
    return isNight ? 'cloud-drizzle' : 'cloud-drizzle';
  }
  
  if (cloudCover > 80) {
    return 'cloud';
  }
  
  if (cloudCover > 50) {
    return isNight ? 'cloud-moon' : 'cloud-sun';
  }
  
  if (cloudCover > 20) {
    return isNight ? 'moon' : 'sun';
  }
  
  return isNight ? 'moon-stars' : 'sun';
};
