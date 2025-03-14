
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
