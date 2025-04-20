
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { CertificationType } from "@/components/photoPoints/filters/CertificationFilter";

/**
 * Utility to check if a location matches a certification type
 * @param location The location to check
 * @param certType The certification type to match against
 * @returns Boolean indicating if location matches certification type
 */
export function matchesCertificationType(
  location: SharedAstroSpot,
  certType: CertificationType
): boolean {
  // If not certified at all, only match 'all' type
  if (!location.certification && !location.isDarkSkyReserve) {
    return certType === 'all';
  }
  
  // For 'all' type, all certified locations match
  if (certType === 'all') {
    return true;
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // Match based on certification type
  switch (certType) {
    case 'reserve':
      return certification.includes('reserve') || 
             certification.includes('sanctuary') ||
             Boolean(location.isDarkSkyReserve);
    case 'park':
      return certification.includes('park');
    case 'community':
      return certification.includes('community');
    case 'urban':
      return certification.includes('urban') || 
             certification.includes('night sky place');
    case 'lodging':
      return certification.includes('lodging');
    default:
      return false;
  }
}

/**
 * Sort certified locations by type and name
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortCertifiedLocations(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First prioritize by certification type
    const getTypeOrder = (loc: SharedAstroSpot) => {
      const cert = (loc.certification || '').toLowerCase();
      if (loc.isDarkSkyReserve || cert.includes('reserve')) return 1;
      if (cert.includes('park')) return 2;
      if (cert.includes('community')) return 3;
      if (cert.includes('urban')) return 4;
      if (cert.includes('lodging')) return 5;
      return 6;
    };
    
    const typeOrderA = getTypeOrder(a);
    const typeOrderB = getTypeOrder(b);
    
    if (typeOrderA !== typeOrderB) {
      return typeOrderA - typeOrderB;
    }
    
    // Then sort by name
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Get counts of different certification types in a locations array
 * @param locations Array of locations to analyze
 * @returns Object with counts by certification type
 */
export function getCertificationCounts(
  locations: SharedAstroSpot[]
): Record<CertificationType | 'total', number> {
  const counts: Record<CertificationType | 'total', number> = {
    all: 0,
    reserve: 0,
    park: 0,
    community: 0,
    urban: 0,
    lodging: 0,
    total: 0
  };
  
  locations.forEach(loc => {
    // Skip non-certified locations
    if (!loc.certification && !loc.isDarkSkyReserve) {
      return;
    }
    
    counts.total++;
    counts.all++;
    
    const cert = (loc.certification || '').toLowerCase();
    if (loc.isDarkSkyReserve || cert.includes('reserve') || cert.includes('sanctuary')) {
      counts.reserve++;
    } else if (cert.includes('park')) {
      counts.park++;
    } else if (cert.includes('community')) {
      counts.community++;
    } else if (cert.includes('urban') || cert.includes('night sky place')) {
      counts.urban++;
    } else if (cert.includes('lodging')) {
      counts.lodging++;
    }
  });
  
  return counts;
}
