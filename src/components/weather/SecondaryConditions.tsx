
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Cloud, 
  Moon, 
  BadgeInfo,
  CloudSun
} from "lucide-react";
import ConditionItem from "./ConditionItem";
import { getBortleDescription } from "@/utils/weather/bortleScaleUtils";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string | number;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    description: string;
    evening?: number | null;
    morning?: number | null;
  } | null;
}

const SecondaryConditions = memo<SecondaryConditionsProps>(({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { t } = useLanguage();
  
  const getCloudTooltip = () => {
    if (cloudCover <= 20) {
      return t("Clear sky - excellent for astronomy", "晴朗 - 非常适合天文观测");
    } else if (cloudCover <= 40) {
      return t("Mostly clear - good conditions", "大部分晴朗 - 良好条件");
    } else if (cloudCover <= 70) {
      return t("Partly cloudy - fair conditions", "部分多云 - 一般条件");
    } else {
      return t("Mostly cloudy - poor conditions", "大部分多云 - 差条件");
    }
  };
  
  const getCloudColor = (cover: number) => {
    if (cover <= 20) return "text-green-400";
    if (cover <= 40) return "text-lime-400";
    if (cover <= 70) return "text-yellow-400";
    return "text-red-400";
  };
  
  const formatCloudCover = (cover: number) => {
    return `${Math.round(cover)}%`;
  };
  
  const getMoonTooltip = () => {
    if (typeof moonPhase === 'number') {
      const phase = parseInt(moonPhase.toString(), 10);
      if (phase <= 1 || phase >= 27) {
        return t("New moon - excellent for deep sky observation", "新月 - 非常适合深空观测");
      } else if (phase <= 6 || phase >= 22) {
        return t("Crescent moon - good for astronomy", "娥眉月 - 较好的天文条件");
      } else if (phase <= 9 || phase >= 19) {
        return t("Quarter moon - fair conditions", "上/下弦月 - 一般条件");
      } else {
        return t("Full moon - difficult for deep sky objects", "满月 - 不适合深空天体观测");
      }
    } else {
      // Handle named moon phases
      const phaseLower = moonPhase.toString().toLowerCase();
      if (phaseLower.includes("new")) {
        return t("New moon - excellent for deep sky observation", "新月 - 非常适合深空观测");
      } else if (phaseLower.includes("crescent")) {
        return t("Crescent moon - good for astronomy", "娥眉月 - 较好的天文条件");
      } else if (phaseLower.includes("quarter")) {
        return t("Quarter moon - fair conditions", "上/下弦月 - 一般条件");
      } else if (phaseLower.includes("gibbous")) {
        return t("Gibbous moon - challenging for faint objects", "凸月 - 对暗淡天体有挑战");
      } else if (phaseLower.includes("full")) {
        return t("Full moon - difficult for deep sky objects", "满月 - 不适合深空天体观测");
      } else {
        return t("Current moon phase", "当前月相");
      }
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-3">
      <ConditionItem
        icon={<Cloud className="h-4 w-4" />}
        label={t("Cloud Cover", "云量")}
        value={<span className={getCloudColor(cloudCover)}>{formatCloudCover(cloudCover)}</span>}
        tooltip={getCloudTooltip()}
      />
      
      {nighttimeCloudData && (
        <ConditionItem
          icon={<CloudSun className="h-4 w-4" />}
          label={t("Tonight's Cloud Cover", "今晚云量")}
          value={
            <span className={getCloudColor(nighttimeCloudData.average)}>
              {formatCloudCover(nighttimeCloudData.average)}
            </span>
          }
          tooltip={t("Predicted cloud cover during astronomical night", "天文夜间预测云量")}
          badgeText={nighttimeCloudData.timeRange}
        />
      )}
      
      <ConditionItem
        icon={<Moon className="h-4 w-4" />}
        label={t("Moon Phase", "月相")}
        value={<span className="text-xs">{moonPhase}</span>}
        tooltip={getMoonTooltip()}
      />
      
      {bortleScale && (
        <ConditionItem
          icon={<BadgeInfo className="h-4 w-4" />}
          label={t("Bortle Scale", "波特尔等级")}
          value={<span className="text-xs">{bortleScale}/9</span>}
          tooltip={getBortleDescription(bortleScale)}
        />
      )}
      
      {aqi !== undefined && (
        <ConditionItem
          icon={<BadgeInfo className="h-4 w-4" />}
          label={t("Air Quality", "空气质量")}
          value={<span className="text-xs">{aqi}</span>}
          tooltip={t("Air Quality Index", "空气质量指数")}
        />
      )}
    </div>
  );
});

SecondaryConditions.displayName = 'SecondaryConditions';

export default SecondaryConditions;
