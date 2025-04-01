
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Slider } from '@/components/ui/slider';
import { MapPin } from 'lucide-react';

export interface DistanceRangeSliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({
  currentValue,
  onValueChange,
  minValue = 100,
  maxValue = 10000,
  stepValue = 100
}) => {
  const { t } = useLanguage();
  
  // Format distance for display (always in km)
  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}k${t("km", "公里")}`;
    }
    return `${distance}${t("km", "公里")}`;
  };
  
  // Handle slider value change
  const handleValueChange = (values: number[]) => {
    onValueChange(values[0]);
  };
  
  return (
    <div className="glassmorphism bg-cosmic-900/30 border border-cosmic-700/30 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          {t("Search Radius", "搜索半径")}
        </div>
        <div className="flex items-center gap-1.5 text-primary font-medium">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-sm">
            {formatDistance(currentValue)}
          </span>
        </div>
      </div>
      
      <Slider
        value={[currentValue]}
        min={minValue}
        max={maxValue}
        step={stepValue}
        onValueChange={handleValueChange}
        className="mt-2"
      />
      
      <div className="flex justify-between mt-1.5">
        <div className="text-xs text-muted-foreground">
          {formatDistance(minValue)}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDistance(maxValue)}
        </div>
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
