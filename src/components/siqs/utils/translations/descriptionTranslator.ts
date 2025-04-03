
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
  
  if (description.includes("Cloud cover of")) {
    const match = description.match(/Cloud cover of (\d+)%/);
    if (match && match[1]) {
      const result = `${match[1]}%的云量覆盖影响成像质量`;
      cacheDescription(description, language, result);
      return result;
    }
  }
  
  if (description.includes("Light pollution")) {
    if (description.includes("severe")) {
      const result = "严重的光污染影响天体可见度";
      cacheDescription(description, language, result);
      return result;
    }
    if (description.includes("moderate")) {
      const result = "中度光污染降低了天体对比度";
      cacheDescription(description, language, result);
      return result;
    }
    const result = "光污染影响观测质量";
    cacheDescription(description, language, result);
    return result;
  }
  
  if (description.includes("Moon phase")) {
    const result = "月相影响深空天体的可见度";
    cacheDescription(description, language, result);
    return result;
  }
  
  if (description.includes("Humidity")) {
    const result = "高湿度可能导致光学设备起雾";
    cacheDescription(description, language, result);
    return result;
  }
  
  if (description.includes("Wind speed")) {
    const result = "风速影响望远镜稳定性";
    cacheDescription(description, language, result);
    return result;
  }
  
  if (description.includes("Seeing conditions")) {
    const result = "大气视宁度影响图像清晰度";
    cacheDescription(description, language, result);
    return result;
  }
  
  // Try to find an exact match first
  if (descriptionsMap[description]) {
    const result = descriptionsMap[description];
    cacheDescription(description, language, result);
    return result;
  }
  
  // For descriptions that don't have an exact match, try to translate parts
  let translatedDesc = description;
  
  // Apply replacements
  Object.entries(commonPhrases).forEach(([english, chinese]) => {
    translatedDesc = translatedDesc.replace(new RegExp(english, 'gi'), chinese);
  });
  
  // Cache the result
  cacheDescription(description, language, translatedDesc);
  
  return translatedDesc;
};
