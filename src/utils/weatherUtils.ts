
/**
 * Get the Chinese translation for a seeing condition
 */
export const getSeeingConditionInChinese = (englishCondition: string): string => {
  const mappings: Record<string, string> = {
    "Excellent": "极佳",
    "Very Good": "非常好",
    "Good": "良好",
    "Fair": "一般",
    "Poor": "较差",
    "Very Poor": "很差",
    "Bad": "差"
  };
  
  return mappings[englishCondition] || englishCondition;
};

/**
 * Get the Chinese translation for a moon phase
 */
export const getMoonPhaseInChinese = (englishPhase: string): string => {
  const mappings: Record<string, string> = {
    "New Moon": "新月",
    "Waxing Crescent": "蛾眉月",
    "First Quarter": "上弦月",
    "Waxing Gibbous": "盈凸月",
    "Full Moon": "满月",
    "Waning Gibbous": "亏凸月",
    "Last Quarter": "下弦月",
    "Waning Crescent": "残月"
  };
  
  return mappings[englishPhase] || englishPhase;
};

/**
 * Get the Chinese translation for a weather condition
 */
export const getWeatherConditionInChinese = (englishCondition: string): string => {
  const mappings: Record<string, string> = {
    "Clear": "晴朗",
    "Sunny": "晴天",
    "Partly Cloudy": "多云",
    "Cloudy": "阴天",
    "Overcast": "阴",
    "Mist": "薄雾",
    "Fog": "雾",
    "Light Rain": "小雨",
    "Moderate Rain": "中雨",
    "Heavy Rain": "大雨",
    "Thunderstorm": "雷雨",
    "Snow": "雪",
    "Sleet": "雨夹雪",
    "Hail": "冰雹",
    "Windy": "大风"
  };
  
  return mappings[englishCondition] || englishCondition;
};
