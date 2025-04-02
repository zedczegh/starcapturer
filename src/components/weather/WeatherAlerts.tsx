
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Wind, CloudRain, Cloud, Snowflake } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface WeatherAlert {
  type: "warning" | "severe";
  message: string;
  time: string;
  icon: string;
}

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  formatTime: (time: string) => string;
  formatDate: (time: string) => string;
}

const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts, formatTime, formatDate }) => {
  const { t } = useLanguage();
  
  if (!alerts || alerts.length === 0) {
    return null;
  }
  
  return (
    <div className="px-4 pt-3 space-y-2">
      {alerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Alert 
            variant={alert.type === "severe" ? "destructive" : "default"}
            className={`border ${alert.type === "severe" ? 
              'border-red-500/50 bg-red-500/10' : 
              'border-amber-500/50 bg-amber-500/10'}`}
          >
            <div className="flex items-center">
              {getAlertIcon(alert.icon)}
              <AlertDescription className="flex items-center ml-2">
                <span>{alert.message}</span>
                <span className="ml-2 text-xs opacity-80">
                  {formatTime(alert.time)} {formatDate(alert.time)}
                </span>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      ))}
      
      {alerts.length > 0 && (
        <div className="text-xs text-muted-foreground px-1">
          {t("Weather alerts may affect astronomical observation quality and equipment safety.", 
            "天气警报可能会影响天文观测质量和设备安全。")}
        </div>
      )}
    </div>
  );
};

// Helper function to get the appropriate icon
function getAlertIcon(iconType: string) {
  switch (iconType) {
    case 'thunderstorm':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'wind':
      return <Wind className="h-4 w-4 text-blue-400" />;
    case 'rain':
      return <CloudRain className="h-4 w-4 text-blue-400" />;
    case 'snow':
      return <Snowflake className="h-4 w-4 text-blue-300" />;
    case 'fog':
      return <Cloud className="h-4 w-4 text-gray-400" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

export default React.memo(WeatherAlerts);
