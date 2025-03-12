
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Award, AlertTriangle } from "lucide-react";
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
  const { t, language } = useLanguage();
  
  const normalizedSiqs = Math.min(Math.max(siqs, 0), 10);
  
  const getSiqsColor = (score: number) => {
    if (score >= 8) return "bg-gradient-to-r from-green-400 to-green-500";
    if (score >= 6) return "bg-gradient-to-r from-[#8A9A5B] to-[#606C38]";
    if (score >= 4) return "bg-gradient-to-r from-yellow-300 to-yellow-400";
    if (score >= 2) return "bg-gradient-to-r from-orange-300 to-orange-400";
    return "bg-gradient-to-r from-red-400 to-red-500";
  };

  const formatSiqsScore = (score: number) => {
    return score.toFixed(1);
  };

  const getViabilityStatus = (score: number) => {
    if (score >= 8) return {
      isViable: true,
      label: t("Exceptional", "理想"),
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />
    };
    if (score >= 5) return {
      isViable: true,
      label: t("Partly Ideal", "部分理想"),
      icon: <CheckCircle2 className="mr-1 h-3 w-3" />
    };
    return {
      isViable: false,
      label: t("Not Ideal", "不理想"),
      icon: <XCircle className="mr-1 h-3 w-3" />
    };
  };

  const getRecommendationMessage = (score: number) => {
    if (score >= 8) return t("Grab your rig and run!", "带上你的设备立刻出发！");
    if (score >= 5) return t("Yeah! Should give it a go, eh?", "不错！值得一试，对吧？");
    return t("Uh... let me think twice.", "呃...再考虑一下吧。");
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-green-300";
    if (score >= 4) return "text-yellow-300";
    if (score >= 2) return "text-orange-400";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 7) return <Award className="h-6 w-6 text-green-400" />;
    if (score >= 4) return <CheckCircle2 className="h-6 w-6 text-yellow-300" />;
    return <AlertTriangle className="h-6 w-6 text-red-400" />;
  };

  React.useEffect(() => {
    const message = getRecommendationMessage(normalizedSiqs);
    const scoreFormatted = formatSiqsScore(normalizedSiqs);
    
    toast(`SIQS: ${scoreFormatted}/10 - ${message}`, {
      position: "top-center",
      duration: 4000,
    });
  }, [normalizedSiqs]);

  const viabilityStatus = getViabilityStatus(normalizedSiqs);

  return (
    <Card className="glassmorphism border-cosmic-700/30 transition-all duration-300 hover:border-cosmic-600/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gradient-blue">{t("Sky Image Quality Score", "天空图像质量评分")}</CardTitle>
          <Badge 
            variant={viabilityStatus.isViable ? "default" : "destructive"} 
            className={`ml-2 ${viabilityStatus.isViable ? "pulse-glow" : ""}`}
          >
            {viabilityStatus.icon}
            {viabilityStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-center gap-2 mb-1">
              {getScoreIcon(normalizedSiqs)}
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-bold ${getScoreTextColor(normalizedSiqs)}`}>
                  {formatSiqsScore(normalizedSiqs)}
                </span>
                <span className="text-lg text-muted-foreground">/10</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground mt-1">{t("Overall Quality Score", "总体质量评分")}</span>
            <p className="text-sm mt-2 font-medium italic terminal-text">
              "{getRecommendationMessage(normalizedSiqs)}"
            </p>
          </div>
          <div className="w-full h-3 bg-cosmic-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getSiqsColor(normalizedSiqs)} transition-all duration-500 ease-out`} 
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
                <div key={index} className="p-2 hover:bg-cosmic-800/30 rounded-lg transition-colors duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-cosmic-200">{translatedFactor.name}</span>
                    <span className={`text-sm ${getScoreTextColor(normalizedFactorScore)}`}>
                      {normalizedFactorScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cosmic-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getSiqsColor(normalizedFactorScore)} transition-all duration-300`} 
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
    "Wind": "风速",
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
    "Light pollution affects deep sky visibility": "光污染影响深空目标的可见性",
    "Temperature changes can affect equipment": "温度变化可能影响设备性能",
    "Cloud cover severely impacts image quality": "云层严重影响图像质量",
    "Seeing conditions determine image sharpness": "视宁度决定图像清晰度",
    "Wind affects mount stability and tracking": "风影响支架稳定性和追踪",
    "Humidity can damage sensitive equipment": "湿度可能损坏敏感设备",
    "Moon phase affects background sky brightness": "月相影响背景天空亮度",
    "Light pollution masks faint deep sky objects": "光污染遮蔽暗弱的深空天体",
    "Excellent clear skies, ideal for all types of astrophotography": "极佳的晴朗天空，适合所有类型的天文摄影",
    "Very good conditions with minimal cloud interference": "非常好的条件，云层干扰最小",
    "Moderate cloud cover, suitable for bright targets": "中等云层覆盖，适合明亮目标",
    "Significant cloud cover, limiting for many targets": "显著的云层覆盖，限制许多目标",
    "Heavy cloud cover, poor conditions for most imaging": "厚重的云层，大多数成像条件较差",
    "Very heavy cloud cover, unsuitable for imaging": "非常厚重的云层，不适合成像",
    "Excellent dark sky, Milky Way casts shadows": "极佳的暗夜天空，银河投下阴影",
    "Good sky darkness, Milky Way visible with detail": "良好的天空黑暗度，银河细节可见",
    "Moderate light pollution, limited deep-sky visibility": "中等光污染，有限的深空可见度",
    "Significant light pollution, only brighter DSOs visible": "显著的光污染，只有更亮的深空天体可见",
    "Severe light pollution, limiting to planets and bright stars": "严重的光污染，仅限于行星和亮星",
    "Excellent atmospheric stability for high-resolution imaging": "极佳的大气稳定性，适合高分辨率成像",
    "Good seeing conditions, suitable for planetary detail": "良好的视宁度，适合行星细节",
    "Average seeing, acceptable for most targets": "一般的视宁度，可接受大多数目标",
    "Poor seeing conditions, challenging for detailed work": "较差的视宁度，详细工作具有挑战性",
    "Very poor seeing, significant image degradation": "非常差的视宁度，图像质量严重下降",
    "Calm conditions, ideal for all imaging setups": "平静的条件，适合所有成像设置",
    "Light breeze, good for most equipment": "微风，适合大多数设备",
    "Moderate wind, may impact long exposures": "中等风速，可能影响长时间曝光",
    "Strong wind, challenging for many setups": "强风，对许多设置具有挑战性",
    "Very strong wind, unsuitable for most equipment": "非常强的风，不适合大多数设备",
    "Very dry conditions, excellent for optics": "非常干燥的条件，光学效果极佳",
    "Low humidity, good optical performance": "低湿度，良好的光学性能",
    "Moderate humidity, acceptable conditions": "中等湿度，可接受的条件",
    "High humidity, potential for dew formation": "高湿度，可能形成露水",
    "Very high humidity, significant dew issues likely": "非常高的湿度，可能有明显的露水问题"
  };
  return translations[description] || description;
}

export default SIQSSummary;
