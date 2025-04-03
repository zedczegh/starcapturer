
interface DescriptionCache {
  [key: string]: {
    [language: string]: string;
  };
}

// In-memory cache for translated descriptions
const descriptionCache: DescriptionCache = {};

/**
 * Get a cached translation if available
 */
export function getCachedDescription(
  originalDescription: string,
  language: string
): string | null {
  if (
    descriptionCache[originalDescription] &&
    descriptionCache[originalDescription][language]
  ) {
    return descriptionCache[originalDescription][language];
  }
  return null;
}

/**
 * Cache a translated description
 */
export function cacheDescription(
  originalDescription: string,
  language: string,
  translatedDescription: string
): void {
  if (!descriptionCache[originalDescription]) {
    descriptionCache[originalDescription] = {};
  }
  descriptionCache[originalDescription][language] = translatedDescription;
}
