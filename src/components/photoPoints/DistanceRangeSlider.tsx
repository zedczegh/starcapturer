
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Loader2 } from 'lucide-react';

interface DistanceRangeSliderProps {
  distance: number;
  setDistance: (distance: number) => void;
  loading?: boolean;
  maxDistance?: number;
  onAfterChange?: () => void;
}

const DistanceRangeSlider: React.FC<DistanceRangeSliderProps> = ({ 
  distance, 
  setDistance,
  loading = false,
  maxDistance = 10000, // Default to 10,000 km
  onAfterChange
}) => {
  const { t } = useLanguage();
  
  const handleChange = (values: number[]) => {
    if (values.length > 0) {
      setDistance(values[0]);
    }
  };

  const handleAfterChange = () => {
    if (onAfterChange) {
      onAfterChange();
    }
  };
  
  const formatDistance = (dist: number) => {
    if (dist >= 1000) {
      return `${(dist / 1000).toFixed(1)}k`;
    }
    return dist.toString();
  };
  
  // Create logarithmic-like steps for better UX with large range
  // Added more steps for finer control
  const distanceSteps = [
    100, 300, 500, 1000, 2000, 3000, 5000, 7500, 10000
  ];
  
  // Find the closest step for the slider value display
  const findClosestStep = (value: number) => {
    return distanceSteps.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  };
  
  // Format displayed distance for better readability
  const formatDisplayDistance = (dist: number) => {
    if (dist >= 1000) {
      return `${(dist / 1000).toFixed(1)}k km`;
    }
    return `${dist} km`;
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1.5" />
          {t("Search Radius", "搜索半径")}:
          <span className="ml-1.5 text-primary font-medium">
            {formatDisplayDistance(distance)}
          </span>
        </div>
        
        {loading && (
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("Updating...", "更新中...")}
          </div>
        )}
      </div>
      
      <Slider
        value={[distance]}
        min={100}
        max={maxDistance}
        step={100}
        onValueChange={handleChange}
        onValueCommit={handleAfterChange}
        disabled={loading}
        className="cursor-pointer"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>100 km</span>
        <span>{formatDistance(findClosestStep(maxDistance / 4))} km</span>
        <span>{formatDistance(findClosestStep(maxDistance / 2))} km</span>
        <span>{formatDistance(findClosestStep(maxDistance * 3/4))} km</span>
        <span>{formatDistance(maxDistance)} km</span>
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
