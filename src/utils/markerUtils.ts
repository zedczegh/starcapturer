
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Get CSS class for SIQS value
 * @param siqs SIQS score
 * @returns CSS class name
 */
export const getSiqsClass = (siqs: number | { score: number; isViable: boolean } | undefined): string => {
  if (siqs === undefined || siqs === null) return '';
  
  let score: number;
  if (typeof siqs === 'number') {
    score = siqs;
  } else if (typeof siqs === 'object' && 'score' in siqs) {
    score = siqs.score;
  } else {
    return '';
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score > 10) {
    score = score / 10;
  }
  
  if (score >= 7.5) return 'siqs-excellent';
  if (score >= 5) return 'siqs-good';
  if (score > 0) return 'siqs-poor';
  return '';
};

/**
 * Get color for certification badge
 * @param certification Certification name
 * @returns Hex color code
 */
export const getCertificationColor = (certification: string | undefined): string => {
  if (!certification) return '#6366f1';
  
  // Different colors based on certification type
  if (certification.includes('International')) return '#10b981';
  if (certification.includes('National')) return '#f59e0b';
  if (certification.includes('State') || certification.includes('Provincial')) return '#8b5cf6';
  return '#6366f1'; // Default
};

/**
 * Get marker color based on location properties
 * @param location Location data
 * @returns Hex color code
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve || location.certification) {
    return '#10b981'; // Green for certified
  }
  
  const siqs = location.siqs;
  if (!siqs) return 'rgba(99, 102, 241, 0.8)'; // Default
  
  let score: number;
  if (typeof siqs === 'number') {
    score = siqs;
  } else if (typeof siqs === 'object' && 'score' in siqs) {
    score = siqs.score;
  } else {
    return 'rgba(99, 102, 241, 0.8)';
  }
  
  // If score is on a scale of 0-100, convert to 0-10
  if (score > 10) {
    score = score / 10;
  }
  
  if (score >= 7.5) return 'rgba(34, 197, 94, 0.9)'; // Green
  if (score >= 5) return 'rgba(250, 204, 21, 0.9)'; // Yellow
  return 'rgba(234, 88, 12, 0.9)'; // Orange/Red
};

/**
 * Check if a marker should be shown
 * @param location Location data
 * @param isCertified Is this a certified location
 * @param activeView Current view mode
 * @returns True if marker should be shown
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot,
  isCertified: boolean,
  activeView: 'certified' | 'calculated'
): boolean => {
  // Show certified locations only in certified view
  if (activeView === 'certified') {
    return isCertified;
  }
  
  // In calculated view, show non-certified locations
  return !isCertified;
};
