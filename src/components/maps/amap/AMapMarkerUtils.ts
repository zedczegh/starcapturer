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
 * Creates popup content HTML for AMap InfoWindow with all Leaflet features
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
  userAvatarUrl?: string;
  distance?: number;
  locationType?: string;
}): string => {
  const { 
    location, 
    siqsScore, 
    displayName, 
    isCertified, 
    isMobile = false,
    userAvatarUrl,
    distance,
    locationType
  } = props;
  
  // Get display score
  const displayScore = siqsScore || getSiqsScore(location) || 0;
  const scoreText = displayScore > 0 ? displayScore.toFixed(1) : 'N/A';
  
  // Get score color
  let scoreColor = '#94a3b8';
  if (displayScore >= 8) scoreColor = '#10b981';
  else if (displayScore >= 6) scoreColor = '#fbbf24';
  else if (displayScore >= 4) scoreColor = '#f59e0b';
  else if (displayScore >= 2) scoreColor = '#f97316';
  else if (displayScore > 0) scoreColor = '#ef4444';
  
  // Border color based on SIQS
  const borderColor = displayScore > 0 ? scoreColor : 'rgba(148, 163, 184, 0.5)';
  
  // Certification badge
  let certBadge = '';
  if (isCertified && location.certification) {
    const starIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;
    
    certBadge = `<div style="font-size: 12px; color: #fbbf24; margin-bottom: 6px; display: flex; align-items: center; font-weight: 500;">
      ${starIcon}${location.certification}
    </div>`;
  }
  
  // Location type badge (for Atlas Obscura, mountains, etc.)
  let locationTypeBadge = '';
  if (locationType) {
    const typeIcon = locationType === 'Atlas Obscura' 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="display: inline-block; margin-right: 3px;">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" style="display: inline-block; margin-right: 3px;">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>`;
    
    locationTypeBadge = `<div style="font-size: 11px; color: ${locationType === 'Atlas Obscura' ? '#d97706' : '#8b5cf6'}; margin-bottom: 4px; display: flex; align-items: center;">
      ${typeIcon}${locationType}
    </div>`;
  }
  
  // User avatar
  let avatarHtml = '';
  if (userAvatarUrl) {
    avatarHtml = `<img 
      src="${userAvatarUrl}" 
      style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1.5px solid rgba(100, 116, 139, 0.5);
        margin-left: 8px;
        object-fit: cover;
      " 
      onerror="this.style.display='none'"
    />`;
  }
  
  // Distance display
  let distanceHtml = '';
  if (distance !== undefined && isFinite(distance)) {
    const distanceText = distance < 1 
      ? `${Math.round(distance * 1000)}m` 
      : `${distance.toFixed(1)}km`;
    distanceHtml = `<span style="font-size: 11px; color: #cbd5e1; margin-left: auto;">
      ${distanceText}
    </span>`;
  }
  
  // Coordinates display
  const coordsHtml = `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
    ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
  </div>`;
  
  return `
    <div class="amap-popup-wrapper" style="
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
      border-left: 4px solid ${borderColor};
      border-radius: 8px;
      padding: 12px;
      min-width: ${isMobile ? '200px' : '220px'};
      max-width: 280px;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    ">
      ${certBadge}
      ${locationTypeBadge}
      
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #f1f5f9;">
        ${displayName}
      </div>
      
      ${coordsHtml}
      
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center;">
          ${isCertified ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none" style="margin-right: 4px;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>` : ''}
          <div style="
            color: ${scoreColor};
            font-weight: 600;
            font-size: 16px;
          ">
            ${scoreText}
          </div>
          ${avatarHtml}
        </div>
        ${distanceHtml}
      </div>
      
      <button 
        onclick="viewAMapSpotDetails('${location.id}')" 
        style="
          width: 100%;
          padding: ${isMobile ? '12px' : '8px'} 12px;
          background: rgba(59, 130, 246, 0.2);
          color: #dbeafe;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        "
        onmouseover="this.style.background='rgba(59, 130, 246, 0.3)'"
        onmouseout="this.style.background='rgba(59, 130, 246, 0.2)'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        View ${isMobile ? 'Profile' : 'Details'}
      </button>
    </div>
  `;
};
