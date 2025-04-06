
/**
 * Remote region resolver
 */
import { Language } from "./types";

/**
 * Identify if a location is in a remote region
 */
export function identifyRemoteRegion(latitude: number, longitude: number): boolean {
  // Simple implementation - consider remote if far from the equator or in certain longitude ranges
  return (
    Math.abs(latitude) > 60 || // Far north or south
    (longitude > 100 && longitude < 160) || // Remote Asia/Pacific
    (longitude < -100 && longitude > -160) // Remote Americas
  );
}

/**
 * Enhance remote location name with additional context
 */
export function enhanceRemoteLocationName(
  latitude: number, 
  longitude: number, 
  placeName: string | null, 
  language: Language
): string {
  // If we already have a place name, use it
  if (placeName) {
    return placeName;
  }
  
  // Generate a name based on region
  if (latitude > 66) {
    return language === 'en' ? 'Arctic Region' : '北极地区';
  } else if (latitude < -66) {
    return language === 'en' ? 'Antarctic Region' : '南极地区';
  } else if (latitude > 23.5 && latitude <= 66) {
    if (longitude > 0 && longitude < 180) {
      return language === 'en' ? 'Northern Eurasia' : '北欧亚大陆';
    } else {
      return language === 'en' ? 'Northern Americas' : '北美洲';
    }
  } else if (latitude < -23.5 && latitude >= -66) {
    if (longitude > 0 && longitude < 180) {
      return language === 'en' ? 'Southern Africa/Oceania' : '南非/大洋洲';
    } else {
      return language === 'en' ? 'Southern Americas' : '南美洲';
    }
  } else {
    return language === 'en' ? 'Equatorial Region' : '赤道地区';
  }
}
