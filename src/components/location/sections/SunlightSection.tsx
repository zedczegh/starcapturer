
import React from 'react';
import { Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import TimeItem from '../timeDisplay/TimeItem';

interface SunlightSectionProps {
  astroNightEnd: string;
  astroNightStart: string;
}

const SunlightSection = ({ astroNightEnd, astroNightStart }: SunlightSectionProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
      <div className="flex items-center gap-2 mb-1">
        <Sun className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-medium">{t('Daylight', '日照时间')}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <TimeItem label={t('Rise', '日出')} value={astroNightEnd} />
        <TimeItem label={t('Set', '日落')} value={astroNightStart} />
      </div>
    </div>
  );
};

export default React.memo(SunlightSection);
