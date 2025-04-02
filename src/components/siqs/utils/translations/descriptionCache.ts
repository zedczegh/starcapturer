
// Cache for storing translated descriptions
const descriptionCache: Record<string, Record<string, string>> = {};

/**
 * Get a cached description translation
 * @param description The original English description
 * @param language The target language
 * @returns The cached translation or null if not found
 */
export const getCachedDescription = (description: string, language: string): string | null => {
  if (!descriptionCache[language]) return null;
  return descriptionCache[language][description] || null;
};

/**
 * Cache a translated description
 * @param description The original English description
 * @param language The target language
 * @param translation The translated text
 */
export const cacheDescription = (description: string, language: string, translation: string): void => {
  if (!descriptionCache[language]) {
    descriptionCache[language] = {};
  }
  descriptionCache[language][description] = translation;
};

/**
 * Clear the description cache
 */
export const clearDescriptionCache = (): void => {
  Object.keys(descriptionCache).forEach(key => {
    delete descriptionCache[key];
  });
};
