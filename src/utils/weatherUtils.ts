
/**
 * Format an Air Quality Index (AQI) value into a human-readable description
 * @param aqi - The Air Quality Index value
 * @param language - The language to use for the description (en or zh)
 * @returns Human-readable description of the air quality
 */
export const getAQIDescription = (aqi: number | null | undefined, language: string = 'en'): string => {
  if (aqi === null || aqi === undefined) return language === 'en' ? 'Unknown' : '未知';
  
  if (aqi <= 50) return language === 'en' ? 'Good' : '良好';
  if (aqi <= 100) return language === 'en' ? 'Moderate' : '中等';
  if (aqi <= 150) return language === 'en' ? 'Unhealthy for Sensitive Groups' : '对敏感人群不健康';
  if (aqi <= 200) return language === 'en' ? 'Unhealthy' : '不健康';
  if (aqi <= 300) return language === 'en' ? 'Very Unhealthy' : '非常不健康';
  return language === 'en' ? 'Hazardous' : '危险';
};

/**
 * Get the color associated with an Air Quality Index (AQI) value
 * @param aqi - The Air Quality Index value
 * @returns CSS color string
 */
export const getAQIColor = (aqi: number | null | undefined): string => {
  if (aqi === null || aqi === undefined) return '#6B7280'; // gray-500
  
  if (aqi <= 50) return '#10B981'; // green-500
  if (aqi <= 100) return '#FBBF24'; // yellow-400
  if (aqi <= 150) return '#F59E0B'; // amber-500
  if (aqi <= 200) return '#EF4444'; // red-500
  if (aqi <= 300) return '#7C3AED'; // violet-600
  return '#991B1B'; // red-800
};

/**
 * Format Bortle scale to show as a descriptive string
 * @param bortleScale - Bortle scale number (1-9)
 * @param language - The language to use for the description (en or zh)
 * @returns Formatted description string
 */
export const formatBortleScale = (bortleScale: number, language: string = 'en'): string => {
  const descriptions = {
    1: language === 'en' ? 'Excellent dark sky' : '极佳暗夜',
    2: language === 'en' ? 'Truly dark sky' : '真正暗夜',
    3: language === 'en' ? 'Rural sky' : '乡村夜空',
    4: language === 'en' ? 'Rural/suburban transition' : '乡村/郊区过渡',
    5: language === 'en' ? 'Suburban sky' : '郊区夜空',
    6: language === 'en' ? 'Bright suburban sky' : '明亮郊区夜空',
    7: language === 'en' ? 'Suburban/urban transition' : '郊区/城市过渡',
    8: language === 'en' ? 'City sky' : '城市夜空',
    9: language === 'en' ? 'Inner-city sky' : '市中心夜空'
  };
  
  const scale = Math.max(1, Math.min(9, Math.round(bortleScale)));
  return `${scale} - ${descriptions[scale as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9]}`;
};

/**
 * Convert English seeing conditions to Chinese
 * @param condition - The English seeing condition text
 * @returns Chinese translation
 */
export const getSeeingConditionInChinese = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    'Poor': '较差',
    'Fair': '一般',
    'Good': '良好',
    'Excellent': '极佳',
    'Below Average': '低于平均',
    'Average': '平均',
    'Above Average': '高于平均',
    'Unknown': '未知'
  };
  
  return conditionMap[condition] || '未知';
};

/**
 * Convert English moon phase to Chinese
 * @param phase - The English moon phase text
 * @returns Chinese translation
 */
export const getMoonPhaseInChinese = (phase: string): string => {
  const phaseMap: Record<string, string> = {
    'New Moon': '新月',
    'Waxing Crescent': '眉月上弦',
    'First Quarter': '上弦月',
    'Waxing Gibbous': '盈凸月',
    'Full Moon': '满月',
    'Waning Gibbous': '亏凸月',
    'Last Quarter': '下弦月',
    'Waning Crescent': '残月下弦',
    'Unknown': '未知'
  };
  
  return phaseMap[phase] || '未知';
};

/**
 * Convert English weather condition to Chinese
 * @param condition - The English weather condition text
 * @returns Chinese translation
 */
export const getWeatherConditionInChinese = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    'Clear': '晴朗',
    'Sunny': '阳光明媚',
    'Partly Cloudy': '多云',
    'Cloudy': '阴天',
    'Overcast': '阴天',
    'Mist': '薄雾',
    'Fog': '雾',
    'Light Rain': '小雨',
    'Rain': '雨',
    'Heavy Rain': '大雨',
    'Thunderstorm': '雷雨',
    'Snow': '雪',
    'Light Snow': '小雪',
    'Heavy Snow': '大雪',
    'Sleet': '雨夹雪',
    'Unknown': '未知'
  };
  
  return conditionMap[condition] || '未知';
};
