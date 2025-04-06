
/**
 * Translation dictionary for common SIQS factor descriptions
 */
const translationMap: Record<string, Record<string, string>> = {
  "zh": {
    // Cloud Cover
    "Clear skies, perfect for astrophotography": "晴朗的天空，非常适合天文摄影",
    "Mostly clear with minimal cloud impact": "大部分晴朗，云层影响极小",
    "Good visibility with some clouds": "能见度良好，有少量云层",
    "Moderate clouds affecting visibility": "中等云层影响能见度",
    "Significant cloud cover limiting observation": "大量云层限制观测",
    "Heavy cloud cover, poor conditions": "浓密云层，条件较差",
    
    // Light Pollution
    "Exceptional dark sky site": "极佳的暗夜地点",
    "Very dark sky, excellent for astronomy": "非常暗的天空，非常适合天文观测",
    "Rural sky, good for deep space objects": "乡村天空，适合深空物体观测",
    "Rural/suburban transition, good for brighter objects": "乡村/郊区过渡带，适合观测较亮天体",
    "Suburban sky, limited for dim objects": "郊区天空，观测暗淡天体受限",
    "Bright suburban sky, challenging conditions": "明亮的郊区天空，具有挑战性的条件",
    "Urban sky with significant light pollution": "城市天空，光污染显著",
    "City center with severe light pollution": "市中心，光污染严重",
    
    // Moon Phase
    "New moon, ideal for deep sky imaging": "新月，非常适合深空成像",
    "Crescent moon with minimal impact": "新月，影响极小",
    "Quarter moon, moderate impact on deep sky objects": "四分之一月相，对深空物体有中等影响",
    "Gibbous moon, significant brightness": "凸月，亮度显著",
    "Full moon, limiting for deep space photography": "满月，深空摄影受限",
    
    // Weather Conditions
    "Perfect weather for observation": "完美的观测天气",
    "Good weather for astronomy": "适合天文观测的天气",
    "Weather conditions slightly limiting visibility": "天气条件略微限制能见度",
    "Weather conditions significantly affecting observation": "天气条件显著影响观测",
    "Poor weather for astronomical purposes": "不适合天文观测的天气",
    
    // Wind
    "Calm conditions, ideal for imaging": "平静条件，非常适合成像",
    "Light breeze, minimal impact on telescope": "微风，对望远镜影响极小",
    "Moderate wind, some telescope stability issues": "中等风速，望远镜稳定性有些问题",
    "Strong wind impacting telescope stability": "强风影响望远镜稳定性",
    "Very windy, not recommended for imaging": "风很大，不推荐成像",
    
    // Humidity
    "Low humidity, excellent for optics": "湿度低，非常适合光学设备",
    "Moderate humidity, good conditions": "湿度适中，条件良好",
    "Higher humidity may cause dew formation": "湿度较高，可能形成露水",
    "High humidity affecting lens clarity": "湿度高，影响镜头清晰度",
    "Very humid, significant risk of fogging": "非常湿润，有明显的起雾风险",
    
    // Seeing Conditions
    "Excellent seeing, perfect for planetary detail": "视宁度极佳，非常适合观测行星细节",
    "Very good seeing conditions": "视宁度非常好",
    "Average atmospheric stability": "大气稳定性一般",
    "Poor seeing limiting fine detail": "视宁度较差，限制细节观测",
    "Very poor seeing conditions": "视宁度非常差",
    
    // Air Quality
    "Excellent air quality, perfect clarity": "空气质量极佳，清晰度完美",
    "Good air quality with minimal impact": "空气质量良好，影响极小",
    "Moderate air quality slightly affecting visibility": "空气质量一般，略微影响能见度",
    "Poor air quality limiting observation": "空气质量差，限制观测",
    "Very poor air quality, significantly reduced visibility": "空气质量非常差，能见度显著降低",
    
    // Clear Sky Rate
    "Annual clear sky rate": "年平均晴空率",
    "favorable for astrophotography": "有利于天文摄影",
    "Historical clear sky data shows excellent conditions": "历史晴空数据显示条件极佳",
    "Historical clear sky data shows good conditions": "历史晴空数据显示条件良好",
    "Historical clear sky data shows moderate conditions": "历史晴空数据显示条件一般"
  }
};

/**
 * Get translated description for SIQS factor
 * @param description Original description in English
 * @param language Target language code
 * @returns Translated description or original if no translation exists
 */
export function getTranslatedDescription(description: string, language: string): string {
  if (language === 'en' || !description) return description;
  
  const translations = translationMap[language];
  if (!translations) return description;
  
  // Try exact match first
  if (translations[description]) {
    return translations[description];
  }
  
  // If no exact match, try to find partial matches
  for (const [key, value] of Object.entries(translations)) {
    if (description.includes(key)) {
      return description.replace(key, value);
    }
  }
  
  // If still no match, return original
  return description;
}
