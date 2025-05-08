
import { Language } from '../types';

/**
 * Format address components into a localized string
 * @param components Address components
 * @param language Target language
 * @returns Formatted address string
 */
export function formatAddressComponents(
  components: Record<string, string | undefined>, 
  language: Language = 'en'
): string {
  // Filter out undefined values
  const filtered: Record<string, string> = Object.entries(components)
    .filter(([_, value]) => value !== undefined)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value as string }), {});
  
  // Build parts array based on language
  let parts: string[] = [];
  
  if (language === 'en') {
    // English format: street, town, city, county, state, country
    if (filtered.streetName) parts.push(filtered.streetName);
    if (filtered.townName) parts.push(filtered.townName);
    if (filtered.cityName) parts.push(filtered.cityName);
    if (filtered.countyName) parts.push(filtered.countyName);
    if (filtered.stateName) parts.push(filtered.stateName);
    if (filtered.countryName) parts.push(filtered.countryName);
  } else {
    // Chinese format: country, state, county, city, town, street
    const reverseParts = [];
    if (filtered.countryName) reverseParts.push(filtered.countryName);
    if (filtered.stateName) reverseParts.push(filtered.stateName);
    if (filtered.countyName) reverseParts.push(filtered.countyName);
    if (filtered.cityName) reverseParts.push(filtered.cityName);
    if (filtered.townName) reverseParts.push(filtered.townName);
    if (filtered.streetName) reverseParts.push(filtered.streetName);
    parts = reverseParts;
  }
  
  // Remove duplicates while preserving order
  const uniqueParts = Array.from(new Set(parts));
  
  // Join with appropriate separator
  return uniqueParts.join(language === 'en' ? ', ' : '，');
}
