
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Car, TrainFront, Plane } from "lucide-react";
import { formatSliderDistance } from "@/utils/unitConversion";

interface DistanceRangeSliderProps {
  distance: number;
  setDistance: (distance: number) => void;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({
  distance,
  setDistance,
}) => {
  const { t, language } = useLanguage();
  
  // Predefined distance values with transport modes
  const distanceOptions = [
    { value: 500, icon: Car, label: t("Driving", "驾车") },
    { value: 1000, icon: TrainFront, label: t("Train", "火车") },
    { value: 5000, icon: Plane, label: t("Flying", "飞行") }
  ];
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setDistance(value[0]);
  };

  return (
    <div className="space-y-4 p-4 glassmorphism rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">
          {t("Search Radius", "搜索半径")}
        </h3>
        <span className="text-sm font-bold bg-background/40 px-2 py-1 rounded-full">
          {formatSliderDistance(distance, language)}
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
        {distanceOptions.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            size="sm"
            variant={distance === value ? "default" : "outline"}
            className={`flex-1 transition-all hover:scale-105 ${distance === value ? "bg-primary" : ""}`}
            onClick={() => setDistance(value)}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{label}</span>
            <span className="ml-1">
              {formatSliderDistance(value, language)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
