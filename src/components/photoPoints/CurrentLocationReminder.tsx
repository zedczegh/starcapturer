
import React from 'react';
import { Star, Info } from 'lucide-react';
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
  
  if (!isVisible || !currentSiqs || currentSiqs <= 3) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/10 flex items-center gap-3"
    >
      <div className="flex-shrink-0">
        <Star className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm">
          {t(
            "Your current location is ideal for astrophotography tonight, please find a rural spot with lower light pollution to start imaging!",
            "您当前的位置今晚非常适合天文摄影，请找一个光污染较低的乡村地点开始拍摄！"
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default CurrentLocationReminder;
