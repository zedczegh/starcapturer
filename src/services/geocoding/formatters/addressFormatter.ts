
/**
 * Format address components based on language preferences
 * @param components Address components dictionary
 * @param language User's preferred language
 * @returns Formatted address string
 */
export function formatAddressComponents(
  components: Record<string, string>,
  language: 'en' | 'zh'
): string {
  const parts: string[] = [];
  
  if (language === 'en') {
    // English format: street, town/village, city, county, state, country
    if (components.street) parts.push(components.street);
    if (components.town || components.village) parts.push(components.town || components.village);
    if (components.city) parts.push(components.city);
    if (components.county) parts.push(components.county);
    if (components.state) parts.push(components.state);
    if (components.country) parts.push(components.country);
  } else {
    // Chinese format: country, state, county, city, town, street
    const order = ['country', 'state', 'county', 'city', 'town', 'village', 'street'];
    for (const key of order) {
      if (components[key]) parts.push(components[key]);
    }
  }
  
  // Remove duplicates while preserving order - using Set for performance
  const seenValues = new Set<string>();
  const uniqueParts = parts.filter(part => {
    if (seenValues.has(part)) return false;
    seenValues.add(part);
    return true;
  });
  
  // Join with appropriate separator
  return uniqueParts.join(language === 'en' ? ', ' : '');
}
