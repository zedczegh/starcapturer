
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";

interface Reminder {
  condition: string;
  threshold: string;
  advice: string;
}

interface ConditionRemindersProps {
  factors: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  weatherData: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  moonPhase: string | number;
  bortleScale: number | null;
}

const ConditionReminders: React.FC<ConditionRemindersProps> = ({ 
  factors, 
  weatherData,
  moonPhase,
  bortleScale
}) => {
  const { t, language } = useLanguage();
  
  // Generate reminders based on the conditions
  const reminders: Reminder[] = [];
  
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
  
  // Moon phase reminder
  const moonIllumination = typeof moonPhase === 'number' ? 
    moonPhase : (moonPhase.includes("Full") ? 1 : moonPhase.includes("New") ? 0 : 0.5);
  
  if (moonIllumination > 0.5 || moonPhase.includes("Full") || moonPhase.includes("Gibbous")) {
    reminders.push({
      condition: t("Moon Illumination", "月光照度"),
      threshold: `> 50%`,
      advice: t(
        "The moon is quite bright, which might affect deep sky photography. Consider using a narrowband filter or focus on planetary photography instead.",
        "月亮相当明亮，可能会影响深空摄影。考虑使用窄带滤镜或改为进行行星摄影。"
      )
    });
  }
  
  // Humidity reminder for dew risk
  if (weatherData.humidity > 80) {
    reminders.push({
      condition: t("Humidity", "湿度"),
      threshold: `> 80%`,
      advice: t(
        "High humidity increases risk of dew formation. Consider using dew heaters for your optics.",
        "高湿度增加了露水形成的风险。考虑为您的光学设备使用露水加热器。"
      )
    });
  }
  
  // Light pollution reminder
  if (bortleScale && bortleScale > 5) {
    reminders.push({
      condition: t("Light Pollution", "光污染"),
      threshold: `${t("Bortle", "伯特尔")} > 5`,
      advice: t(
        "Significant light pollution in this area. Consider using light pollution filters or narrowband filters for deep sky objects.",
        "该地区光污染严重。考虑使用光污染滤镜或窄带滤镜来观测深空天体。"
      )
    });
  }
  
  // Cloud cover reminder
  const cloudFactor = factors.find(f => f.name === "Cloud Cover" || f.name === "云层覆盖");
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
  const seeingFactor = factors.find(f => f.name === "Seeing Conditions" || f.name === "视宁度");
  if (seeingFactor && seeingFactor.score < 60) {
    reminders.push({
      condition: t("Seeing Conditions", "视宁度"),
      threshold: t("Poor to Average", "差到一般"),
      advice: t(
        "Poor atmospheric stability will affect detailed imaging. Consider focusing on wide-field targets or shorter exposures.",
        "大气稳定性差将影响细节成像。考虑专注于广角目标或使用较短的曝光时间。"
      )
    });
  }
  
  // If no reminders, return null
  if (reminders.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4 space-y-3">
      <h3 className="font-medium text-gradient-blue flex items-center gap-2">
        <Info size={16} />
        {t("Observing Reminders", "观测提醒")}
      </h3>
      
      <div className="space-y-2 text-sm">
        {reminders.map((reminder, index) => (
          <div key={`reminder-${index}`} className="pb-2 border-b border-cosmic-700/30 last:border-0">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-cosmic-100">{reminder.condition}</span>
              <span className="text-cosmic-300">{reminder.threshold}</span>
            </div>
            <p className="text-cosmic-200">{reminder.advice}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(ConditionReminders);
