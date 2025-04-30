
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getSiqsColorClass, formatSiqs, getSiqsQuality } from '@/utils/forecast/forecastSiqsUtils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SiqsScoreBadgeProps {
  score: number | null;
  compact?: boolean;
  isCertified?: boolean;
  forceCertified?: boolean;
  loading?: boolean;
  confidenceScore?: number;
}

// Cache badge content for identical scores to reduce re-rendering
const contentCache = new Map<string, JSX.Element>();

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({
  score,
  compact = false,
  isCertified = false,
  forceCertified = false,
  loading = false,
  confidenceScore = 10
}) => {
  const { t, language } = useLanguage();
  
  // Create unique key for caching that includes language
  const cacheKey = `${score}-${compact}-${isCertified}-${loading}-${confidenceScore}-${language}`;
  
  // Use memoization to prevent unnecessary re-renders
  const badgeContent = useMemo(() => {
    // Check cache first
    if (contentCache.has(cacheKey)) {
      return contentCache.get(cacheKey);
    }
    
    let content: JSX.Element;
    
    if (loading) {
      content = (
        <Badge variant="outline" className="animate-pulse bg-cosmic-900/30 text-xs font-medium whitespace-nowrap">
          {t("Calculating...", "计算中...")}
        </Badge>
      );
    } else if (score === null) {
      content = (
        <Badge variant="outline" className="bg-cosmic-900/30 text-xs font-medium">
          {t("No data", "无数据")}
        </Badge>
      );
    } else {
      const formattedScore = formatSiqs(score);
      const quality = getSiqsQuality(score);
      const colorClass = getSiqsColorClass(score);
      
      const bgClass = `${colorClass} text-black`;
      
      // Adjust badge appearance based on confidence score
      const confidenceOpacity = confidenceScore >= 7 ? 1 : (confidenceScore >= 5 ? 0.85 : 0.7);
      
      content = (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className={cn(
                "text-xs font-bold", 
                bgClass,
                "transition-all duration-300",
                compact ? "py-0.5 px-1" : "py-1 px-2",
                { "opacity-90": confidenceOpacity < 1 }
              )}
              style={{ opacity: confidenceOpacity }}
            >
              {compact ? formattedScore : `SIQS: ${formattedScore} - ${t(quality, '')}`}
              {(isCertified || forceCertified) && (
                <span className="ml-1">★</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5}>
            <p>
              {t("Sky quality score: ", "天空质量评分: ")}
              <span className="font-bold">{formattedScore}</span> 
              {" - "}
              <span>{t(quality, "")}</span>
            </p>
            {(isCertified || forceCertified) && (
              <p className="text-xs mt-1 text-amber-400">
                {t("Certified location", "认证地点")}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    
    // Store in cache (limit cache size)
    if (contentCache.size > 50) {
      // Clear cache if it gets too large
      contentCache.clear();
    }
    contentCache.set(cacheKey, content);
    
    return content;
  }, [score, compact, isCertified, forceCertified, loading, confidenceScore, t, cacheKey, language]);
  
  return badgeContent;
};

export default React.memo(SiqsScoreBadge);
