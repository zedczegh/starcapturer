
import { Language } from "@/contexts/LanguageContext";

// Create a memoization cache for translations
const factorNameCache: Record<string, Record<Language, string>> = {};
const descriptionCache: Record<string, Record<Language, string>> = {};

// Translate factor names to Chinese if language is set to Chinese
export const getTranslatedFactorName = (name: string, language: Language): string => {
  if (language === 'en') return name;
  
  // Check cache first
  if (factorNameCache[name]?.[language]) {
    return factorNameCache[name][language];
  }
  
  const translations: Record<string, string> = {
    "Light Pollution": "光污染",
    "Weather Conditions": "天气条件",
    "Moon Phase": "月相",
    "Seeing Conditions": "视宁度",
    "Cloud Cover": "云层覆盖",
    "Humidity": "湿度",
    "Wind Speed": "风速",
    "Wind": "风速",
    "Precipitation": "降水量",
    "Elevation": "海拔高度",
    "Air Quality": "空气质量",
    "Season": "季节",
    "Temperature": "温度",
    "Location": "位置"
  };
  
  const result = translations[name] || name;
  
  // Cache the result
  if (!factorNameCache[name]) {
    factorNameCache[name] = {} as Record<Language, string>;
  }
  factorNameCache[name][language] = result;
  
  return result;
};

