
import { Language } from "@/contexts/LanguageContext";

/**
 * Map of English factor names to Chinese translations
 */
const factorNameMap: Record<string, string> = {
  "Cloud Cover": "云层覆盖",
  "Light Pollution": "光污染",
  "Seeing Conditions": "大气视宁度",
  "Wind": "风速",
  "Humidity": "湿度",
  "Moon Phase": "月相",
  "Precipitation": "降水",
  "Air Quality": "空气质量",
  "Weather Condition": "天气状况"
};

/**
 * Get translated factor name based on language
 * @param factorName The English factor name
 * @param language Target language
 * @returns Translated factor name
 */
export const getTranslatedFactorName = (factorName: string, language: Language): string => {
  if (language === 'en') return factorName;
  
  // Check if we have a direct translation
  if (factorNameMap[factorName]) {
    return factorNameMap[factorName];
  }
  
  // If no translation is found, return the original
  return factorName;
};
