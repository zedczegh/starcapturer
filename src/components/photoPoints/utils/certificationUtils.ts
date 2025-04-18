
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Globe, Trees, Building2, ShieldCheck } from "lucide-react";
import { Language } from "@/contexts/LanguageContext";

export type CertificationInfo = {
  icon: React.ElementType;
  text: string;
  color: string;
};

/**
 * Get certification information for a location
 * @param point AstroSpot location data
 * @returns Certification information object or null if not certified
 */
export function getCertificationInfo(point: SharedAstroSpot): CertificationInfo | null {
  if (!point.certification && !point.isDarkSkyReserve) {
    return null;
  }
  
  const certification = (point.certification || '').toLowerCase();
  
  if (certification.includes('sanctuary') || certification.includes('reserve') || point.isDarkSkyReserve) {
    return {
      icon: Globe,
      text: 'Dark Sky Reserve',
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
    };
  } else if (certification.includes('park')) {
    return {
      icon: Trees,
      text: 'Dark Sky Park',
      color: 'text-green-400 bg-green-400/10 border-green-400/30'
    };
  } else if (certification.includes('community')) {
    return {
      icon: Building2,
      text: 'Dark Sky Community',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    };
  } else if (certification.includes('urban')) {
    return {
      icon: Building2,
      text: 'Urban Night Sky',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
    };
  } else {
    return {
      icon: ShieldCheck,
      text: 'Certified Location',
      color: 'text-blue-300 bg-blue-300/10 border-blue-300/30'
    };
  }
}

/**
 * Get localized certification text
 * @param certInfo Certification info object
 * @param language Current language
 * @returns Localized certification text
 */
export function getLocalizedCertText(certInfo: CertificationInfo, language: Language): string {
  if (!certInfo) return '';
  
  const certText = certInfo.text;
  
  if (language === 'zh') {
    if (certText === 'Dark Sky Reserve') return '暗夜保护区';
    if (certText === 'Dark Sky Park') return '暗夜公园';
    if (certText === 'Dark Sky Community') return '暗夜社区';
    if (certText === 'Urban Night Sky') return '城市夜空';
    if (certText === 'Certified Location') return '认证地点';
  }
  
  return certText;
}

/**
 * Check if a location is IDA certified
 * @param location Location to check
 * @returns Boolean indicating if location is certified
 */
export function isIDACertified(location: SharedAstroSpot): boolean {
  if (location.isDarkSkyReserve) return true;
  
  if (!location.certification) return false;
  
  const cert = location.certification.toLowerCase();
  return (
    cert.includes('dark sky') || 
    cert.includes('idas') || 
    cert.includes('ida') ||
    cert.includes('international dark') ||
    cert.includes('sanctuary') ||
    cert.includes('reserve') ||
    cert.includes('park') ||
    cert.includes('community')
  );
}
