
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Trees, Building2, ShieldCheck, Hotel } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/contexts/LanguageContext';

// Certification type definition
interface CertificationInfo {
  icon: React.ElementType;
  text: string;
  color: string;
}

interface CertificationBadgeProps {
  certification?: string;
  isDarkSkyReserve?: boolean;
  type?: string;
}

const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  certification,
  isDarkSkyReserve,
  type
}) => {
  const { language } = useLanguage();
  
  // If there's no certification, don't render anything
  if (!certification && !isDarkSkyReserve && !type) {
    return null;
  }
  
  const certInfo = getCertificationInfo({ certification, isDarkSkyReserve, type });
  
  if (!certInfo) return null;
  
  return (
    <div className="mb-3 mt-1.5">
      <Badge variant="outline" className={`${certInfo.color} px-2.5 py-1.5 rounded-full flex items-center`}>
        {React.createElement(certInfo.icon, { className: "h-3.5 w-3.5 mr-1.5" })}
        <span className="text-sm">{getLocalizedCertText(certInfo, language)}</span>
      </Badge>
    </div>
  );
};

// Helper function to get certification info
export function getCertificationInfo({ certification, isDarkSkyReserve, type }: { 
  certification?: string; 
  isDarkSkyReserve?: boolean;
  type?: string;
}): CertificationInfo | null {
  if (!certification && !isDarkSkyReserve && !type) {
    return null;
  }
  
  const cert = (certification || '').toLowerCase();
  
  if (cert.includes('lodging') || type === 'lodging') {
    return {
      icon: Hotel,
      text: 'Dark Sky Lodging',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  } else if (cert.includes('sanctuary') || cert.includes('reserve') || isDarkSkyReserve) {
    return {
      icon: Globe,
      text: 'Dark Sky Reserve',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  } else if (cert.includes('park')) {
    return {
      icon: Trees,
      text: 'Dark Sky Park',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  } else if (cert.includes('community')) {
    return {
      icon: Building2,
      text: 'Dark Sky Community',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  } else if (cert.includes('urban')) {
    return {
      icon: Building2,
      text: 'Urban Night Sky',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  } else {
    return {
      icon: ShieldCheck,
      text: 'Certified Location',
      color: 'text-primary border-primary/30 bg-primary/10'
    };
  }
}

// Helper function to get localized certification text
export function getLocalizedCertText(certInfo: CertificationInfo, language: Language): string {
  if (!certInfo) return '';
  
  const certText = certInfo.text;
  
  if (language === 'zh') {
    if (certText === 'Dark Sky Reserve') return '暗夜保护区';
    if (certText === 'Dark Sky Park') return '暗夜公园';
    if (certText === 'Dark Sky Community') return '暗夜社区';
    if (certText === 'Urban Night Sky') return '城市夜空';
    if (certText === 'Certified Location') return '认证地点';
    if (certText === 'Dark Sky Lodging') return '暗夜住宿';
  }
  
  return certText;
}

export default CertificationBadge;
