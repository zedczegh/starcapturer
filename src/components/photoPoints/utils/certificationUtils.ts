
import { Award, Shield, Star } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CertificationInfo {
  name: string;
  chineseName: string;
  color: string;
  icon: typeof Award | typeof Shield | typeof Star;
}

/**
 * Get certification information for a location
 * @param location The astronomy spot to check
 * @returns Certification info object or null if not certified
 */
export function getCertificationInfo(location: SharedAstroSpot): CertificationInfo | null {
  if (location.isDarkSkyReserve) {
    return {
      name: 'Dark Sky Reserve',
      chineseName: '暗夜保护区',
      color: 'text-blue-500 border-blue-500/30',
      icon: Shield
    };
  }
  
  if (location.certification) {
    if (location.certification.includes('International Dark Sky') || 
        location.certification.includes('IDA')) {
      return {
        name: 'IDA Certified',
        chineseName: 'IDA认证',
        color: 'text-blue-500 border-blue-500/30',
        icon: Shield
      };
    }
    
    return {
      name: 'Certified Location',
      chineseName: '认证位置',
      color: 'text-green-500 border-green-500/30',
      icon: Award
    };
  }
  
  return null;
}

/**
 * Get the localized certification text
 * @param certInfo Certification info object
 * @param language Current language (en or zh)
 * @returns Localized certification text
 */
export function getLocalizedCertText(certInfo: CertificationInfo | null, language: string): string {
  if (!certInfo) return '';
  return language === 'en' ? certInfo.name : certInfo.chineseName;
}
