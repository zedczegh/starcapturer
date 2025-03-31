import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Cloud, Sun, Wind, Droplets, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateSIQS } from "@/lib/calculateSIQS";
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
          {t("Please select a location to view the SIQS summary.", "请选择一个地点以查看SIQS摘要。")}
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
  
  const getBortleScaleDescription = (bortleScale: number) => {
    switch (bortleScale) {
      case 1:
        return t("Excellent dark-sky site", "极佳的暗空地点");
      case 2:
        return t("Typical truly dark site", "典型的真正黑暗的地点");
      case 3:
        return t("Rural sky", "乡村天空");
      case 4:
        return t("Rural/suburban transition", "乡村/郊区过渡地带");
      case 5:
        return t("Suburban sky", "郊区天空");
      case 6:
        return t("Bright suburban sky", "明亮的郊区天空");
      case 7:
        return t("Suburban/urban transition", "郊区/城市过渡地带");
      case 8:
        return t("City sky", "城市天空");
      case 9:
        return t("Inner-city sky", "市中心天空");
      default:
        return t("Unknown", "未知");
    }
  };
  
  const getSeeingConditionsDescription = (seeingConditions: number) => {
    switch (seeingConditions) {
      case 1:
        return t("Excellent seeing", "极佳的视宁度");
      case 2:
        return t("Good seeing", "良好的视宁度");
      case 3:
        return t("Average seeing", "平均视宁度");
      case 4:
        return t("Poor seeing", "较差的视宁度");
      case 5:
        return t("Very poor seeing", "非常差的视宁度");
      default:
        return t("Unknown", "未知");
    }
  };
  
  const getMoonPhaseDescription = (moonPhase: number) => {
    if (moonPhase < 0.125) {
      return t("New Moon", "新月");
    } else if (moonPhase < 0.375) {
      return t("Waxing Crescent", "眉月");
    } else if (moonPhase < 0.625) {
      return t("First Quarter", "上弦月");
    } else if (moonPhase < 0.875) {
      return t("Waxing Gibbous", "渐盈凸月");
    } else {
      return t("Full Moon", "满月");
    }
  };
  
  const getWindSpeedDescription = (windSpeed: number) => {
    if (windSpeed < 10) {
      return t("Calm", "平静");
    } else if (windSpeed < 20) {
      return t("Light breeze", "微风");
    } else if (windSpeed < 30) {
      return t("Moderate breeze", "和风");
    } else {
      return t("Strong wind", "强风");
    }
  };
  
  const getHumidityDescription = (humidity: number) => {
    if (humidity < 30) {
      return t("Dry", "干燥");
    } else if (humidity < 60) {
      return t("Comfortable", "舒适");
    } else {
      return t("Humid", "潮湿");
    }
  };
  
  const getAqiDescription = (aqi: number) => {
    if (aqi <= 50) {
      return t("Good", "好");
    } else if (aqi <= 100) {
      return t("Moderate", "中等");
    } else if (aqi <= 150) {
      return t("Unhealthy for Sensitive Groups", "对敏感人群不健康");
    } else if (aqi <= 200) {
      return t("Unhealthy", "不健康");
    } else if (aqi <= 300) {
      return t("Very Unhealthy", "非常不健康");
    } else {
      return t("Hazardous", "危险");
    }
  };
  
  const getTemperatureDescription = (temperature: number) => {
    const temperatureC = temperature;
    
    if (temperatureC < 0) {
      return t("Very Cold", "非常冷");
    } else if (temperatureC < 10) {
      return t("Cold", "冷");
    } else if (temperatureC < 20) {
      return t("Cool", "凉爽");
    } else if (temperatureC < 30) {
      return t("Warm", "温暖");
    } else {
      return t("Hot", "热");
    }
  };

  // Make sure to update the weatherCondition type to include cloudCover
  interface WeatherConditionType {
    temperature: number;
    humidity: number;
    windSpeed: number;
    cloudCover?: number; // Adding this field as optional
  }

  // Modify the function that uses cloudCover to handle cases where it's missing
  const getCloudCoverText = (weatherCondition: WeatherConditionType) => {
    const cloudCover = weatherCondition.cloudCover ?? 0; // Use nullish coalescing to provide a default
    
    if (cloudCover < 10) {
      return t("Clear", "晴朗");
    } else if (cloudCover < 30) {
      return t("Partly Cloudy", "部分多云");
    } else if (cloudCover < 60) {
      return t("Mostly Cloudy", "大部多云");
    } else {
      return t("Overcast", "阴天");
    }
  };

  const getCloudCoverColor = (weatherCondition: WeatherConditionType) => {
    const cloudCover = weatherCondition.cloudCover ?? 0; // Use nullish coalescing to provide a default
    
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
          {t("Overall Score", "总分")}: {siqsResult.score.toFixed(1)} / 10
        </div>
        <p className="text-sm text-muted-foreground">
          {getSIQSDescription(siqsResult.score)}
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
          
          <div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("Air Quality", "空气质量")}:
            </div>
            <p className="text-sm text-muted-foreground">
              {getAqiDescription(weatherData.aqi)} (AQI: {weatherData.aqi})
            </p>
          </div>
          
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
        
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {siqsResult.factors.map((factor: any, index: number) => (
              <li key={index}>
                {factor.name}: {factor.description} (Score: {factor.score.toFixed(1)})
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SIQSSummary;
