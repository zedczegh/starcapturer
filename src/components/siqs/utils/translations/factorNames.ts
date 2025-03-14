
import { Language } from "@/contexts/LanguageContext";

// Create a memoization cache for translations
const factorNameCache: Record<string, Record<Language, string>> = {};

/**
 * Translate factor names to Chinese if language is set to Chinese
 * @param name Factor name in English
 * @param language Current UI language
 * @returns Translated factor name
 */
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
