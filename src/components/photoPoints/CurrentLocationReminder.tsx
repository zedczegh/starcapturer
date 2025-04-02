
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
        className={`rounded-lg mb-4 py-2.5 px-3.5 shadow-sm ${
          isGoodSiqs 
            ? 'bg-gradient-to-r from-green-900/15 to-blue-900/15 border border-green-500/5' 
            : 'bg-gradient-to-r from-amber-900/15 to-red-900/15 border border-amber-500/5'
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
          <div className={`rounded-full p-1.5 ${
            isGoodSiqs ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            {isGoodSiqs ? <Star className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-base font-medium mb-0.5">
              {isGoodSiqs 
                ? t("Good imaging conditions at your location", "您所在位置的成像条件良好")
                : t("Consider finding a better location", "考虑寻找更好的位置")
              }
            </h3>
            
            <p className="text-xs text-muted-foreground">
              {isGoodSiqs 
                ? t(
                    `Your current location has a good SIQS of ${currentSiqs.toFixed(1)}. For the best results, check locations below with lower light pollution.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，条件良好。为了获得最佳效果，请查看下方光污染较低的位置。`
                  )
                : t(
                    `Your current location has a SIQS of ${currentSiqs.toFixed(1)}, which is not ideal for astrophotography. The locations below offer better viewing conditions.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，不太适合天文摄影。以下显示的位置提供了更好的观测条件。`
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
