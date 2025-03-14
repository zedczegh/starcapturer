
import { Language } from "@/contexts/LanguageContext";

// Cache for description translations
const descriptionCache: Record<string, Record<Language, string>> = {};

/**
 * Cache a description translation
 * @param description Original description text
 * @param language Target language
 * @param translation Translated text
 */
export function cacheDescription(description: string, language: Language, translation: string) {
  if (!descriptionCache[description]) {
    descriptionCache[description] = {} as Record<Language, string>;
  }
  descriptionCache[description][language] = translation;
}

/**
 * Get a cached description translation if available
 * @param description Original description text
 * @param language Target language
 * @returns Cached translation or undefined if not in cache
 */
export function getCachedDescription(description: string, language: Language): string | undefined {
  return descriptionCache[description]?.[language];
}
