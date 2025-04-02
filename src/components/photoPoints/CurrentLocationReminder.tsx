
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
        className={`rounded-xl mb-6 p-5 shadow-xl ${
          isGoodSiqs 
            ? 'bg-gradient-to-r from-green-900/40 via-teal-900/30 to-blue-900/40 border border-green-500/30 backdrop-blur-sm' 
            : 'bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-red-900/40 border border-amber-500/30 backdrop-blur-sm'
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
          <div className={`rounded-full p-3 ${
            isGoodSiqs ? 'bg-green-500/30 text-green-300 ring-2 ring-green-500/20' : 'bg-amber-500/30 text-amber-300 ring-2 ring-amber-500/20'
          }`}>
            {isGoodSiqs ? <Star className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-medium mb-2 tracking-tight">
              {isGoodSiqs 
                ? t("Good imaging conditions at your location", "您所在位置的成像条件良好")
                : t("Consider finding a better location", "考虑寻找更好的位置")
              }
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`text-xs font-medium group ${
                      isGoodSiqs ? 'text-green-300 hover:text-green-200 hover:bg-green-950/30' : 
                                   'text-amber-300 hover:text-amber-200 hover:bg-amber-950/30'
                    }`}
                  >
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
