/**
 * Location name formatting utilities
 */
import { Language } from "@/services/geocoding/types";

/**
 * Format a location name for display
 */
export function formatLocationName(name: string, language: Language): string {
  // Remove redundancy and improve formatting
  if (!name) {
    return language === 'en' ? 'Unknown Location' : '未知位置';
  }
  
  // Clean up standard formatting issues
  let formattedName = name
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/, ,/g, ',')
    .replace(/,,/g, ',')
    .replace(/\s,/g, ',');
  
  // Limit name length
  if (formattedName.length > 50) {
    const parts = formattedName.split(',');
    if (parts.length > 2) {
      formattedName = parts.slice(0, 2).join(language === 'en' ? ', ' : '，');
    } else {
      formattedName = formattedName.substring(0, 50) + '...';
    }
  }
  
  return formattedName;
}

/**
 * Get regional name based on coordinates
 */
export function getRegionalName(latitude: number, longitude: number, language: Language): string {
  // Simple region determination based on coordinates
  let region;
  
  // Check if this is a remote region
  if (Math.abs(latitude) > 60) {
    return language === 'en' ? 'Polar Region' : '极地地区';
  }
  
  // China regions
  if (latitude > 18 && latitude < 53 && longitude > 73 && longitude < 135) {
    if (latitude > 40) {
      if (longitude < 110) return language === 'en' ? 'Northwest China' : '中国西北';
      else return language === 'en' ? 'Northeast China' : '中国东北';
    } else if (latitude > 30) {
      if (longitude < 105) return language === 'en' ? 'Western China' : '中国西部';
      else if (longitude > 118) return language === 'en' ? 'East China' : '中国东部';
      else return language === 'en' ? 'Central China' : '中国中部';
    } else {
      if (longitude < 105) return language === 'en' ? 'Southwest China' : '中国西南';
      else return language === 'en' ? 'South China' : '中国南部';
    }
  }
  
  // Other world regions
  if (longitude > -20 && longitude < 60) {
    if (latitude > 35) {
      return language === 'en' ? 'Northern Europe' : '北欧';
    } else if (latitude > 0) {
      return language === 'en' ? 'Europe/Africa' : '欧洲/非洲';
    } else {
      return language === 'en' ? 'Southern Africa' : '南非';
    }
  } else if (longitude >= 60 && longitude < 150) {
    if (latitude > 0) {
      return language === 'en' ? 'Asia' : '亚洲';
    } else {
      return language === 'en' ? 'Oceania' : '大洋洲';
    }
  } else {
    if (latitude > 0) {
      return language === 'en' ? 'North America' : '北美洲';
    } else {
      return language === 'en' ? 'South America' : '南美洲';
    }
  }
  
  return language === 'en' ? 'Remote area' : '偏远地区';
}
