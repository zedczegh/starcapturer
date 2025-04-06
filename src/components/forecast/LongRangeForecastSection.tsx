
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";

interface LongRangeForecastSectionProps {
  locationData: any;
  language: string;
}

const LongRangeForecastSection: React.FC<LongRangeForecastSectionProps> = ({
  locationData,
  language
}) => {
  const navigate = useNavigate();
  
  const handleNavigateToForecast = () => {
    if (locationData?.id) {
      navigate(`/forecast/${locationData.id}`, { state: locationData });
    }
  };
  
  return (
    <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md text-center">
      <h2 className="text-xl font-bold mb-2">
        {language === 'en' ? 'Want to see more?' : '想看更多?'}
      </h2>
      <p className="text-muted-foreground mb-4">
        {language === 'en' 
          ? 'Check the extended forecast to find the best astronomy nights'
          : '查看长期天气预报，找到最佳观星夜晚'}
      </p>
      <Button 
        onClick={handleNavigateToForecast}
        className="flex items-center gap-2"
      >
        <CalendarClock className="h-4 w-4" />
        {language === 'en' ? 'View 7-Day Forecast' : '查看七天预报'}
      </Button>
    </div>
  );
};

export default LongRangeForecastSection;
