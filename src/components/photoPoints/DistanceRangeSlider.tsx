import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Slider } from '@/components/ui/slider';
import { MapPin, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

export interface DistanceRangeSliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  loading?: boolean;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({
  currentValue,
  onValueChange,
  minValue = 100,
  maxValue = 1000,
  stepValue = 100,
  loading = false
}) => {
  const { t } = useLanguage();
  
  const formatDistance = (distance: number) => {
    return `${(distance).toFixed(0)}${t("km", "公里")}`;
  };
  
  const handleValueChange = React.useCallback((values: number[]) => {
    onValueChange(values[0]);
  }, [onValueChange]);

  const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100;
  
  return (
    <motion.div 
      className="glassmorphism backdrop-blur-md bg-cosmic-900/40 border border-cosmic-700/40 p-4 rounded-lg relative overflow-hidden"
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
          <Radar className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin text-primary' : 'text-primary/80'}`} />
          {t("Adjust Search Radius to find more potential spots!", "调整搜索半径以发现更多潜在地点！")}
        </div>
        <motion.div 
          className="flex items-center gap-1.5 text-primary font-medium bg-background/20 px-2 py-0.5 rounded-md border border-primary/20"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-sm">
            {formatDistance(currentValue)}
          </span>
        </motion.div>
      </div>
      
      <div className="relative mt-2">
        <Slider
          value={[currentValue]}
          min={minValue}
          max={maxValue}
          step={stepValue}
          onValueChange={handleValueChange}
          className="mt-2 z-10 relative transition-all duration-200 ease-out"
          disabled={loading}
        />
        
        <motion.div 
          className="absolute top-2.5 left-0 h-2 bg-gradient-to-r from-primary/60 to-transparent rounded-full transition-all duration-200 ease-out"
          style={{ 
            width: `${percentage}%`,
            transition: 'width 200ms ease-out, opacity 300ms ease-in-out, box-shadow 300ms ease-in-out'
          }}
          animate={{ 
            opacity: loading ? [0.3, 1, 0.3] : [0.6, 1, 0.6],
            boxShadow: loading ? [
              '0 0 2px rgba(139, 92, 246, 0.2)',
              '0 0 12px rgba(139, 92, 246, 0.8)',
              '0 0 2px rgba(139, 92, 246, 0.2)'
            ] : [
              '0 0 2px rgba(139, 92, 246, 0.3)',
              '0 0 8px rgba(139, 92, 246, 0.6)',
              '0 0 2px rgba(139, 92, 246, 0.3)'
            ]
          }}
          transition={{ 
            duration: loading ? 1 : 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="flex justify-between mt-1.5">
        <motion.div 
          className="text-xs text-muted-foreground"
          whileHover={{ color: "rgba(139, 92, 246, 0.8)" }}
        >
          {formatDistance(minValue)}
        </motion.div>
        <motion.div 
          className="text-xs text-muted-foreground"
          whileHover={{ color: "rgba(139, 92, 246, 0.8)" }}
        >
          {formatDistance(maxValue)}
        </motion.div>
      </div>
      
      <div className="relative h-1 mt-1">
        {Array.from({ length: ((maxValue - minValue) / stepValue) + 1 }).map((_, i) => (
          <div 
            key={i} 
            className={`absolute h-1 w-0.5 transition-all duration-200 ease-out ${
              i * stepValue + minValue <= currentValue ? 'bg-primary/60' : 'bg-muted/40'
            }`}
            style={{ 
              left: `${(i * stepValue) / (maxValue - minValue) * 100}%`,
              transition: 'background-color 200ms ease-out'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(DistanceRangeSlider);
