import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface SIQSSummaryProps {
  siqs: number;
  factors: {
    name: string;
    score: number;
    description: string;
  }[];
  isViable: boolean;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqs, factors = [], isViable }) => {
  const { t } = useLanguage();
  
  const normalizedSiqs = Math.min(Math.max(siqs, 0), 10);
  
  const getSiqsColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-green-400";
    if (score >= 4) return "bg-yellow-400";
    if (score >= 2) return "bg-orange-400";
    return "bg-red-500";
  };

  const formatSiqsScore = (score: number) => {
    return score.toFixed(1);
  };

  const getRecommendationMessage = (score: number) => {
    if (score >= 8) return t("Grab your rig and run!", "带上你的设备立刻出发！");
    if (score >= 6) return t("Yeah! Should give it a go, eh?", "不错！值得一试，对吧？");
    if (score >= 4) return t("Uh... let me think twice.", "呃...再考虑一下吧。");
    return t("Well, probably should hit the sack.", "嗯，可能该睡觉了。");
  };

  const getScoreTextColor = (score: number) => {
    if (score < 6) return "text-orange-500";
    return "";
  };

  React.useEffect(() => {
    const message = getRecommendationMessage(normalizedSiqs);
    const scoreFormatted = formatSiqsScore(normalizedSiqs);
    
    toast(`SIQS: ${scoreFormatted}/10 - ${message}`, {
      position: "top-center",
      duration: 4000,
    });
  }, [normalizedSiqs]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{t("Sky Image Quality Score", "天空图像质量评分")}</CardTitle>
          <Badge variant={isViable ? "default" : "destructive"} className="ml-2">
            {isViable ? (
              <CheckCircle2 className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {isViable ? t("Viable", "适合") : t("Not Viable", "不适合")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-bold ${getScoreTextColor(normalizedSiqs)}`}>
                {formatSiqsScore(normalizedSiqs)}
              </span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <span className="text-sm text-muted-foreground mt-1">{t("Overall Quality Score", "总体质量评分")}</span>
            <p className="text-sm mt-2 font-medium italic">
              "{getRecommendationMessage(normalizedSiqs)}"
            </p>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full ${getSiqsColor(normalizedSiqs)}`} 
              style={{ width: `${normalizedSiqs * 10}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          {factors && factors.length > 0 ? (
            factors.map((factor, index) => {
              const normalizedFactorScore = Math.min(Math.max(factor.score / 10, 0), 10);
              const translatedFactor = {
                name: t(factor.name, getFactorNameInChinese(factor.name)),
                description: t(factor.description, getFactorDescriptionInChinese(factor.description))
              };
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{translatedFactor.name}</span>
                    <span className={`text-sm ${normalizedFactorScore < 6 ? "text-orange-500" : ""}`}>
                      {normalizedFactorScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSiqsColor(normalizedFactorScore)}`} 
                      style={{ width: `${normalizedFactorScore * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{translatedFactor.description}</p>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>{t("No factor data available for this location.", "此位置没有可用的因素数据。")}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getFactorNameInChinese(name: string): string {
  const translations: { [key: string]: string } = {
    "Cloud Cover": "云层覆盖",
    "Seeing Conditions": "视宁度",
    "Wind Speed": "风速",
    "Humidity": "湿度",
    "Moon Phase": "月相",
    "Light Pollution": "光污染",
    "Temperature": "温度"
  };
  return translations[name] || name;
}

function getFactorDescriptionInChinese(description: string): string {
  const translations: { [key: string]: string } = {
    "Clear skies provide optimal viewing conditions": "晴朗的天空提供最佳观测条件",
    "Atmospheric stability affects image quality": "大气稳定性影响图像质量",
    "Strong winds can affect equipment stability": "强风可能影响设备稳定性",
    "High humidity can cause condensation": "高湿度可能导致设备结露",
    "Moon brightness affects deep sky visibility": "月亮亮度影响深空目标的可见性",
    "Urban light pollution reduces contrast": "城市光污染降低对比度",
    "Temperature changes can affect equipment": "温度变化可能影响设备性能"
  };
  return translations[description] || description;
}

export default SIQSSummary;
