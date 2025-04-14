
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findNearestTown } from '@/utils/nearestTownCalculator';

interface DisplayNameResolverProps {
  location: SharedAstroSpot;
  language: string;
  locationCounter: number | null;
}

export function useDisplayName({ location, language, locationCounter }: DisplayNameResolverProps) {
  // Get nearest town information with enhanced details
  const nearestTownInfo = location.latitude && location.longitude ? 
    findNearestTown(location.latitude, location.longitude, language) : null;
  
  // Use detailed location name as the display name based on language
  let displayName;
  
  if (language === 'zh') {
    if (nearestTownInfo?.detailedName && nearestTownInfo.detailedName !== '偏远地区') {
      // Use detailed name from our enhanced database for Chinese
      displayName = nearestTownInfo.detailedName;
    } else if (location.chineseName) {
      // Use explicit Chinese name if available
      displayName = location.chineseName;
    } else if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
      // Fallback for potential ideal dark sites in Chinese
      displayName = `潜在理想暗夜地点 ${locationCounter}`;
    } else {
      // Last resort fallback to original name
      displayName = location.name;
    }
  } else {
    if (nearestTownInfo?.detailedName && nearestTownInfo.detailedName !== 'Remote area') {
      // Use detailed name from our enhanced database for English
      displayName = nearestTownInfo.detailedName;
    } else if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
      // Fallback for potential ideal dark sites
      displayName = `Potential ideal dark site ${locationCounter}`;
    } else {
      // Fallback to original name
      displayName = location.name;
    }
  }
  
  // Check if we need to show original name
  const showOriginalName = nearestTownInfo && 
    nearestTownInfo.townName !== (language === 'en' ? 'Remote area' : '偏远地区') && 
    ((language === 'zh' && location.chineseName && location.chineseName !== nearestTownInfo.detailedName) ||
     (language === 'en' && location.name && location.name !== nearestTownInfo.detailedName));
  
  return { displayName, showOriginalName, nearestTownInfo };
}

export default useDisplayName;
