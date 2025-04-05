
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Trees, Building2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CertificationBadgeProps {
  location: SharedAstroSpot;
  className?: string;
}

const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  location,
  className = ''
}) => {
  const { language } = useLanguage();
  
  if (!location.certification && !location.isDarkSkyReserve) {
    return null;
  }
  
  const certInfo = getCertificationInfo(location);
  
  if (!certInfo) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`${certInfo.color} px-2.5 py-1 rounded-full flex items-center ${className}`}
    >
      {React.createElement(certInfo.icon, { className: "h-3.5 w-3.5 mr-1.5" })}
      <span className="text-xs font-medium">{getLocalizedCertText(certInfo, language)}</span>
    </Badge>
  );
};

// Helper function to get certification info
function getCertificationInfo(location: SharedAstroSpot): { 
  icon: React.ElementType; 
  text: string; 
  color: string; 
} | null {
  if (!location.certification && !location.isDarkSkyReserve) {
    return null;
  }
  
  const cert = (location.certification || '').toLowerCase();
  
  if (cert.includes('sanctuary') || cert.includes('reserve') || location.isDarkSkyReserve) {
    return {
      icon: Globe,
      text: 'Dark Sky Reserve',
      color: 'text-blue-400 border-blue-400/30 bg-blue-400/10'
    };
  } else if (cert.includes('park')) {
    return {
      icon: Trees,
      text: 'Dark Sky Park',
      color: 'text-green-400 border-green-400/30 bg-green-400/10'
    };
  } else if (cert.includes('community')) {
    return {
      icon: Building2,
      text: 'Dark Sky Community',
      color: 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    };
  } else if (cert.includes('urban')) {
    return {
      icon: Building2,
      text: 'Urban Night Sky',
      color: 'text-purple-400 border-purple-400/30 bg-purple-400/10'
    };
  } else {
    return {
      icon: ShieldCheck,
      text: 'Certified Location',
      color: 'text-blue-300 border-blue-300/30 bg-blue-300/10'
    };
  }
}

// Helper function to get localized certification text
function getLocalizedCertText(certInfo: { text: string }, language: Language): string {
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

export default CertificationBadge;
