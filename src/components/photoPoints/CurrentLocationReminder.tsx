
import React from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface CurrentLocationReminderProps {
  currentSiqs: number | null;
  isVisible: boolean;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({ 
  currentSiqs,
  isVisible
}) => {
  const { t } = useLanguage();
  
  if (!isVisible || !currentSiqs || currentSiqs < 6.0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 backdrop-blur-sm shadow-md mb-4 border border-green-500/30"
    >
      <div className="flex items-start gap-3">
        <div className="text-yellow-400 shrink-0 mt-0.5">
          <Star className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-green-200/90">
            {t(
              "Your current location has favorable viewing conditions with a SIQS score of " + 
              currentSiqs.toFixed(1) + ". For best results, find a site away from light pollution.",
              "您当前位置的观测条件良好，SIQS评分为" + 
              currentSiqs.toFixed(1) + "。为获得最佳效果，请远离光污染区域。"
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CurrentLocationReminder;
