import React, { useEffect, useState, useCallback } from "react";
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
import { getProgressColorClass } from "./siqs/utils/progressColor";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ 
  siqsData,
  weatherData,
  moonPhase,
  bortleScale,
  forecastData
}) => {
  const { t, language } = useLanguage();
  const [displayScore, setDisplayScore] = useState<number | null>(null);
  
  const extractSIQSFromForecast = useCallback(() => {
    if (!forecastData) return null;
    
    if (forecastData.daily?.siqs && Array.isArray(forecastData.daily.siqs)) {
      const validScores = forecastData.daily.siqs.filter((s: any) => 
        typeof s === 'number' && !isNaN(s) && s > 0
      );
      
      if (validScores.length > 0) {
        const avgScore = validScores.reduce((sum: number, score: number) => sum + score, 0) / validScores.length;
        console.log("Using average from forecast siqs array:", avgScore);
        return avgScore;
      }
    }
    
    try {
      if (forecastData.daily?.time) {
        const nightScores = getAverageForecastSIQS(forecastData.daily);
        if (nightScores > 0) {
          console.log("Using calculated average forecast SIQS:", nightScores);
          return nightScores;
        }
      }
    } catch (error) {
      console.error("Error calculating forecast SIQS:", error);
    }
    
    if (forecastData.hourly) {
      try {
        const now = new Date();
        const tonight = new Date(now);
        tonight.setHours(21, 0, 0, 0);
        
        const nighttimeForecasts = [];
        for (let i = 0; i < forecastData.hourly.time.length; i++) {
          const forecastTime = new Date(forecastData.hourly.time[i]);
          if (forecastTime >= tonight && 
              (forecastTime.getHours() >= 20 || forecastTime.getHours() <= 5)) {
            
            nighttimeForecasts.push({
              time: forecastData.hourly.time[i],
              cloudCover: forecastData.hourly.cloud_cover?.[i] || 0,
              weatherCode: forecastData.hourly.weather_code?.[i]
            });
          }
        }
        
        if (nighttimeForecasts.length > 0) {
          const avgCloudCover = nighttimeForecasts.reduce(
            (sum, forecast) => sum + forecast.cloudCover, 0
          ) / nighttimeForecasts.length;
          
          if (avgCloudCover < 40) {
            const cloudScore = Math.max(0, Math.min(10, 10 - (avgCloudCover * 0.25)));
            console.log("Using estimated score from cloud cover:", cloudScore);
            return cloudScore;
          }
        }
      } catch (error) {
        console.error("Error analyzing hourly forecast:", error);
      }
    }
    
    return null;
  }, [forecastData]);
  
  useEffect(() => {
    const forecastScore = extractSIQSFromForecast();
    
    if (forecastScore !== null) {
      setDisplayScore(forecastScore);
    } else if (siqsData && siqsData.score !== undefined) {
      const normalizedScore = siqsData.score <= 10 ? siqsData.score : siqsData.score / 10;
      
      if (normalizedScore < 3 && weatherData && weatherData.cloudCover !== undefined) {
        const cloudCover = weatherData.cloudCover;
        if (cloudCover < 40) {
          const estimatedScore = Math.max(0, Math.min(10, 10 - (cloudCover * 0.25)));
          console.log("Overriding low SIQS score due to good cloud conditions:", estimatedScore);
          setDisplayScore(estimatedScore);
          return;
        }
      }
      
      setDisplayScore(normalizedScore);
    } else {
      if (weatherData && weatherData.cloudCover !== undefined) {
        const cloudCover = weatherData.cloudCover;
        if (cloudCover < 40) {
          const estimatedScore = Math.max(0, Math.min(10, 10 - (cloudCover * 0.25)));
          console.log("Using default estimated score from conditions:", estimatedScore);
          setDisplayScore(estimatedScore);
          return;
        }
      }
      
      setDisplayScore(0);
    }
  }, [forecastData, siqsData, weatherData, extractSIQSFromForecast]);
  
  if (!siqsData) {
    return null;
  }
  
  const reminders: { condition: string; threshold: string; advice: string }[] = [];
  
  if (weatherData) {
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
    
    if (weatherData.humidity > 80) {
      reminders.push({
        condition: t("Humidity", "湿度"),
        threshold: `> 80%`,
        advice: getHumidityAdvice(weatherData.humidity, language)
      });
    }
  }
  
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
  
  if (bortleScale && bortleScale > 5) {
    reminders.push({
      condition: t("Light Pollution", "光污染"),
      threshold: `${t("Bortle", "伯特尔")} > 5`,
      advice: getLightPollutionAdvice(bortleScale, language)
    });
  }
  
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
  
  const seeingFactor = siqsData.factors?.find(f => f.name === "Seeing Conditions" || f.name === "视宁度");
  if (seeingFactor && seeingFactor.score < 60) {
    reminders.push({
      condition: t("Seeing Conditions", "视宁度"),
      threshold: t("Poor to Average", "差到一般"),
      advice: getSeeingAdvice(seeingFactor.score, language)
    });
  }

  const getScoreColorClass = (score: number) => {
    if (score < 3) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (score < 5) return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    if (score < 7) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    if (score < 9) return "bg-green-500/10 text-green-400 border-green-500/30";
    return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  };

  const getScoreLabel = (score: number) => {
    if (score < 3) return t("Poor", "较差");
    if (score < 5) return t("Fair", "一般");
    if (score < 7) return t("Good", "良好");
    if (score < 9) return t("Very Good", "很好");
    return t("Excellent", "极佳");
  };
  
  const scoreOn10Scale = displayScore !== null ? displayScore : 
    (siqsData?.score <= 10 ? siqsData?.score : siqsData?.score / 10) || 0;
  
  const progressClass = getProgressColorClass(scoreOn10Scale);
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.1,
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300 backdrop-blur-sm">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <h2 className="text-xl font-semibold text-gradient-blue">
            {t("SIQS Analysis", "SIQS分析")}
          </h2>
        </CardHeader>
        <CardContent className="p-4 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <motion.div 
            className="flex items-center justify-center mb-4"
            variants={itemVariants}
          >
            <div className={`flex flex-col items-center px-8 py-4 rounded-lg ${getScoreColorClass(scoreOn10Scale)} border transition-all duration-300 hover:scale-105 shadow-lg`}>
              <div className="text-4xl font-bold mb-1">{scoreOn10Scale.toFixed(1)}</div>
              <div className="text-sm font-medium">{getScoreLabel(scoreOn10Scale)}</div>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-center mb-4 italic text-sm"
            variants={itemVariants}
          >
            {getRecommendationMessage(scoreOn10Scale, language as 'en' | 'zh')}
          </motion.p>
          
          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <div className="w-full h-3 bg-cosmic-800/50 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`${progressClass} h-full transition-all duration-500 ease-out shadow-lg`}
                style={{ 
                  width: `${scoreOn10Scale * 10}%`, 
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{t("Poor", "差")}</span>
              <span>{t("Average", "一般")}</span>
              <span>{t("Excellent", "优秀")}</span>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            {siqsData.factors && siqsData.factors.length > 0 && (
              <SIQSFactorsList factors={siqsData.factors} />
            )}
          </motion.div>
          
          {reminders.length > 0 && (
            <motion.div 
              className="mt-4 bg-cosmic-800/30 rounded-lg p-3 border border-cosmic-700/30 shadow-inner"
              variants={itemVariants}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center text-sm text-amber-400 mb-2">
                <AlertCircle size={16} className="mr-1" />
                <span>{t("Viewing Condition Reminders", "观测条件提示")}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {reminders.map((reminder, index) => (
                  <motion.li 
                    key={index} 
                    className="flex flex-col p-2 rounded bg-cosmic-800/40 hover:bg-cosmic-800/50 transition-colors"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index + 0.4 }}
                  >
                    <span className="flex items-center">
                      <InfoIcon size={12} className="mr-1 text-blue-400" />
                      <span className="font-medium">{reminder.condition}</span>
                      <span className="mx-1 text-muted-foreground">|</span>
                      <span className="text-yellow-400">{reminder.threshold}</span>
                    </span>
                    <p className="ml-4 text-gray-300 text-xs mt-1">{reminder.advice}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(SIQSSummary);
