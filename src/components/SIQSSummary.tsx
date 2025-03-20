
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { InfoIcon, AlertCircle } from "lucide-react";
import SIQSFactorsList from "./siqs/SIQSFactorsList";
import {
  isMoonBright,
  getMoonAvoidanceStrategy,
  getSeeingAdvice,
  getHumidityAdvice,
  getLightPollutionAdvice
} from "@/utils/conditionReminderUtils";
import { getAverageForecastSIQS } from "@/utils/nighttimeSIQS";

interface SIQSSummaryProps {
  siqsData: {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
  weatherData?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  moonPhase?: string | number;
  bortleScale?: number | null;
  forecastData?: any;
}

export const getRecommendationMessage = (score: number, language: 'en' | 'zh'): string => {
  if (score < 3) {
    return language === 'en'
      ? "Poor conditions. Photography will be challenging. Consider rescheduling."
      : "条件不佳。摄影将充满挑战。建议重新安排时间。";
  } else if (score < 5) {
    return language === 'en'
      ? "Fair conditions. Expect some challenges with image quality."
      : "一般条件。图像质量可能会有一些挑战。";
  } else if (score < 7) {
    return language === 'en'
      ? "Good conditions. Suitable for most types of astrophotography."
      : "良好条件。适合大多数类型的天文摄影。";
  } else if (score < 9) {
    return language === 'en'
      ? "Very good conditions. Excellent opportunity for quality imaging."
      : "非常好的条件。获取高质量图像的绝佳机会。";
  } else {
    return language === 'en'
      ? "Exceptional conditions. Ideal for all types of astrophotography."
      : "卓越条件。适合所有类型的天文摄影。";
  }
};

// Get the appropriate progress bar color matching the About SIQS page
const getProgressBarColor = (score: number): string => {
  if (score >= 8) return "bg-green-500";
  if (score >= 6) return "bg-gradient-to-r from-[#8A9A5B] to-[#606C38]";
  if (score >= 4) return "bg-yellow-400";
  if (score >= 2) return "bg-orange-400";
  return "bg-red-500";
};

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ 
  siqsData,
  weatherData,
  moonPhase,
  bortleScale,
  forecastData
}) => {
  const { t, language } = useLanguage();
  const [displayScore, setDisplayScore] = useState<number | null>(null);
  
  // Use forecast data for SIQS if available
  useEffect(() => {
    if (forecastData?.daily?.time) {
      // Try to get SIQS from forecast rows first
      try {
        const averageSIQS = getAverageForecastSIQS(forecastData.daily);
        if (averageSIQS > 0) {
          console.log("Using average forecast SIQS:", averageSIQS);
          setDisplayScore(averageSIQS);
          return;
        }
      } catch (error) {
        console.error("Error getting average forecast SIQS:", error);
      }
    }
    
    // Fall back to siqsData if forecast parsing fails
    if (siqsData && siqsData.score !== undefined) {
      // Ensure the score is always on a 0-10 scale
      const normalizedScore = siqsData.score <= 10 ? siqsData.score : siqsData.score / 10;
      setDisplayScore(normalizedScore);
    }
  }, [forecastData, siqsData]);
  
  if (!siqsData) {
    return null;
  }
  
  // Generate condition reminders
  const reminders: { condition: string; threshold: string; advice: string }[] = [];
  
  // Add weather-based reminders
  if (weatherData) {
    // Wind speed reminder
    if (weatherData.windSpeed > 15) {
      reminders.push({
        condition: t("Wind Speed", "风速"),
        threshold: `> 15 ${t("km/h", "公里/小时")}`,
        advice: t(
          "High wind speeds may cause vibrations and affect guiding and image quality.",
          "高风速可能导致振动，影响导星和图像质量。"
        )
      });
    }
    
    // Humidity reminder for dew risk
    if (weatherData.humidity > 80) {
      reminders.push({
        condition: t("Humidity", "湿度"),
        threshold: `> 80%`,
        advice: getHumidityAdvice(weatherData.humidity, language)
      });
    }
  }
  
  // Moon phase reminder
  if (moonPhase !== undefined) {
    const isBright = typeof moonPhase === 'string' 
      ? moonPhase.includes("Full") || moonPhase.includes("Gibbous")
      : moonPhase > 0.5;
      
    if (isBright) {
      reminders.push({
        condition: t("Moon Illumination", "月光照度"),
        threshold: `> 50%`,
        advice: t(
          "The moon is quite bright, which might affect deep sky photography. Consider using a narrowband filter or focus on planetary photography instead.",
          "月亮相当明亮，可能会影响深空摄影。考虑使用窄带滤镜或改为进行行星摄影。"
        )
      });
    }
  }
  
  // Light pollution reminder
  if (bortleScale && bortleScale > 5) {
    reminders.push({
      condition: t("Light Pollution", "光污染"),
      threshold: `${t("Bortle", "伯特尔")} > 5`,
      advice: getLightPollutionAdvice(bortleScale, language)
    });
  }
  
  // Cloud cover reminder
  const cloudFactor = siqsData.factors?.find(f => f.name === "Cloud Cover" || f.name === "云层覆盖");
  if (cloudFactor && cloudFactor.score < 70) {
    reminders.push({
      condition: t("Cloud Cover", "云层覆盖"),
      threshold: `${t("Score", "评分")} < 70`,
      advice: t(
        "Partial cloud cover may interrupt imaging. Monitor cloud movements and plan for shorter exposure sequences.",
        "部分云层覆盖可能会中断拍摄。监测云层移动并计划较短的曝光序列。"
      )
    });
  }
  
  // Seeing conditions reminder
  const seeingFactor = siqsData.factors?.find(f => f.name === "Seeing Conditions" || f.name === "视宁度");
  if (seeingFactor && seeingFactor.score < 60) {
    reminders.push({
      condition: t("Seeing Conditions", "视宁度"),
      threshold: t("Poor to Average", "差到一般"),
      advice: getSeeingAdvice(seeingFactor.score, language)
    });
  }

  // Determine score color class
  const getScoreColorClass = (score: number) => {
    if (score < 3) return "bg-red-500/10 text-red-400";
    if (score < 5) return "bg-orange-500/10 text-orange-400";
    if (score < 7) return "bg-yellow-500/10 text-yellow-400";
    if (score < 9) return "bg-green-500/10 text-green-400";
    return "bg-blue-500/10 text-blue-400";
  };

  // Get appropriate score label
  const getScoreLabel = (score: number) => {
    if (score < 2) return t("Poor", "较差");
    if (score < 4) return t("Fair", "一般");
    if (score < 6) return t("Good", "良好");
    if (score < 8) return t("Very Good", "很好");
    return t("Excellent", "极佳");
  };
  
  // Use displayScore (which comes from forecast data if available) or fall back to original
  const scoreOn10Scale = displayScore !== null ? displayScore : 
    (siqsData.score <= 10 ? siqsData.score : siqsData.score / 10);
  
  return (
    <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <h2 className="text-xl font-semibold text-gradient-blue">
          {t("SIQS Analysis", "SIQS分析")}
        </h2>
      </CardHeader>
      <CardContent className="p-4">
        {/* Score Display */}
        <div className="flex items-center justify-center mb-4">
          <div className={`flex flex-col items-center px-8 py-4 rounded-lg ${getScoreColorClass(scoreOn10Scale)} transition-all duration-300 hover:scale-105`}>
            <div className="text-4xl font-bold mb-1">{scoreOn10Scale.toFixed(1)}</div>
            <div className="text-sm font-medium">{getScoreLabel(scoreOn10Scale)}</div>
          </div>
        </div>
        
        {/* Progress bar that matches About SIQS page colors */}
        <div className="w-full mb-4">
          <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressBarColor(scoreOn10Scale)}`} 
              style={{ width: `${scoreOn10Scale * 10}%`, transition: 'width 0.5s ease-in-out' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{t("Poor", "差")}</span>
            <span>{t("Fair", "一般")}</span>
            <span>{t("Good", "良好")}</span>
            <span>{t("Very Good", "很好")}</span>
            <span>{t("Excellent", "极佳")}</span>
          </div>
        </div>
        
        {/* Recommendation message */}
        <p className="text-center mb-4 italic text-sm">
          {getRecommendationMessage(scoreOn10Scale, language as 'en' | 'zh')}
        </p>
        
        {/* Factors list */}
        {siqsData.factors && siqsData.factors.length > 0 && (
          <SIQSFactorsList factors={siqsData.factors} />
        )}
        
        {/* Reminders Section */}
        {reminders.length > 0 && (
          <div className="mt-4 bg-cosmic-800/20 rounded-lg p-3">
            <div className="flex items-center text-sm text-amber-400 mb-2">
              <AlertCircle size={16} className="mr-1" />
              <span>{t("Viewing Condition Reminders", "观测条件提示")}</span>
            </div>
            <ul className="space-y-2 text-sm">
              {reminders.map((reminder, index) => (
                <li key={index} className="flex flex-col">
                  <span className="flex items-center">
                    <InfoIcon size={12} className="mr-1 text-blue-400" />
                    <span className="font-medium">{reminder.condition}</span>
                    <span className="mx-1 text-muted-foreground">|</span>
                    <span className="text-yellow-400">{reminder.threshold}</span>
                  </span>
                  <p className="ml-4 text-gray-300 text-xs">{reminder.advice}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SIQSSummary);
