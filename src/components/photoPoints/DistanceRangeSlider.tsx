
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Car, TrainFront, Plane } from "lucide-react";

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
  
  // Format distance for display with proper formatting
  const formatDistance = (dist: number) => {
    // Use the language to determine metric vs imperial
    if (language === 'en') {
      // Convert to miles for English users (1 km ≈ 0.621371 miles)
      const miles = dist * 0.621371;
      return miles >= 1000 
        ? `${(miles/1000).toLocaleString()} miles`
        : `${Math.round(miles).toLocaleString()} miles`;
    } else {
      // Use kilometers for Chinese users with proper formatting
      return dist >= 1000 
        ? `${(dist/1000).toLocaleString()} 千公里`
        : `${dist.toLocaleString()} 公里`;
    }
  };

  return (
    <div className="space-y-4 p-4 glassmorphism rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">
          {t("Search Radius", "搜索半径")}
        </h3>
        <span className="text-sm font-bold bg-background/40 px-2 py-1 rounded-full">
          {language === 'en' 
            ? `${Math.round(distance * 0.621371).toLocaleString()} miles`
            : `${distance.toLocaleString()} 公里`}
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
            className={`flex-1 ${distance === value ? "bg-primary" : ""}`}
            onClick={() => setDistance(value)}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">{label}</span>
            <span className="ml-1">
              {language === 'en'
                ? `${Math.round(value * 0.621371).toLocaleString()} mi`
                : `${value.toLocaleString()} km`}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