// Complete translation system for factor descriptions
export const getTranslatedDescription = (description: string, language: Language): string => {
  if (language === 'en') return description;
  
  // Check cache first
  if (descriptionCache[description]?.[language]) {
    return descriptionCache[description][language];
  }
  
  // Specific description handling for common cases
  if (description === "Current conditions make imaging impossible") {
    const result = "当前条件不适合任何形式的天文摄影";
    cacheDescription(description, language, result);
    return result;
  }
  
  // Comprehensive mapping of descriptions to Chinese translations
  const descriptionsMap: Record<string, string> = {
    // Cloud cover descriptions
    "Excellent clear skies, ideal for all types of astrophotography": "天空非常晴朗，适合所有类型的天文摄影",
    "Very good conditions with minimal cloud interference": "很好的条件，云层干扰最小",
    "Moderate cloud cover, suitable for bright targets": "中等云层覆盖，适合明亮的目标",
    "Significant cloud cover, limiting for many targets": "云层覆盖明显，对许多目标有限制",
    "Heavy cloud cover, unsuitable for imaging": "云层覆盖严重，不适合成像",
    
    // Light pollution descriptions
    "Excellent dark sky, Milky Way casts shadows": "极佳的暗夜天空，银河可投射出阴影",
    "Good sky darkness, Milky Way visible with detail": "良好的天空暗度，银河细节可见",
    "Moderate light pollution, limited deep-sky visibility": "中等光污染，深空可见度有限",
    "Significant light pollution, only brighter DSOs visible": "明显的光污染，只能看到更亮的深空天体",
    "Severe light pollution, limiting to planets and bright stars": "严重光污染，仅限于行星和亮星观测",
    
    // Seeing conditions descriptions
    "Excellent atmospheric stability for high-resolution imaging": "极佳的大气稳定性，适合高分辨率成像",
    "Good seeing conditions, suitable for planetary detail": "良好的视宁度条件，适合观测行星细节",
    "Average seeing, acceptable for most targets": "平均视宁度，对大多数目标可接受",
    "Poor seeing conditions, challenging for detailed work": "较差的视宁度条件，观测细节比较困难",
    "Very poor seeing, significant image degradation": "非常差的视宁度，图像质量严重下降",
    
    // Wind descriptions
    "Calm conditions, ideal for all imaging setups": "平静的条件，适合所有成像设置",
    "Light breeze, good for most equipment": "微风，适合大多数设备",
    "Moderate wind, may impact long exposures": "中等风力，可能影响长曝光",
    "Strong wind, challenging for many setups": "强风，对许多设备构成挑战",
    "Very strong wind, unsuitable for most equipment": "风力非常强，不适合大多数设备",
    
    // Humidity descriptions
    "Very dry conditions, excellent for optics": "非常干燥的条件，对光学器材极为有利",
    "Low humidity, good optical performance": "低湿度，良好的光学性能",
    "Moderate humidity, acceptable conditions": "中等湿度，可接受的条件",
    "High humidity, potential for dew formation": "高湿度，可能形成露水",
    "Very high humidity, significant dew issues likely": "非常高的湿度，很可能出现严重的露水问题",
    
    // Air quality descriptions
    "Good air quality, excellent for imaging": "良好的空气质量，非常适合成像",
    "Moderate air quality, good for imaging": "中等空气质量，适合成像",
    "Unhealthy for sensitive groups, acceptable for imaging": "对敏感人群不健康，成像效果可接受",
    "Unhealthy air quality, reduced clarity": "不健康的空气质量，清晰度降低",
    "Very unhealthy air quality, significant haze": "非常不健康的空气质量，有明显雾霾",
    "Hazardous air quality, imaging not recommended": "危险的空气质量，不建议成像",
    
    // Moon phase descriptions
    "New moon provides darkest sky conditions": "新月提供最暗的天空条件",
    "Quarter moon provides moderate sky brightness": "半月提供中等的天空亮度",
    "Full moon significantly brightens the night sky": "满月显著增亮夜空",
    
    // Location descriptions
    "Location search result": "位置搜索结果",
    "Your current location": "您的当前位置",
    
    // Generic quality descriptions
    "Excellent": "极佳",
    "Good": "良好",
    "Moderate": "中等",
    "Poor": "较差",
    "Very poor": "非常差",
    "Low": "低",
    "High": "高",
    "Average": "平均",
    "Significant": "显著",
    "Ideal": "理想",
    "Unsuitable": "不适合",
    "Challenging": "有挑战性",
    "Limited": "有限"
  };
  
  // Try to find an exact match first
  if (descriptionsMap[description]) {
    const result = descriptionsMap[description];
    cacheDescription(description, language, result);
    return result;
  }
  
  // For descriptions that don't have an exact match, try to translate parts
  let translatedDesc = description;
  
  // Replace common English phrases with Chinese equivalents
  const commonPhrases: Record<string, string> = {
    "excellent": "极佳的",
    "good": "良好的",
    "moderate": "中等的",
    "poor": "较差的",
    "very poor": "非常差的",
    "low": "低",
    "high": "高",
    "ideal": "理想的",
    "suitable": "适合的",
    "unsuitable": "不适合的",
    "conditions": "条件",
    "imaging": "成像",
    "visibility": "可见度",
    "atmospheric": "大气的",
    "light pollution": "光污染",
    "cloud cover": "云层覆盖",
    "wind speed": "风速",
    "humidity": "湿度",
    "air quality": "空气质量",
    "seeing": "视宁度"
  };
  
  // Apply replacements
  Object.entries(commonPhrases).forEach(([english, chinese]) => {
    translatedDesc = translatedDesc.replace(new RegExp(english, 'gi'), chinese);
  });
  
  // Cache the result
  cacheDescription(description, language, translatedDesc);
  
  return translatedDesc;
};

// Helper to cache description translations
function cacheDescription(description: string, language: Language, translation: string) {
  if (!descriptionCache[description]) {
    descriptionCache[description] = {} as Record<Language, string>;
  }
  descriptionCache[description][language] = translation;
}

// Optimize progress color calculation with a small cache
const progressColorCache: Record<number, string> = {};

// Get progress color based on score range to match About SIQS page
export const getProgressColor = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (progressColorCache[roundedScore] !== undefined) {
    return progressColorCache[roundedScore];
  }
  
  let result = "var(--red-500)";
  if (score >= 8) result = "var(--green-500)";
  else if (score >= 6) result = "var(--olive-500)";
  else if (score >= 4) result = "var(--yellow-400)";
  else if (score >= 2) result = "var(--orange-400)";
  
  progressColorCache[roundedScore] = result;
  return result;
};
