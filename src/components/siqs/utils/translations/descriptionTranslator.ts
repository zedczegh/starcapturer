
import { Language } from "@/contexts/LanguageContext";
import { descriptionsMap } from "./descriptionMappings";
import { commonPhrases } from "./commonPhrases";
import { getCachedDescription, cacheDescription } from "./descriptionCache";

/**
 * Complete translation system for factor descriptions
 * @param description The English description to translate
 * @param language The target language
 * @returns Translated description
 */
export const getTranslatedDescription = (description: string, language: Language): string => {
  if (language === 'en') return description;
  
  // Check cache first
  const cachedTranslation = getCachedDescription(description, language);
  if (cachedTranslation) {
    return cachedTranslation;
  }
  
  // Specific description handling for common cases
  if (description === "Current conditions make imaging impossible") {
    const result = "当前条件不适合任何形式的天文摄影";
    cacheDescription(description, language, result);
    return result;
  }
  
  // Handle cloud cover descriptions with percentages
  if (description.includes("Cloud cover") || description.includes("cloud cover")) {
    const match = description.match(/(\d+\.?\d*)%/);
    if (match && match[1]) {
      const percentage = parseFloat(match[1]).toFixed(1);
      
      if (description.includes("makes imaging impossible") || description.includes("makes imaging difficult")) {
        const result = `${percentage}%的云层覆盖使成像不可能`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("clear") || description.includes("Clear")) {
        const result = `晴朗的天空，云层覆盖${percentage}%，非常适合观测`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Mostly clear") || description.includes("mostly clear")) {
        const result = `大部分晴朗，云层覆盖${percentage}%，适合观测`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Partly cloudy") || description.includes("partly cloudy")) {
        const result = `部分多云，云层覆盖${percentage}%，可能影响观测质量`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Cloudy") || description.includes("cloudy")) {
        const result = `多云，云层覆盖${percentage}%，观测条件有挑战性`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Heavy cloud") || description.includes("heavy cloud")) {
        const result = `重度云层覆盖${percentage}%，观测条件困难`;
        cacheDescription(description, language, result);
        return result;
      }
      
      // Default cloud cover translation
      const result = `云层覆盖${percentage}%，影响观测质量`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  // Handle wind speed with specific measurements
  if (description.includes("wind") || description.includes("Wind")) {
    const match = description.match(/(\d+\.?\d*)\s*km\/h/);
    if (match && match[1]) {
      const windSpeed = parseFloat(match[1]).toFixed(1);
      
      if (description.includes("Calm conditions") || description.includes("calm")) {
        const result = `平静条件，风速${windSpeed}km/h，非常适合观测`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Light breeze") || description.includes("light breeze")) {
        const result = `微风，风速${windSpeed}km/h，对观测影响很小`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Moderate wind") || description.includes("moderate wind")) {
        const result = `中等风速${windSpeed}km/h，可能影响望远镜稳定性`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Strong wind") || description.includes("strong wind")) {
        const result = `强风${windSpeed}km/h，显著影响观测稳定性`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("High winds") || description.includes("high winds")) {
        const result = `大风${windSpeed}km/h，观测非常困难`;
        cacheDescription(description, language, result);
        return result;
      }
      
      // Default wind translation
      const result = `风速${windSpeed}km/h，影响观测稳定性`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  // Handle humidity with specific percentages
  if (description.includes("humidity") || description.includes("Humidity")) {
    const match = description.match(/(\d+\.?\d*)%/);
    if (match && match[1]) {
      const humidity = parseFloat(match[1]).toFixed(1);
      
      if (description.includes("Low humidity") || description.includes("low humidity")) {
        const result = `低湿度${humidity}%，提供最佳观测条件`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Moderate humidity") || description.includes("moderate humidity")) {
        const result = `中等湿度${humidity}%，可能影响设备`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("High humidity") || description.includes("high humidity")) {
        const result = `高湿度${humidity}%，增加了设备起雾的风险`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Very high humidity") || description.includes("very high humidity")) {
        const result = `非常高湿度${humidity}%，需要防雾措施`;
        cacheDescription(description, language, result);
        return result;
      }
      
      // Default humidity translation
      const result = `湿度${humidity}%，可能影响设备`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  // Handle Air Quality Index (AQI)
  if (description.includes("air quality") || description.includes("Air quality") || description.includes("AQI")) {
    const match = description.match(/AQI:\s*(\d+)/);
    if (match && match[1]) {
      const aqi = match[1];
      
      if (description.includes("Excellent air") || description.includes("excellent air")) {
        const result = `极佳的空气质量（AQI: ${aqi}）`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Good air") || description.includes("good air")) {
        const result = `良好的空气质量（AQI: ${aqi}）`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Moderate air") || description.includes("moderate air")) {
        const result = `中等空气质量（AQI: ${aqi}）`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Poor air") || description.includes("poor air")) {
        const result = `较差的空气质量（AQI: ${aqi}），影响可见度`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (description.includes("Very poor air") || description.includes("very poor air")) {
        const result = `非常差的空气质量（AQI: ${aqi}），显著降低透明度`;
        cacheDescription(description, language, result);
        return result;
      }
      
      // Default AQI translation
      const result = `空气质量指数（AQI: ${aqi}）`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  // Handle Light pollution with Bortle scale
  if (description.includes("light pollution") || description.includes("Light pollution") || description.includes("Bortle")) {
    const match = description.match(/Bortle\s*(\d+)/);
    if (match && match[1]) {
      const bortleScale = match[1];
      
      if (parseFloat(bortleScale) <= 3) {
        const result = `暗夜天空（伯尔特等级 ${bortleScale}），非常适合深空天体观测`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (parseFloat(bortleScale) <= 5) {
        const result = `中等光污染（伯尔特等级 ${bortleScale}），适合大多数观测目标`;
        cacheDescription(description, language, result);
        return result;
      }
      
      if (parseFloat(bortleScale) <= 7) {
        const result = `显著光污染（伯尔特等级 ${bortleScale}），限制暗淡天体的观测`;
        cacheDescription(description, language, result);
        return result;
      }
      
      const result = `严重光污染（伯尔特等级 ${bortleScale}），深空观测条件困难`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  // Try to find an exact match in descriptions map
  if (descriptionsMap[description]) {
    const result = descriptionsMap[description];
    cacheDescription(description, language, result);
    return result;
  }
  
  // For descriptions that don't have an exact match, try to translate parts
  let translatedDesc = description;
  
  // Apply word-by-word replacements
  Object.entries(commonPhrases).forEach(([english, chinese]) => {
    // Use case-insensitive replacement
    const regex = new RegExp(english, 'gi');
    translatedDesc = translatedDesc.replace(regex, chinese);
  });
  
  // Detect and fix any remaining mixed language issues
  if (/[a-zA-Z].*[一-龥]|[一-龥].*[a-zA-Z]/.test(translatedDesc)) {
    console.warn("Mixed language detected after translation:", translatedDesc);
    
    // Apply additional common fixes for mixed language
    translatedDesc = translatedDesc
      .replace(/(\d+\.?\d*)\s*km\/h/g, '$1公里/小时')
      .replace(/AQI:\s*(\d+)/g, 'AQI: $1')
      .replace(/Bortle\s*(\d+)/g, '伯尔特等级$1');
  }
  
  // Cache the result
  cacheDescription(description, language, translatedDesc);
  
  return translatedDesc;
};
