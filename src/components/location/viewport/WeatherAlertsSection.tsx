
import React from "react";
import WeatherAlerts from "@/components/weather/WeatherAlerts";
import { formatDate, formatTime } from "@/components/forecast/ForecastUtils";

interface WeatherAlertsSectionProps {
  alerts: any[];
}

const WeatherAlertsSection: React.FC<WeatherAlertsSectionProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;
  
  return (
    <div className="mb-8">
      <WeatherAlerts 
        alerts={alerts}
        formatTime={formatTime}
        formatDate={formatDate}
      />
    </div>
  );
};

export default WeatherAlertsSection;
