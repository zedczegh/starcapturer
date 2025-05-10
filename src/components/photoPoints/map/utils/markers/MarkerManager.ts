// Import correct types and functions
import { divIcon } from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore, formatSiqsForDisplay } from '@/utils/siqsHelpers';
import { SiqsScore } from '@/utils/siqs/types';

interface MarkerOptions {
  isHovered?: boolean;
  isCertified?: boolean;
  isSelected?: boolean;
  showLabel?: boolean;
  isDestination?: boolean;
  isMobile?: boolean;
  realTimeSiqs?: SiqsScore | null;
}

/**
 * Create marker icon for a location
 */
export function createLocationMarkerIcon(
  location: SharedAstroSpot,
  options: {
    isHovered?: boolean;
    isCertified?: boolean;
    isSelected?: boolean;
    showLabel?: boolean;
    isDestination?: boolean;
    isMobile?: boolean;
    realTimeSiqs?: SiqsScore | null;
  } = {}
): any {
  const {
    isHovered = false,
    isCertified = false,
    isSelected = false,
    showLabel = false,
    isDestination = false,
    isMobile = false,
    realTimeSiqs = null
  } = options;
  
  const baseHue = isCertified ? 55 : isDestination ? 210 : 280;
  const saturation = isHovered || isSelected ? 90 : 70;
  const lightness = isHovered || isSelected ? 50 : 40;
  const hueShift = isHovered ? 20 : 0;
  
  const calculatedHue = (baseHue + hueShift) % 360;
  const hslColor = `hsl(${calculatedHue}, ${saturation}%, ${lightness}%)`;
  
  const shadowSize = isMobile ? 1 : 2;
  const iconSize = isMobile ? 20 : 24;
  const fontSize = isMobile ? '0.6rem' : '0.7rem';

  // Get the correct SIQS score
  let siqsScore = options.realTimeSiqs !== null && options.realTimeSiqs !== undefined 
    ? getSiqsScore(options.realTimeSiqs)
    : getSiqsScore(location.siqs);
  
  // Format it for display  
  const formattedSiqs = formatSiqsForDisplay(siqsScore);

  const labelClass = `marker-label ${isHovered ? 'marker-label-hovered' : ''} ${isSelected ? 'marker-label-selected' : ''}`;

  let htmlContent = `
    <div class="custom-marker ${isHovered ? 'marker-hovered' : ''} ${isSelected ? 'marker-selected' : ''}"
         style="background-color: ${hslColor}; width: ${iconSize}px; height: ${iconSize}px; font-size: ${fontSize};">
      ${isCertified ? '<div class="marker-star">★</div>' : ''}
      ${formattedSiqs !== "N/A" && formattedSiqs !== "NaN" ? `<div class="marker-siqs">${formattedSiqs}</div>` : ''}
      ${isDestination ? '<div class="marker-destination"></div>' : ''}
    </div>
  `;

  if (showLabel) {
    htmlContent += `<div class="${labelClass}">${location.name || 'Location'}</div>`;
  }

  return divIcon({
    html: htmlContent,
    className: 'custom-marker-icon',
    iconSize: [iconSize + shadowSize, iconSize + shadowSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    shadowSize: [0, 0],
    popupAnchor: [0, -(iconSize / 2)]
  });
}
