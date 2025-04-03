
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, Sun, CloudSun, GlobeLock, CloudSnow, Moon, Stars } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const AboutContent = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("About AstroSights", "关于AstroSights")}
          </CardTitle>
          <CardDescription>
            {t(
              "AstroSights helps astrophotographers find the perfect locations for stargazing and night sky photography.",
              "AstroSights帮助天文摄影师寻找星空观测和夜空摄影的最佳位置。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t(
              "Our mission is to connect astronomy enthusiasts with the best viewing spots across the globe, factoring in light pollution, weather conditions, and local features.",
              "我们的使命是将天文爱好者与全球最佳观测点连接起来，考虑光污染、天气条件和当地特色。"
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stars className="h-5 w-5 text-primary" />
            {t("SIQS - Stellar Imaging Quality Score", "天文观测质量评分")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t(
              "The SIQS (Stellar Imaging Quality Score) is our proprietary rating system that evaluates locations based on their suitability for astrophotography.",
              "天文观测质量评分是我们专有的评级系统，根据地点对天文摄影的适宜性进行评估。"
            )}
          </p>
          
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">
              {t("SIQS Calculation Factors", "天文观测质量评分计算因素")}
            </h4>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li className="flex items-start">
                <CloudSun className="h-4 w-4 mr-2 mt-0.5 text-sky-400" />
                <span>
                  {t(
                    "Cloud Cover - Nighttime cloud coverage (6PM to 8AM) weighted separately for evening and morning",
                    "云层覆盖 - 夜间云层覆盖率（晚上6点至早上8点），分别对傍晚和清晨进行加权"
                  )}
                </span>
              </li>
              <li className="flex items-start">
                <Stars className="h-4 w-4 mr-2 mt-0.5 text-indigo-400" />
                <span>
                  {t(
                    "Light Pollution - Based on Bortle Scale measurements (automatically determined for your location)",
                    "光污染 - 基于波特尔量表测量（自动确定您所在位置的值）"
                  )}
                </span>
              </li>
              <li className="flex items-start">
                <Sun className="h-4 w-4 mr-2 mt-0.5 text-yellow-400" />
                <span>
                  {t(
                    "Clear Sky Rate - Historical clear sky percentage at the location",
                    "晴空率 - 该地点的历史晴空百分比"
                  )}
                </span>
              </li>
              <li className="flex items-start">
                <CloudSnow className="h-4 w-4 mr-2 mt-0.5 text-blue-400" />
                <span>
                  {t(
                    "Weather Conditions - Wind, humidity, temperature, and seeing conditions",
                    "天气条件 - 风速、湿度、温度和视宁度"
                  )}
                </span>
              </li>
              <li className="flex items-start">
                <Moon className="h-4 w-4 mr-2 mt-0.5 text-slate-400" />
                <span>
                  {t(
                    "Moon Phase - Impact of current moon phase on sky brightness",
                    "月相 - 当前月相对天空亮度的影响"
                  )}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="mt-4 bg-muted/30 p-3 rounded-md">
            <h4 className="text-sm font-semibold mb-2">
              {t("Recent Improvements", "最近的改进")}
            </h4>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>
                {t(
                  "Enhanced nighttime cloud forecasting with separate evening/morning analysis",
                  "增强的夜间云层预报，分别对傍晚/清晨进行分析"
                )}
              </li>
              <li>
                {t(
                  "Automatic Bortle scale detection for any location worldwide",
                  "全球任何位置的自动波特尔量表检测"
                )}
              </li>
              <li>
                {t(
                  "Added Clear Sky Rate factor to improve long-term location assessment",
                  "添加晴空率因素以改善长期位置评估"
                )}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t("Location Features", "位置功能")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              {t(
                "Real-time weather data and forecasts optimized for astrophotography",
                "针对天文摄影优化的实时天气数据和预报"
              )}
            </li>
            <li>
              {t(
                "Light pollution mapping and Bortle scale ratings",
                "光污染映射和波特尔量表评级"
              )}
            </li>
            <li>
              {t(
                "Community-shared locations with verified SIQS scores",
                "社区共享的位置，带有验证的天文观测质量评分"
              )}
            </li>
            <li>
              {t(
                "Detailed astronomical forecasts for optimal viewing times",
                "详细的天文预报，提供最佳观测时间"
              )}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutContent;
