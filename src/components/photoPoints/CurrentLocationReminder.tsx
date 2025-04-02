
import React from 'react';
import { Star, Info } from 'lucide-react';
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
        className={`rounded-lg mb-4 p-3 shadow-sm backdrop-blur-sm ${
          isGoodSiqs 
            ? 'bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-500/20' 
            : 'bg-gradient-to-r from-amber-900/50 to-red-900/50 border border-amber-500/20'
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
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${
            isGoodSiqs ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {isGoodSiqs ? <Star className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">
              {isGoodSiqs 
                ? t("Good imaging conditions at your location", "您所在位置的成像条件良好")
                : t("Consider finding a better location", "考虑寻找更好的位置")
              }
            </h3>
            
            <p className="text-xs text-muted-foreground">
              {isGoodSiqs 
                ? t(
                    `Your current location has a good SIQS of ${currentSiqs.toFixed(1)}. The points below offer premium viewing conditions.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，条件良好。下方显示的点提供优质观测条件。`
                  )
                : t(
                    `Your current location has a SIQS of ${currentSiqs.toFixed(1)}, which is not ideal. The locations below offer better viewing conditions.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，不太理想。以下位置提供了更好的观测条件。`
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
