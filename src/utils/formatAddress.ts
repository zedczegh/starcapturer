
import { Language } from '@/services/geocoding/types';

/**
 * Format location address based on language-specific patterns
 * @param address Address object from geocoding service
 * @param language Preferred language
 * @returns Formatted address string
 */
export function formatAddress(address: any, language: Language): string {
  if (!address) return "";
  
  const parts = [];
  
  if (language === 'en') {
    // English format: town, county, state, country, zip code
    if (address.village || address.town || address.hamlet || address.suburb) {
      parts.push(address.village || address.town || address.hamlet || address.suburb);
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.county) {
      parts.push(address.county);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.country) {
      parts.push(address.country);
    }
    if (address.postcode) {
      parts.push(address.postcode);
    }
  } else {
    // Chinese format: 区，市，省，国家，邮编
    if (address.suburb || address.village || address.hamlet) {
      parts.push(address.suburb || address.village || address.hamlet);
    }
    if (address.town) {
      parts.push(address.town);
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.county) {
      parts.push(address.county);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.country) {
      parts.push(address.country);
    }
    if (address.postcode) {
      parts.push(address.postcode);
    }
  }
  
  // Remove duplicates while preserving order
  const uniqueParts = [...new Set(parts)];
  
  return uniqueParts.join(language === 'en' ? ', ' : '，');
}
