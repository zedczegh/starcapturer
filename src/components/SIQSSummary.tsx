
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Cloud, Sun, Moon, Wind, Droplets, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t } = useLanguage();
  
  if (!siqsResult) {
    return (
      <Card className="glassmorphism-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t("No SIQS Data Available", "无SIQS数据")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {t("Please wait while we calculate SIQS score for this location.", "请等待我们计算此位置的SIQS评分。")}
        </CardContent>
      </Card>
    );
  }
  
  // Format the SIQS score for display
  const siqsScore = typeof siqsResult.score === 'number' ? 
    Math.round(siqsResult.score * 10) / 10 : 0;
    
  // Get color class based on score
  const scoreColorClass = getProgressColorClass(siqsScore);
  
  // Determine quality level text
  const getQualityText = (score: number) => {
    if (score >= 8) return t("Excellent", "优秀");
    if (score >= 6) return t("Good", "良好");
    if (score >= 4) return t("Average", "一般");
    if (score >= 2) return t("Poor", "较差");
    return t("Bad", "很差");
  };
  
  const qualityText = getQualityText(siqsScore);
  
  return (
    <Card className="glassmorphism-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t("SIQS Summary", "SIQS 摘要")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SIQS Score with Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t("Overall Score", "总分")}</h3>
            <span className={`text-xl font-bold px-2 py-1 rounded ${scoreColorClass.replace('bg-', 'text-')}`}>
              {siqsScore.toFixed(1)}
            </span>
          </div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <Progress 
              value={siqsScore * 10} 
              className="h-3"
              colorClass={scoreColorClass}
            />
          </motion.div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("Poor", "较差")}</span>
            <span className={`font-medium ${scoreColorClass.replace('bg-', 'text-')}`}>
              {qualityText}
            </span>
            <span className="text-muted-foreground">{t("Excellent", "优秀")}</span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {getSIQSDescription(siqsScore)}
          </p>
        </div>
        
        {/* Key Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FactorCard 
            icon={<Moon className="w-4 h-4 text-purple-300" />}
            label={t("Moon Phase", "月相")}
            value={getMoonPhaseDescription(locationData.moonPhase)}
          />
          
          <FactorCard 
            icon={<Cloud className="w-4 h-4 text-blue-300" />}
            label={t("Cloud Cover", "云量")}
            value={`${getCloudCoverText(weatherData)} (${weatherData.cloudCover}%)`}
            colorClass={getCloudCoverColor(weatherData)}
          />
          
          <FactorCard 
            icon={<Wind className="w-4 h-4 text-sky-300" />}
            label={t("Wind Speed", "风速")}
            value={`${getWindSpeedDescription(weatherData.windSpeed)} (${weatherData.windSpeed} m/s)`}
          />
          
          <FactorCard 
            icon={<Droplets className="w-4 h-4 text-cyan-300" />}
            label={t("Humidity", "湿度")}
            value={`${getHumidityDescription(weatherData.humidity)} (${weatherData.humidity}%)`}
          />
          
          <FactorCard 
            icon={<Sun className="w-4 h-4 text-amber-300" />}
            label={t("Bortle Scale", "博特尔暗空分类")}
            value={`${getBortleScaleDescription(locationData.bortleScale)} (Class ${locationData.bortleScale})`}
          />
          
          <FactorCard 
            icon={<Gauge className="w-4 h-4 text-emerald-300" />}
            label={t("Seeing Conditions", "视宁度")}
            value={`${getSeeingConditionsDescription(locationData.seeingConditions)} (${locationData.seeingConditions}/5)`}
          />
          
          {weatherData.aqi && (
            <FactorCard 
              icon={<Info className="w-4 h-4 text-yellow-300" />}
              label={t("Air Quality", "空气质量")}
              value={`${getAqiDescription(weatherData.aqi)} (AQI: ${weatherData.aqi})`}
            />
          )}
          
          <FactorCard 
            icon={<Info className="w-4 h-4 text-red-300" />}
            label={t("Temperature", "温度")}
            value={`${getTemperatureDescription(weatherData.temperature)} (${weatherData.temperature}°C)`}
          />
        </div>
        
        {/* Contributing Factors */}
        {siqsResult.factors && siqsResult.factors.length > 0 && (
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
            <div className="space-y-3">
              {siqsResult.factors.map((factor: any, index: number) => (
                <FactorProgress 
                  key={index}
                  factor={factor}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function for SIQS description
const getSIQSDescription = (score: number) => {
  if (score >= 9) {
    return "Exceptional conditions for astrophotography.";
  } else if (score >= 7) {
    return "Excellent conditions, highly recommended.";
  } else if (score >= 5) {
    return "Good conditions, suitable for imaging.";
  } else if (score >= 3) {
    return "Moderate conditions, some limitations may apply.";
  } else {
    return "Poor conditions, not recommended for imaging.";
  }
};

// Helper components and functions
const FactorCard = ({ icon, label, value, colorClass }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string,
  colorClass?: string
}) => (
  <motion.div 
    className="p-3 rounded-lg bg-cosmic-800/30 hover:bg-cosmic-800/50 border border-cosmic-700/30 transition-all"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <p className={cn("text-sm", colorClass || "text-muted-foreground")}>
      {value}
    </p>
  </motion.div>
);

const FactorProgress = ({ factor, index }: { factor: any, index: number }) => {
  // Convert score from 0-100 to 0-10 scale if needed
  const score = factor.score > 10 ? factor.score / 10 : factor.score;
  const colorClass = getProgressColorClass(score);
  
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{factor.name}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass.replace('bg-', 'text-')} bg-cosmic-800/50`}>
          {score.toFixed(1)}
        </span>
      </div>
      <Progress 
        value={factor.score > 10 ? factor.score : factor.score * 10} 
        className="h-2"
        colorClass={colorClass}
      />
      <p className="text-xs text-muted-foreground">{factor.description}</p>
    </motion.div>
  );
};

// Helper functions for displaying factors
const getMoonPhaseDescription = (moonPhase: number) => {
  if (moonPhase < 0.125) return "New Moon";
  else if (moonPhase < 0.25) return "Waxing Crescent";
  else if (moonPhase < 0.375) return "First Quarter";
  else if (moonPhase < 0.5) return "Waxing Gibbous";
  else if (moonPhase < 0.625) return "Full Moon";
  else if (moonPhase < 0.75) return "Waning Gibbous";
  else if (moonPhase < 0.875) return "Last Quarter";
  else return "Waning Crescent";
};

const getWindSpeedDescription = (windSpeed: number) => {
  if (windSpeed < 10) return "Calm";
  else if (windSpeed < 20) return "Light breeze";
  else if (windSpeed < 30) return "Moderate breeze";
  else return "Strong wind";
};

const getHumidityDescription = (humidity: number) => {
  if (humidity < 30) return "Dry";
  else if (humidity < 60) return "Comfortable";
  else return "Humid";
};

const getAqiDescription = (aqi: number) => {
  if (aqi <= 50) return "Good";
  else if (aqi <= 100) return "Moderate";
  else if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  else if (aqi <= 200) return "Unhealthy";
  else if (aqi <= 300) return "Very Unhealthy";
  else return "Hazardous";
};

const getTemperatureDescription = (temperature: number) => {
  if (temperature < 0) return "Very Cold";
  else if (temperature < 10) return "Cold";
  else if (temperature < 20) return "Cool";
  else if (temperature < 30) return "Warm";
  else return "Hot";
};

const getBortleScaleDescription = (bortleScale: number) => {
  switch (bortleScale) {
    case 1: return "Excellent dark-sky site";
    case 2: return "Typical truly dark site";
    case 3: return "Rural sky";
    case 4: return "Rural/suburban transition";
    case 5: return "Suburban sky";
    case 6: return "Bright suburban sky";
    case 7: return "Suburban/urban transition";
    case 8: return "City sky";
    case 9: return "Inner-city sky";
    default: return "Unknown";
  }
};

const getSeeingConditionsDescription = (seeingConditions: number) => {
  switch (seeingConditions) {
    case 1: return "Excellent seeing";
    case 2: return "Good seeing";
    case 3: return "Average seeing";
    case 4: return "Poor seeing";
    case 5: return "Very poor seeing";
    default: return "Unknown";
  }
};

const getCloudCoverText = (weatherCondition: any) => {
  const cloudCover = weatherCondition.cloudCover ?? 0;
  
  if (cloudCover < 10) return "Clear";
  else if (cloudCover < 30) return "Partly Cloudy";
  else if (cloudCover < 60) return "Mostly Cloudy";
  else return "Overcast";
};

const getCloudCoverColor = (weatherCondition: any) => {
  const cloudCover = weatherCondition.cloudCover ?? 0;
  
  if (cloudCover < 20) return "text-green-400";
  else if (cloudCover < 40) return "text-yellow-400";
  else return "text-red-400";
};

export default SIQSSummary;
