
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useLanguage } from '@/contexts/LanguageContext';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { formatSiqsScore } from '@/utils/siqsHelpers';
import { getSafeScore } from '@/utils/geoUtils';

interface LocationQualityProps {
  siqs: number | { score: number; isViable: boolean } | undefined;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

const LocationQuality: React.FC<LocationQualityProps> = ({ siqs, className = '', compact = false, showLabel = true }) => {
  const { t } = useLanguage();
  
  // Handle no siqs data
  if (siqs === undefined) {
    return null;
  }
  
  const siqsScore = getSafeScore(siqs);
  
  if (siqsScore === 0) return null;
  
  const progressColor = getProgressColor(siqsScore);
  const formattedSiqs = formatSiqsScore(siqs);
  
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'} ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {t("SIQS™ Score", "SIQS™ 评分")}
          </span>
          <span className="font-medium">{formattedSiqs}/10</span>
        </div>
      )}
      <Progress 
        value={siqsScore * 10} 
        className={`h-1.5 ${compact ? 'w-16' : 'w-full'}`}
        style={{ 
          background: "rgb(39, 39, 47)",
          "--progress-color": progressColor
        } as React.CSSProperties}
        colorClass={`bg-[var(--progress-color)]`} // Using colorClass instead of indicatorClassName
      />
    </div>
  );
};

export default LocationQuality;
