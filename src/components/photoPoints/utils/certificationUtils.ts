
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Trees, Building2, ShieldCheck } from "lucide-react";
import React from "react";

/**
 * Determine certification icon and details
 */
export const useCertificationInfo = (certification?: string, isDarkSkyReserve?: boolean) => {
  const { t } = useLanguage();
  
  if (!certification && !isDarkSkyReserve) {
    return null;
  }
  
  const certText = (certification || '').toLowerCase();
  
  if (certText.includes('sanctuary') || certText.includes('reserve')) {
    return {
      icon: <Globe className="h-3.5 w-3.5 mr-1.5" />,
      text: t('Dark Sky Reserve', '暗夜保护区'),
      color: 'text-blue-400 border-blue-400/30 bg-blue-400/10'
    };
  } else if (certText.includes('park')) {
    return {
      icon: <Trees className="h-3.5 w-3.5 mr-1.5" />,
      text: t('Dark Sky Park', '暗夜公园'),
      color: 'text-green-400 border-green-400/30 bg-green-400/10'
    };
  } else if (certText.includes('community')) {
    return {
      icon: <Building2 className="h-3.5 w-3.5 mr-1.5" />,
      text: t('Dark Sky Community', '暗夜社区'),
      color: 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    };
  } else if (certText.includes('urban')) {
    return {
      icon: <Building2 className="h-3.5 w-3.5 mr-1.5" />,
      text: t('Urban Night Sky', '城市夜空'),
      color: 'text-purple-400 border-purple-400/30 bg-purple-400/10'
    };
  } else {
    return {
      icon: <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />,
      text: t('Certified Location', '认证地点'),
      color: 'text-blue-300 border-blue-300/30 bg-blue-300/10'
    };
  }
};

/**
 * Format distance for display
 */
export const useDistanceFormatter = () => {
  const { t } = useLanguage();
  
  return (distance?: number) => {
    if (!distance) return t("Unknown distance", "未知距离");
    
    if (distance < 1) {
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    }
    
    if (distance < 10) {
      return t(`${distance.toFixed(1)} km away`, `距离 ${distance.toFixed(1)} 公里`);
    }
    
    return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
  };
};

/**
 * Format date for display
 */
export const useDateFormatter = () => {
  const { language } = useLanguage();
  
  return (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return '';
    }
  };
};
