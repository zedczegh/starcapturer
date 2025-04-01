
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CloudSun, CloudRain, AlertTriangle, CheckCircle } from 'lucide-react';

export interface LocationWeatherBadgeProps {
  siqs: number | undefined | null;
  isViable: boolean;
}

const LocationWeatherBadge: React.FC<LocationWeatherBadgeProps> = ({ 
  siqs, 
  isViable 
}) => {
  const { t } = useLanguage();
  
  if (siqs === undefined || siqs === null) {
    return null;
  }
  
  // Determine badge type based on SIQS and viability
  const getBadgeType = () => {
    if (!isViable) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
        text: t("Poor Conditions", "条件不佳"),
        className: "bg-cosmic-800/60 text-orange-400 border-orange-800/50"
      };
    }
    
    if (siqs >= 7) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-400" />,
        text: t("Excellent Viewing", "极佳观测"),
        className: "bg-cosmic-800/60 text-green-400 border-green-800/50"
      };
    }
    
    if (siqs >= 5) {
      return {
        icon: <CloudSun className="h-4 w-4 text-blue-400" />,
        text: t("Good Conditions", "条件良好"),
        className: "bg-cosmic-800/60 text-blue-400 border-blue-800/50"
      };
    }
    
    return {
      icon: <CloudRain className="h-4 w-4 text-yellow-400" />,
      text: t("Fair Conditions", "一般条件"),
      className: "bg-cosmic-800/60 text-yellow-400 border-yellow-800/50"
    };
  };
  
  const badge = getBadgeType();
  
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2.5 rounded-md border ${badge.className}`}>
      {badge.icon}
      <span className="text-xs font-medium">{badge.text}</span>
    </div>
  );
};

export default LocationWeatherBadge;
