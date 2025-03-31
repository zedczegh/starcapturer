
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { getHumidityAdvice, getMoonAvoidanceStrategy, getSeeingAdvice, getExtremeWeatherAlerts, getLightPollutionAdvice, isMoonBright } from "@/utils/conditionReminderUtils";
import { Bell, Eye, Droplets, Moon, Cloud, AlertTriangle, Sun, Info } from "lucide-react";

interface WarmRemindersProps {
  locationData: any;
  forecastData: any;
}

const WarmReminders: React.FC<WarmRemindersProps> = ({ locationData, forecastData }) => {
  const { language, t } = useLanguage();
  
  if (!locationData || !forecastData) {
    return null;
  }
  
  const {
    moonPhase,
    humidity,
    seeing,
    precipitation,
    windSpeed,
    weatherCode,
    bortleScale
  } = extractConditionData(locationData, forecastData);
  
  const moonBright = isMoonBright(moonPhase);
  const reminders = [];
  
  // Moon brightness reminder
  if (moonBright) {
    reminders.push({
      id: "moon",
      title: t("Bright Moon", "明亮的月亮"),
      message: getMoonAvoidanceStrategy(language),
      icon: <Moon className="h-5 w-5 text-blue-300" />,
      color: "bg-blue-500/10 border-blue-500/20"
    });
  }
  
  // Seeing conditions reminder
  if (seeing !== undefined && seeing < 70) {
    reminders.push({
      id: "seeing",
      title: t("Seeing Conditions", "视宁度条件"),
      message: getSeeingAdvice(seeing, language),
      icon: <Eye className="h-5 w-5 text-purple-300" />,
      color: "bg-purple-500/10 border-purple-500/20"
    });
  }
  
  // Humidity reminder
  if (humidity !== undefined && humidity > 70) {
    reminders.push({
      id: "humidity",
      title: t("High Humidity", "高湿度"),
      message: getHumidityAdvice(humidity, language),
      icon: <Droplets className="h-5 w-5 text-teal-300" />,
      color: "bg-teal-500/10 border-teal-500/20"
    });
  }
  
  // Light pollution reminder
  reminders.push({
    id: "lightPollution",
    title: t("Light Pollution", "光污染"),
    message: getLightPollutionAdvice(bortleScale, language),
    icon: <Sun className="h-5 w-5 text-amber-300" />,
    color: "bg-amber-500/10 border-amber-500/20"
  });
  
  // Extreme weather alert
  const weatherAlert = getExtremeWeatherAlerts(weatherCode, windSpeed, precipitation, language);
  if (weatherAlert) {
    reminders.push({
      id: "weatherAlert",
      title: t("Weather Alert", "天气警报"),
      message: weatherAlert.message,
      icon: <AlertTriangle className="h-5 w-5 text-red-300" />,
      color: "bg-red-500/10 border-red-500/20",
      priority: true
    });
  }
  
  // General reminder
  if (reminders.length === 0) {
    reminders.push({
      id: "general",
      title: t("Astro Reminder", "天文提醒"),
      message: t(
        "Remember to give your equipment time to acclimate to the outdoor temperature.", 
        "记得让您的设备有时间适应室外温度。"
      ),
      icon: <Info className="h-5 w-5 text-primary" />,
      color: "bg-primary/10 border-primary/20"
    });
  }
  
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">
          {t("Warm Reminders", "温馨提示")}
        </h3>
      </div>
      
      <div className="space-y-2">
        {reminders.map((reminder, index) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`${reminder.color} rounded-lg p-3 border ${
              reminder.priority ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-1">{reminder.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{reminder.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{reminder.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper function to extract condition data from location and forecast data
function extractConditionData(locationData: any, forecastData: any) {
  const weatherData = locationData.weatherData || {};
  const siqsResult = locationData.siqsResult || {};
  const nightForecast = forecastData?.nighttimeForecast || {};
  
  return {
    moonPhase: nightForecast.moonPhase || weatherData.moonPhase || 0,
    humidity: weatherData.humidity !== undefined ? weatherData.humidity : nightForecast.humidity,
    seeing: siqsResult.factors ? 
      siqsResult.factors.find((f: any) => f.name.includes("Seeing") || f.name.includes("视宁度"))?.score * 10 : 
      undefined,
    precipitation: weatherData.precipitation || 0,
    windSpeed: weatherData.windSpeed || 0,
    weatherCode: weatherData.weatherCode,
    bortleScale: locationData.bortleScale
  };
}

export default WarmReminders;
