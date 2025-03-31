
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useLanguage } from '@/contexts/LanguageContext';

interface DistanceRangeSliderProps {
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
  
  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} × 1000 km`;
    }
    return `${distance} km`;
  };

  // Handle slider change
  const handleValueChange = (values: number[]) => {
    onValueChange(values[0]);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          {t("Search Radius", "搜索半径")}
        </h3>
        <span className="text-sm font-medium bg-cosmic-800/60 px-2 py-0.5 rounded-md border border-cosmic-700/30">
          {formatDistance(currentValue)}
        </span>
      </div>
      
      <Slider
        defaultValue={[currentValue]}
        max={maxValue}
        min={minValue}
        step={stepValue}
        onValueChange={handleValueChange}
        className="cursor-pointer"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minValue} km</span>
        <span>{maxValue} km</span>
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
