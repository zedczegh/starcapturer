
import React from 'react';
import { MapPin, Star, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
        className={`rounded-lg mb-6 p-4 shadow-lg ${
          isGoodSiqs 
            ? 'bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/20' 
            : 'bg-gradient-to-r from-amber-900/40 to-red-900/40 border border-amber-500/20'
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
            isGoodSiqs ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isGoodSiqs ? <Star className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-1">
              {isGoodSiqs 
                ? t("Good imaging conditions at your location", "您所在位置的成像条件良好")
                : t("Consider finding a better location", "考虑寻找更好的位置")
              }
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isGoodSiqs 
                ? t(
                    `Your current location has a good SIQS of ${currentSiqs.toFixed(1)}. However, for the best astrophotography results, consider a rural location with lower light pollution.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，条件良好。但是，为了获得最佳天文摄影效果，请考虑前往光污染较低的乡村地区。`
                  )
                : t(
                    `Your current location has a SIQS of ${currentSiqs.toFixed(1)}, which is not ideal for astrophotography. The locations shown below offer better viewing conditions.`,
                    `您当前位置的SIQS为 ${currentSiqs.toFixed(1)}，不太适合天文摄影。以下显示的位置提供了更好的观测条件。`
                  )
              }
            </p>
            
            <div className="flex justify-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/">
                  <Button variant="ghost" size="sm" className="text-xs group">
                    {t("Return to calculator", "返回计算器")}
                    <ArrowUpRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CurrentLocationReminder;
