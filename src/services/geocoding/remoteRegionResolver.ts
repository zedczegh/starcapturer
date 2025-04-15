
/**
 * Utilities for resolving remote locations more efficiently
 * This helps improve the geocoding algorithm for faster loading
 */

import { Language } from './types';

// Define known remote regions that need special handling
const remoteRegions = [
  // Tibet region
  { name: 'Tibet', bounds: { minLat: 27, maxLat: 37, minLng: 78, maxLng: 99 } },
  
  // Xinjiang region
  { name: 'Xinjiang', bounds: { minLat: 35, maxLat: 49, minLng: 73, maxLng: 96 } },
  
  // Inner Mongolia
  { name: 'Inner Mongolia', bounds: { minLat: 37, maxLat: 53, minLng: 97, maxLng: 126 } },
  
  // Himalayan region
  { name: 'Himalayas', bounds: { minLat: 26, maxLat: 36, minLng: 74, maxLng: 95 } },
  
  // Siberian Region
  { name: 'Siberia', bounds: { minLat: 50, maxLat: 75, minLng: 60, maxLng: 180 } },
  
  // Sahara Desert
  { name: 'Sahara', bounds: { minLat: 16, maxLat: 35, minLng: -17, maxLng: 51 } },
  
  // Amazon Rainforest
  { name: 'Amazon', bounds: { minLat: -15, maxLat: 5, minLng: -75, maxLng: -45 } },
  
  // Australian Outback
  { name: 'Australian Outback', bounds: { minLat: -32, maxLat: -10, minLng: 115, maxLng: 142 } }
];

// Region name translations
const regionTranslations: Record<string, { en: string, zh: string }> = {
  'Tibet': { en: 'Tibet Region', zh: '西藏地区' },
  'Xinjiang': { en: 'Xinjiang Region', zh: '新疆地区' },
  'Inner Mongolia': { en: 'Inner Mongolia', zh: '内蒙古' },
  'Himalayas': { en: 'Himalayan Region', zh: '喜马拉雅地区' },
  'Siberia': { en: 'Siberian Region', zh: '西伯利亚地区' },
  'Sahara': { en: 'Sahara Desert', zh: '撒哈拉沙漠' },
  'Amazon': { en: 'Amazon Rainforest', zh: '亚马逊雨林' },
  'Australian Outback': { en: 'Australian Outback', zh: '澳大利亚内陆' }
};

/**
 * Check if a location falls within a known remote region
 */
export function identifyRemoteRegion(latitude: number, longitude: number): string | null {
  for (const region of remoteRegions) {
    const { bounds } = region;
    if (
      latitude >= bounds.minLat && 
      latitude <= bounds.maxLat && 
      longitude >= bounds.minLng && 
      longitude <= bounds.maxLng
    ) {
      return region.name;
    }
  }
  return null;
}

/**
 * Enhance a location name with regional context for remote areas
 * This helps provide better context for locations with minimal data
 */
export function enhanceRemoteLocationName(
  latitude: number, 
  longitude: number, 
  currentName: string,
  language: Language
): string {
  const regionName = identifyRemoteRegion(latitude, longitude);
  
  if (!regionName) return currentName;
  
  const translation = regionTranslations[regionName];
  if (!translation) return currentName;
  
  const regionText = language === 'en' ? translation.en : translation.zh;
  
  // Don't add region if it's already in the name
  if (currentName.includes(regionText)) return currentName;
  
  return language === 'en' 
    ? `${currentName}, ${regionText}` 
    : `${currentName}，${regionText}`;
}

/**
 * Get a generic name for a remote location when geocoding fails
 * Provides a better fallback than just coordinates
 */
export function getRemoteRegionName(
  latitude: number, 
  longitude: number, 
  language: Language
): string {
  const regionName = identifyRemoteRegion(latitude, longitude);
  
  if (regionName && regionTranslations[regionName]) {
    const translation = regionTranslations[regionName];
    return language === 'en' ? translation.en : translation.zh;
  }
  
  // Generic fallback by geographic region
  if (latitude > 66) {
    return language === 'en' ? 'Arctic Region' : '北极地区';
  } else if (latitude < -66) {
    return language === 'en' ? 'Antarctic Region' : '南极地区';
  } else if (latitude > 23 && latitude < 66) {
    return longitude > 0 
      ? (language === 'en' ? 'Northern Hemisphere (Eastern)' : '北半球（东部）')
      : (language === 'en' ? 'Northern Hemisphere (Western)' : '北半球（西部）');
  } else if (latitude < -23 && latitude > -66) {
    return longitude > 0 
      ? (language === 'en' ? 'Southern Hemisphere (Eastern)' : '南半球（东部）')
      : (language === 'en' ? 'Southern Hemisphere (Western)' : '南半球（西部）');
  } else {
    return longitude > 0 
      ? (language === 'en' ? 'Equatorial Region (Eastern)' : '赤道地区（东部）')
      : (language === 'en' ? 'Equatorial Region (Western)' : '赤道地区（西部）');
  }
}
