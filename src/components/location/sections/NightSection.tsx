
import React from 'react';
import { CloudMoon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import TimeItem from '../timeDisplay/TimeItem';
import TimeZoneDisplay from '../timeDisplay/TimeZoneDisplay';
import { motion } from 'framer-motion';

interface NightSectionProps {
  astroNightStart: string;
  astroNightEnd: string;
  duration: string | number;
  latitude: number;
  longitude: number;
}

const NightSection = ({ 
  astroNightStart, 
  astroNightEnd, 
  duration,
  latitude,
  longitude 
}: NightSectionProps) => {
  const { t } = useLanguage();
  
  // Convert duration to string if it's a number
  const formattedDuration = typeof duration === 'number' ? duration.toString() : duration;
  
  return (
    <motion.div 
      className="space-y-1.5 border-b border-cosmic-700/40 pb-3 mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-blue-500/10">
          <CloudMoon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span className="text-xs font-semibold text-blue-100/80">{t('Night', '夜晚')}</span>
      </div>
      
      <TimeZoneDisplay latitude={latitude} longitude={longitude} />
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        <TimeItem label={t('Begins', '开始')} value={astroNightStart} highlight={true} />
        <TimeItem label={t('Ends', '结束')} value={astroNightEnd} highlight={true} />
      </div>
      
      <TimeItem 
        label={t('Duration', '持续时间')} 
        value={`${formattedDuration} ${t('hrs', '小时')}`} 
        highlight={true}
      />
    </motion.div>
  );
};

export default React.memo(NightSection);
