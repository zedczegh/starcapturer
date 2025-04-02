
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SIQSGaugeProps {
  score: number | null;
  level: string;
  color: string;
  loading?: boolean;
  hasCalculatedOnce?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIQSGauge: React.FC<SIQSGaugeProps> = ({
  score,
  level,
  color,
  loading = false,
  hasCalculatedOnce = false,
  size = 'md'
}) => {
  const { t } = useLanguage();
  
  // Determine size classes based on size prop
  const sizeClasses = {
    sm: {
      container: 'w-28 h-28',
      scoreText: 'text-3xl',
      levelText: 'text-xs',
      descriptionText: 'text-[10px]'
    },
    md: {
      container: 'w-40 h-40',
      scoreText: 'text-4xl',
      levelText: 'text-sm',
      descriptionText: 'text-xs'
    },
    lg: {
      container: 'w-48 h-48',
      scoreText: 'text-5xl',
      levelText: 'text-base',
      descriptionText: 'text-sm'
    }
  }[size];
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses.container} rounded-full border-4 flex flex-col items-center justify-center relative`}
        style={{ borderColor: color }}
      >
        {loading ? (
          <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
        ) : !hasCalculatedOnce ? (
          <div className="text-center text-muted-foreground">
            <span className="text-sm">{t("Enter a location", "输入位置")}</span>
          </div>
        ) : (
          <>
            <span className={`${sizeClasses.scoreText} font-bold`} style={{ color }}>
              {score !== null ? score.toFixed(1) : '-'}
            </span>
            <span className={`${sizeClasses.levelText} text-muted-foreground font-medium`}>
              {level}
            </span>
          </>
        )}
        
        {/* Progress ring around the gauge */}
        {score !== null && !loading && (
          <Progress
            value={(score / 10) * 100}
            className="absolute inset-0 w-full h-full rounded-full opacity-20"
            indicatorColor={color}
          />
        )}
      </div>
      
      {!loading && hasCalculatedOnce && score !== null && (
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="font-medium">
              {score.toFixed(1)}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIQSGauge;
