
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface DistanceRangeSliderProps {
  distance: number;
  setDistance: (distance: number) => void;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({
  distance,
  setDistance,
}) => {
  const { t } = useLanguage();
  
  // Predefined distance values in km
  const distanceOptions = [500, 1000, 5000];
  
  // Find the closest preset to current value
  const getClosestPreset = (value: number) => {
    return distanceOptions.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setDistance(value[0]);
  };
  
  // Format distance for display
  const formatDistance = (dist: number) => {
    if (dist >= 1000) {
      return `${dist / 1000}k km`;
    }
    return `${dist} km`;
  };

  return (
    <div className="space-y-4 p-4 glassmorphism rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">
          {t("Search Radius", "搜索半径")}
        </h3>
        <span className="text-sm font-bold bg-background/40 px-2 py-1 rounded-full">
          {formatDistance(distance)}
        </span>
      </div>
      
      <Slider
        value={[distance]}
        min={100}
        max={5000}
        step={100}
        onValueChange={handleSliderChange}
        className="mb-6"
      />
      
      <div className="flex justify-between gap-2">
        {distanceOptions.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={distance === option ? "default" : "outline"}
            className={`flex-1 ${distance === option ? "bg-primary" : ""}`}
            onClick={() => setDistance(option)}
          >
            {formatDistance(option)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
