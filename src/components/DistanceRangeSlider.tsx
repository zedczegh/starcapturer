
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";

interface DistanceRangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({ value, onChange, className }) => {
  const { t } = useLanguage();
  
  // Predefined distance steps in km
  const distanceSteps = [500, 1000, 5000];
  
  // Convert slider value (0-2) to actual distance
  const handleSliderChange = (newValue: number[]) => {
    const index = Math.round(newValue[0]);
    onChange(distanceSteps[index]);
  };
  
  // Find closest step index
  const getSliderValue = () => {
    const index = distanceSteps.findIndex(step => step === value);
    return index >= 0 ? [index] : [0];
  };
  
  return (
    <div className={className}>
      <div className="mb-2">
        <label className="text-sm font-medium">
          {t("Search Radius", "搜索半径")}: <span className="font-bold">{value} km</span>
        </label>
      </div>
      
      <Slider
        value={getSliderValue()}
        onValueChange={handleSliderChange}
        max={2}
        step={1}
        className="my-4"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>500 km</span>
        <span>1000 km</span>
        <span>5000 km</span>
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
