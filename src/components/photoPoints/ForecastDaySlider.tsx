
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Slider } from '@/components/ui/slider';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ForecastDaySliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  loading?: boolean;
  loadingComplete?: boolean;
}

const ForecastDaySlider: React.FC<ForecastDaySliderProps> = ({
  currentValue,
  onValueChange,
  minValue = 0,
  maxValue = 14,
  loading = false,
  loadingComplete = false
}) => {
  const { t } = useLanguage();
  
  const formatDay = (day: number) => {
    if (day === 0) return t("Today", "今天");
    if (day === 1) return t("Tomorrow", "明天");
    return `${t("Day", "天")} ${day + 1}`;
  };
  
  const handleValueChange = React.useCallback((values: number[]) => {
    onValueChange(values[0]);
  }, [onValueChange]);

  const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100;
  
  return (
    <motion.div 
      className="glassmorphism backdrop-blur-md bg-cosmic-900/40 border border-cosmic-700/40 p-4 rounded-lg relative overflow-hidden mt-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute right-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent"></div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground flex items-center">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" />
          ) : loadingComplete ? (
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500 transition-colors duration-300" />
          ) : (
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
          )}
          {t(
            "Select forecast day to see sky quality predictions", 
            "选择预报日期以查看天空质量预测"
          )}
        </div>
        <motion.div 
          className="flex items-center gap-1.5 text-primary font-medium bg-background/20 px-2 py-0.5 rounded-md border border-primary/20"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">
            {formatDay(currentValue)}
          </span>
        </motion.div>
      </div>
      
      <div className="relative mt-2">
        <Slider
          value={[currentValue]}
          min={minValue}
          max={maxValue}
          step={1}
          onValueChange={handleValueChange}
          className="mt-2 z-10 relative transition-all duration-200 ease-out"
        />
        
        <motion.div 
          className={`absolute top-2.5 left-0 h-2 rounded-full transition-all duration-200 ease-out
            ${loading ? 'bg-gradient-to-r from-primary/60 to-transparent' : 
              loadingComplete ? 'bg-gradient-to-r from-green-500/60 to-transparent' : 
              'bg-gradient-to-r from-primary/60 to-transparent'}`}
          style={{ 
            width: `${percentage}%`,
            transition: 'width 200ms ease-out, opacity 300ms ease-in-out, box-shadow 300ms ease-in-out'
          }}
          animate={{ 
            opacity: loading ? [0.3, 1, 0.3] : loadingComplete ? [0.6, 1] : [0.6, 1, 0.6],
            boxShadow: loading ? [
              '0 0 2px rgba(139, 92, 246, 0.2)',
              '0 0 12px rgba(139, 92, 246, 0.8)',
              '0 0 2px rgba(139, 92, 246, 0.2)'
            ] : loadingComplete ? [
              '0 0 2px rgba(34, 197, 94, 0.3)',
              '0 0 8px rgba(34, 197, 94, 0.6)'
            ] : [
              '0 0 2px rgba(139, 92, 246, 0.3)',
              '0 0 8px rgba(139, 92, 246, 0.6)',
              '0 0 2px rgba(139, 92, 246, 0.3)'
            ]
          }}
          transition={{ 
            duration: loading ? 1 : loadingComplete ? 0.5 : 2, 
            repeat: loading || !loadingComplete ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="flex justify-between mt-1.5">
        <motion.div 
          className="text-xs text-muted-foreground"
          whileHover={{ color: "rgba(139, 92, 246, 0.8)" }}
        >
          {formatDay(minValue)}
        </motion.div>
        <motion.div 
          className="text-xs text-muted-foreground"
          whileHover={{ color: "rgba(139, 92, 246, 0.8)" }}
        >
          {formatDay(maxValue)}
        </motion.div>
      </div>
      
      <div className="relative h-1 mt-1">
        {Array.from({ length: ((maxValue - minValue) + 1) }).map((_, i) => (
          <div 
            key={i} 
            className={`absolute h-1 w-0.5 transition-all duration-200 ease-out ${
              i + minValue <= currentValue ? 'bg-primary/60' : 'bg-muted/40'
            }`}
            style={{ 
              left: `${i / (maxValue - minValue) * 100}%`,
              transition: 'background-color 200ms ease-out'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(ForecastDaySlider);
