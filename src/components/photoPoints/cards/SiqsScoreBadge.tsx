
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { siqsToColor } from '@/lib/siqs/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatSiqsForDisplay } from '@/utils/siqsHelpers';

interface SiqsScoreBadgeProps {
  score: number | null;
  showLabel?: boolean;
  isCertified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  // New props that are being used across the application
  loading?: boolean;
  compact?: boolean;
  forceCertified?: boolean;
  confidenceScore?: number;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ 
  score, 
  showLabel = false, 
  isCertified = false,
  size = 'md',
  loading = false,
  compact = false,
  forceCertified = false,
  confidenceScore = 7
}) => {
  const { t } = useLanguage();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-base px-3 py-1.5';
      default:
        return 'text-sm px-2 py-1';
    }
  };
  
  // Show loading state if requested
  if (loading) {
    return (
      <Badge variant="outline" className={`${getSizeClasses()} bg-gray-800/80 text-gray-400 border-gray-700 flex items-center gap-1`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("Loading", "加载中")}
      </Badge>
    );
  }
  
  // Handle cases when score is null or undefined
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className={`${getSizeClasses()} bg-gray-800/80 text-gray-400 border-gray-700`}>
        {t("Pending", "待处理")}
      </Badge>
    );
  }
  
  // Handle certified locations
  if (isCertified || forceCertified) {
    return (
      <Badge variant="outline" className={`${getSizeClasses()} bg-blue-900/80 text-blue-200 border-blue-700 flex items-center gap-1`}>
        <Sparkles className="h-3 w-3" />
        {showLabel ? `${t("Certified", "已认证")}` : formatSiqsForDisplay(score)}
      </Badge>
    );
  }
  
  // Format the color based on SIQS value
  const bgColor = siqsToColor(score);
  const formattedScore = formatSiqsForDisplay(score);
  
  return (
    <Badge variant="outline" 
      className={`${getSizeClasses()} ${bgColor} transition-all duration-300 hover:scale-105`}
    >
      {showLabel ? `${t("SIQS", "SIQS")}: ${formattedScore}` : formattedScore}
    </Badge>
  );
};

export default SiqsScoreBadge;
