
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CurrentLocationReminderProps {
  currentSiqs: number | null;
  isVisible: boolean;
}

const CurrentLocationReminder: React.FC<CurrentLocationReminderProps> = ({
  currentSiqs,
  isVisible
}) => {
  const { t } = useLanguage();
  
  // Only show reminder for poor conditions
  const shouldShowReminder = 
    isVisible && currentSiqs !== null && currentSiqs < 3.0;
  
  if (!shouldShowReminder) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {shouldShowReminder && (
        <motion.div 
          className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium mb-1">
                {t("Your location has poor stargazing conditions", "您所在位置的观星条件较差")}
              </p>
              <p className="text-sm opacity-90">
                {t(
                  "These photo points have better viewing conditions than your current location.",
                  "这些摄影点比您当前位置的观测条件更好。"
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(CurrentLocationReminder);
