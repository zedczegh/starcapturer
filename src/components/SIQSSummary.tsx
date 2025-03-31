import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Cloud, Sun, Wind, Droplets, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
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
  
  const getSIQSDescription = (score: number) => {
    if (score >= 9) {
      return t("Exceptional conditions for astrophotography.", "非常适合天文摄影的条件。");
    } else if (score >= 7) {
      return t("Excellent conditions, highly recommended.", "极佳的条件，强烈推荐。");
    } else if (score >= 5) {
      return t("Good conditions, suitable for imaging.", "良好的条件，适合成像。");
    } else if (score >= 3) {
      return t("Moderate conditions, some limitations may apply.", "中等条件，可能存在一些限制。");
    } else {
      return t("Poor conditions, not recommended for imaging.", "条件差，不建议成像。");
    }
  };
  
  const getMoonPhaseDescription = (moonPhase: number) => {
    if (moonPhase < 0.125) {
      return "New Moon";
    } else if (moonPhase < 0.375) {
      return "Waxing Crescent";
    } else if (moonPhase < 0.625) {
      return "First Quarter";
    } else if (moonPhase < 0.875) {
      return "Waxing Gibbous";
    } else {
      return "Full Moon";
    }
  };
  
  const getWindSpeedDescription = (windSpeed: number) => {
    if (windSpeed < 10) {
      return "Calm";
    } else if (windSpeed < 20) {
      return "Light breeze";
    } else if (windSpeed < 30) {
      return "Moderate breeze";
    } else {
      return "Strong wind";
    }
  };
  
  const getHumidityDescription = (humidity: number) => {
    if (humidity < 30) {
      return "Dry";
    } else if (humidity < 60) {
      return "Comfortable";
    } else {
      return "Humid";
    }
  };
  
  const getAqiDescription = (aqi: number) => {
    if (aqi <= 50) {
      return "Good";
    } else if (aqi <= 100) {
      return "Moderate";
    } else if (aqi <= 150) {
      return "Unhealthy for Sensitive Groups";
    } else if (aqi <= 200) {
      return "Unhealthy";
    } else if (aqi <= 300) {
      return "Very Unhealthy";
    } else {
      return "Hazardous";
    }
  };
  
  const getTemperatureDescription = (temperature: number) => {
    if (temperature < 0) {
      return "Very Cold";
    } else if (temperature < 10) {
      return "Cold";
    } else if (temperature < 20) {
      return "Cool";
    } else if (temperature < 30) {
      return "Warm";
    } else {
      return "Hot";
    }
  };

  const getBortleScaleDescription = (bortleScale: number) => {
    switch (bortleScale) {
      case 1:
        return "Excellent dark-sky site";
      case 2:
        return "Typical truly dark site";
      case 3:
        return "Rural sky";
      case 4:
        return "Rural/suburban transition";
      case 5:
        return "Suburban sky";
      case 6:
        return "Bright suburban sky";
      case 7:
        return "Suburban/urban transition";
      case 8:
        return "City sky";
      case 9:
        return "Inner-city sky";
      default:
        return "Unknown";
    }
  };
  
  const getSeeingConditionsDescription = (seeingConditions: number) => {
    switch (seeingConditions) {
      case 1:
        return "Excellent seeing";
      case 2:
        return "Good seeing";
      case 3:
        return "Average seeing";
      case 4:
        return "Poor seeing";
      case 5:
        return "Very poor seeing";
      default:
        return "Unknown";
    }
  };
  
  const getCloudCoverText = (weatherCondition: any) => {
    const cloudCover = weatherCondition.cloudCover ?? 0;
    
    if (cloudCover < 10) {
      return "Clear";
    } else if (cloudCover < 30) {
      return "Partly Cloudy";
    } else if (cloudCover < 60) {
      return "Mostly Cloudy";
    } else {
      return "Overcast";
    }
  };
  
  const getCloudCoverColor = (weatherCondition: any) => {
    const cloudCover = weatherCondition.cloudCover ?? 0;
    
    if (cloudCover < 20) {
      return "text-green-400";
    } else if (cloudCover < 40) {
      return "text-yellow-400";
    } else {
      return "text-red-400";
    }
  };
  
  return (
    <Card className="glassmorphism-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          {t("SIQS Summary", "SIQS 摘要")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="text-lg font-semibold">
          {t("Overall Score", "总分")}: {typeof siqsResult.score === 'number' ? siqsResult.score.toFixed(1) : '0.0'} / 10
        </div>
        <p className="text-sm text-muted-foreground">
          {getSIQSDescription(siqsResult.score || 0)}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              {t("Moon Phase", "月相")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getMoonPhaseDescription(locationData.moonPhase)}
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              {t("Cloud Cover", "云量")}:
            </div>
            <p className={cn("text-sm text-muted-foreground", getCloudCoverColor(weatherData))}>
              {getCloudCoverText(weatherData)} ({weatherData.cloudCover}%)
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              {t("Wind Speed", "风速")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getWindSpeedDescription(weatherData.windSpeed)} ({weatherData.windSpeed} m/s)
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              {t("Humidity", "湿度")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getHumidityDescription(weatherData.humidity)} ({weatherData.humidity}%)
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("Bortle Scale", "博特尔暗空分类")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getBortleScaleDescription(locationData.bortleScale)} (Class {locationData.bortleScale})
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("Seeing Conditions", "视宁度")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getSeeingConditionsDescription(locationData.seeingConditions)} ({locationData.seeingConditions}/5)
            </p>
          </div>
          
          {weatherData.aqi && (
            <div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t("Air Quality", "空气质量")}:
              </div>
              <p className="text-sm text-muted-foreground">
                {getAqiDescription(weatherData.aqi)} (AQI: {weatherData.aqi})
              </p>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("Temperature", "温度")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getTemperatureDescription(weatherData.temperature)} ({weatherData.temperature}°C)
            </p>
          </div>
        </div>
        
        {siqsResult.factors && siqsResult.factors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {siqsResult.factors.map((factor: any, index: number) => (
                <li key={index}>
                  {factor.name}: {factor.description} (Score: {factor.score ? factor.score.toFixed(1) : '0.0'})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SIQSSummary;
