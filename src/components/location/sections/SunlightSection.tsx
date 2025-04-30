
import React from 'react';
import { Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import TimeItem from '../timeDisplay/TimeItem';
import { motion } from 'framer-motion';

interface SunlightSectionProps {
  astroNightEnd: string;
  astroNightStart: string;
}

const SunlightSection = ({ astroNightEnd, astroNightStart }: SunlightSectionProps) => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="space-y-2 border-b border-cosmic-700/40 pb-3 mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1.5 rounded-full bg-yellow-500/10">
          <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-yellow-400" />
        </div>
        <span className="text-sm sm:text-xs font-semibold text-yellow-100/80">{t('Daylight', '日照时间')}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-y-1.5">
        <TimeItem label={t('Rise', '日出')} value={astroNightEnd} />
        <TimeItem label={t('Set', '日落')} value={astroNightStart} />
      </div>
    </motion.div>
  );
};

export default React.memo(SunlightSection);
