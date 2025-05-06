import { commonPhrases } from './commonPhrases';
import { descriptionMappings } from './descriptionMappings';
import { convertToSimplifiedChinese } from '@/utils/chineseCharacterConverter';

/**
 * Translates a description to the specified language
 * @param description The description to translate
 * @param targetLanguage The target language code
 * @returns The translated description
 */
export function getTranslatedDescription(
  description: string, 
  targetLanguage: 'en' | 'zh' = 'en'
): string {
  // If target language is English or description is missing, return as is
  if (targetLanguage === 'en' || !description) {
    return description;
  }
  
  // Check if there's a direct mapping for this description
  const directMapping = descriptionMappings[description];
  if (directMapping) {
    return convertToSimplifiedChinese(directMapping);
  }
  
  // Otherwise, do phrase-by-phrase replacement
  let translatedText = description;
  
  // Sort phrases by length (longest first) to avoid partial replacements
  const phrases = Object.keys(commonPhrases).sort((a, b) => b.length - a.length);
  
  for (const phrase of phrases) {
    if (translatedText.includes(phrase)) {
      translatedText = translatedText.replace(
        new RegExp(phrase, 'gi'), 
        convertToSimplifiedChinese(commonPhrases[phrase])
      );
    }
  }
  
  return convertToSimplifiedChinese(translatedText);
}
