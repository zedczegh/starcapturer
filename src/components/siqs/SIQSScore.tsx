
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatSIQSScore, isSiqsViable } from '@/utils/nighttimeSIQS';

export interface SIQSScoreProps {
  siqsScore: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  showFeedback?: boolean;
}

const SIQSScore: React.FC<SIQSScoreProps> = ({ 
  siqsScore, 
  latitude,
  longitude,
  locationName,
  showFeedback = true 
}) => {
  const { t } = useLanguage();
  
  // Get color and feedback based on score
  const { color, textColor, feedbackMessage } = useMemo(() => {
    if (siqsScore === null || siqsScore === undefined) {
      return { 
        color: 'border-gray-400', 
        textColor: 'text-gray-400',
        feedbackMessage: t("No data available", "无可用数据")
      };
    }
    
    if (siqsScore >= 8) {
      return { 
        color: 'border-green-500', 
        textColor: 'text-green-500',
        feedbackMessage: t("Excellent viewing conditions", "极佳的观测条件")
      };
    }
    
    if (siqsScore >= 6.5) {
      return { 
        color: 'border-green-400', 
        textColor: 'text-green-400',
        feedbackMessage: t("Very good viewing conditions", "非常好的观测条件")
      };
    }
    
    if (siqsScore >= 5) {
      return { 
        color: 'border-yellow-400', 
        textColor: 'text-yellow-400',
        feedbackMessage: t("Good viewing conditions", "良好的观测条件")
      };
    }
    
    if (siqsScore >= 3.5) {
      return { 
        color: 'border-orange-400', 
        textColor: 'text-orange-400',
        feedbackMessage: t("Fair viewing conditions", "一般的观测条件")
      };
    }
    
    return { 
      color: 'border-red-500', 
      textColor: 'text-red-500',
      feedbackMessage: t("Poor viewing conditions", "较差的观测条件")
    };
  }, [siqsScore, t]);
  
  // Create location subtitle if coordinates are available
  const locationSubtitle = useMemo(() => {
    if (!latitude || !longitude) return '';
    
    return t(
      `${locationName || ''} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      `${locationName || ''} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
    );
  }, [latitude, longitude, locationName, t]);
  
  // Ensure we have a valid score to show
  const scoreToDisplay = useMemo(() => {
    return typeof siqsScore === 'number' ? formatSIQSScore(siqsScore) : '0.0';
  }, [siqsScore]);
  
  return (
    <div className="flex flex-col items-center my-4">
      <div className={`text-center p-4 ${color} border-2 rounded-full w-24 h-24 flex items-center justify-center shadow-lg bg-background/30 mb-2`}>
        <motion.span 
          className={`text-3xl font-bold ${textColor}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {scoreToDisplay}
        </motion.span>
      </div>
      
      <motion.div 
        className="text-center mt-1"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className={`text-lg font-medium ${textColor}`}>
          {t("SIQS Score", "天文观测指数")}
        </h2>
        
        {locationSubtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {locationSubtitle}
          </p>
        )}
      </motion.div>
      
      {showFeedback && (
        <motion.p 
          className={`mt-2 text-sm ${textColor}`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {feedbackMessage}
        </motion.p>
      )}
    </div>
  );
};

export default SIQSScore;
