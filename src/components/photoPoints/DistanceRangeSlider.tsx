
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

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
        <h3 className="text-sm md:text-base font-medium flex items-center">
          <span className="mr-2">{t("Search Radius", "搜索半径")}</span>
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ 
              scale: [0.95, 1.05, 0.95],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-4 h-4 inline-block"
          >
            <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping"></span>
            <span className="absolute inset-0 rounded-full bg-primary/20"></span>
          </motion.div>
        </h3>
        <motion.div 
          initial={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          className="font-bold bg-primary/30 px-3 py-1.5 rounded-full text-white shadow-glow"
        >
          {formatDistance(distance)}
        </motion.div>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Slider
          value={[distance]}
          min={100}
          max={5000}
          step={100}
          onValueChange={handleSliderChange}
          className="mb-6"
        />
      </motion.div>
      
      <div className="flex justify-between gap-2">
        {distanceOptions.map((option) => (
          <motion.div
            key={option}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1"
          >
            <Button
              size="sm"
              variant={distance === option ? "default" : "outline"}
              className={`w-full transition-all duration-300 ${
                distance === option 
                  ? "bg-primary shadow-glow" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => setDistance(option)}
            >
              {formatDistance(option)}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DistanceRangeSlider;
