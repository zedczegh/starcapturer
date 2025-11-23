import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/validation";
import { getProgressColor } from "@/components/siqs/utils/progressColor";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Get SIQS quality class for styling
 */
export const getSiqsClass = (siqs?: number | null): string => {
  if (siqs === undefined || siqs === null || siqs <= 0) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

/**
 * Get certification type based color for markers
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!location.isDarkSkyReserve && !location.certification && !location.isUNESCO) {
    return 'rgba(74, 222, 128, 0.85)';
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  if (location.isUNESCO || certification.includes('unesco')) {
    return 'rgba(139, 92, 246, 0.85)'; // Purple
  }
  
  if (certification.includes('atlas obscura')) {
    return 'rgba(6, 182, 212, 0.85)'; // Cyan
  }
  
  if (certification.includes('community')) {
    return 'rgba(255, 215, 0, 0.85)'; // Gold
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
    return 'rgba(155, 135, 245, 0.85)'; // Purple
  } else if (certification.includes('park')) {
    return 'rgba(74, 222, 128, 0.85)'; // Green
  } else if (certification.includes('urban') || certification.includes('night sky place')) {
    return 'rgba(30, 174, 219, 0.85)'; // Blue
  } else if (certification.includes('lodging')) {
    return 'rgba(0, 0, 128, 0.85)'; // Navy
  } else {
    return 'rgba(155, 135, 245, 0.85)';
  }
};

/**
 * Get marker color based on SIQS score with fallback to certification color
 */
export const getLocationColor = (location: SharedAstroSpot, overrideSiqs?: number | null): string => {
  const siqsScore = overrideSiqs !== undefined ? overrideSiqs : getSiqsScore(location);
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  if (siqsScore && siqsScore > 0 || isMountain) {
    return getProgressColor(siqsScore || 0);
  }
  
  if (location.isDarkSkyReserve || location.certification) {
    return getCertificationColor(location);
  }
  
  return '#4ADE80';
};

/**
 * Creates an AMap marker icon based on location properties
 */
export const createAMapMarkerIcon = (
  location: SharedAstroSpot,
  isCertified: boolean,
  isHovered: boolean,
  isMobile: boolean,
  overrideSiqs?: number | null
): any => {
  const color = getLocationColor(location, overrideSiqs);
  const isUNESCO = location.isUNESCO || location.certification?.toLowerCase().includes('unesco');
  const isObscura = location.certification?.toLowerCase().includes('atlas obscura');
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  const size = isMobile ? 
    (isHovered ? 22 : 16) : 
    (isHovered ? 28 : 24);
  
  let iconSvg = '';
  if (isUNESCO) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>`;
  } else if (isMountain) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
    </svg>`;
  } else if (isObscura) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  } else if (isCertified) {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
  }
  
  const html = `
    <div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      ${iconSvg}
    </div>
  `;
  
  return {
    content: html,
    size: [size, size],
    offset: [-size/2, -size/2]
  };
};

/**
 * Check if location is valid for astronomy
 */
export const isValidAstronomyLocation = (
  latitude: number,
  longitude: number,
  name?: string
): boolean => {
  if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  if (name) {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes('sea') || 
      lowerName.includes('ocean') || 
      lowerName.includes('bay') ||
      lowerName.includes('lake') ||
      lowerName.includes('lagoon') ||
      lowerName.includes('gulf') ||
      lowerName.includes('strait')
    ) {
      return false;
    }
  }
  
  return true;
};

/**
 * Determine if a location should be shown based on active view
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean,
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains'
): boolean => {
  const isObscura = location.certification?.toLowerCase().includes('atlas obscura');
  const isMountain = location.certification?.toLowerCase().includes('natural mountain');
  
  if (activeView === 'certified') {
    return isCertified && !isObscura && !isMountain;
  } else if (activeView === 'obscura') {
    return isObscura;
  } else if (activeView === 'mountains') {
    return isMountain;
  } else if (activeView === 'calculated') {
    return !isCertified && !isObscura && !isMountain;
  }
  
  if (!isCertified && isWaterLocation(location.latitude, location.longitude, Boolean(location.isDarkSkyReserve || location.certification))) {
    return false;
  }
  
  return true;
};

/**
 * Creates popup content HTML for AMap InfoWindow
 */
export const createAMapPopupContent = (props: {
  location: SharedAstroSpot;
  siqsScore: number | null;
  siqsLoading: boolean;
  displayName: string;
  isCertified: boolean;
  onViewDetails: (location: SharedAstroSpot) => void;
  userId?: string;
  isMobile?: boolean;
}): string => {
  const {
    location,
    siqsScore,
    siqsLoading,
    displayName,
    isCertified,
    isMobile = false
  } = props;
  
  const displayScore = siqsScore ?? Number(location.siqs || 0);
  const siqsClass = getSiqsClass(displayScore);
  
  const starIcon = isCertified ? `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block; margin-right: 4px; color: #9b87f5;">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ` : '';
  
  const certificationBadge = isCertified && location.certification ? `
    <div style="margin-top: 4px; font-size: 12px; font-weight: 500; color: #9b87f5; display: flex; align-items: center;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      ${location.certification}
    </div>
  ` : '';
  
  const siqsBadgeColor = displayScore >= 7.5 ? '#10b981' : displayScore >= 5.5 ? '#f59e0b' : '#ef4444';
  const siqsBadge = `
    <div style="
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: ${siqsBadgeColor}20;
      border: 1px solid ${siqsBadgeColor};
      font-size: 12px;
      font-weight: 600;
      color: ${siqsBadgeColor};
    ">
      ${siqsLoading ? '...' : `SIQS: ${displayScore.toFixed(1)}`}
    </div>
  `;
  
  const distanceBadge = typeof location.distance === 'number' && isFinite(location.distance) ? `
    <span style="font-size: 12px; color: #d1d5db; margin-left: auto;">
      ${(location.distance).toFixed(1)} km
    </span>
  ` : '';
  
  return `
    <div style="
      padding: 12px;
      min-width: 200px;
      max-width: 280px;
      font-family: system-ui, -apple-system, sans-serif;
    " class="amap-popup-content ${siqsClass}">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #f3f4f6; display: flex; align-items: center;">
        ${starIcon}
        <span>${displayName}</span>
      </div>
      
      ${certificationBadge}
      
      <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        ${siqsBadge}
        ${distanceBadge}
      </div>
      
      <div style="margin-top: 12px; text-align: center;">
        <button 
          onclick="window.viewAMapSpotDetails('${location.id}')"
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background-color: rgba(155, 135, 245, 0.2);
            color: #9b87f5;
            padding: ${isMobile ? '12px' : '8px'} 12px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s;
          "
          onmouseover="this.style.backgroundColor='rgba(155, 135, 245, 0.3)'"
          onmouseout="this.style.backgroundColor='rgba(155, 135, 245, 0.2)'"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          View Details
        </button>
      </div>
    </div>
  `;
};
