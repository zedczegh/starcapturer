
import React from 'react';
import { CloudMoon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import TimeItem from '../timeDisplay/TimeItem';

interface NightSectionProps {
  astroNightStart: string;
  astroNightEnd: string;
  duration: string;
}

const NightSection = ({ astroNightStart, astroNightEnd, duration }: NightSectionProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
      <div className="flex items-center gap-2 mb-1">
        <CloudMoon className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium">{t('Night', '夜晚')}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <TimeItem label={t('Begins', '开始')} value={astroNightStart} />
        <TimeItem label={t('Ends', '结束')} value={astroNightEnd} />
      </div>
      
      <TimeItem 
        label={t('Duration', '持续时间')} 
        value={`${duration} ${t('hrs', '小时')}`} 
      />
    </div>
  );
};

export default React.memo(NightSection);
