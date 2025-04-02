
import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { isGoodViewingCondition } from '@/hooks/siqs/siqsCalculationUtils';

interface CurrentLocationReminderProps {
  currentSiqs: number | null;
  isVisible: boolean;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({ 
  currentSiqs, 
  isVisible 
}) => {
  const { t } = useLanguage();
  
  if (!isVisible || currentSiqs === null) {
    return null;
  }
  
  const isGoodSiqs = isGoodViewingCondition(currentSiqs);
  
  return (
    <AnimatePresence>
      <motion.div 
        className={`rounded-lg mb-3 p-2 shadow-sm ${
          isGoodSiqs 
            ? 'bg-gradient-to-r from-green-900/10 to-blue-900/10 border border-green-500/10' 
            : 'bg-gradient-to-r from-amber-900/10 to-red-900/10 border border-amber-500/10'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30 
        }}
      >
        <div className="flex items-start gap-2">
          <div className={`rounded-full p-1.5 ${
            isGoodSiqs ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {isGoodSiqs ? <Star className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xs font-medium">
              {isGoodSiqs 
                ? t("Good imaging conditions", "良好的成像条件")
                : t("Consider finding a better location", "考虑寻找更好的位置")
              }
            </h3>
            
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {isGoodSiqs 
                ? t(
                    `Current SIQS: ${currentSiqs.toFixed(1)}. Better results in darker areas.`,
                    `当前SIQS: ${currentSiqs.toFixed(1)}，在光污染较低的地区可获更佳效果。`
                  )
                : t(
                    `Current SIQS: ${currentSiqs.toFixed(1)}. Locations below offer better viewing.`,
                    `当前SIQS: ${currentSiqs.toFixed(1)}。下方位置提供更佳观测条件。`
                  )
              }
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CurrentLocationReminder;
