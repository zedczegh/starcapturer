
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Motion, Presence } from "framer-motion";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

const AboutPage = () => {
  const { t, language } = useLanguage();
  
  const features = [
    {
      title: t("Sky Index Quality Score (SIQS)", "天空指数质量评分 (SIQS)"),
      description: t(
        "SIQS is our proprietary scoring system that combines multiple factors to rate how suitable a location is for astronomy and astrophotography. It includes cloud cover, light pollution, seeing conditions, and more.",
        "SIQS是我们的专有评分系统，结合多个因素来评价一个地点对天文观测和天文摄影的适宜程度。它包括云量、光污染、视宁度等多项指标。"
      ),
      new: false
    },
    {
      title: t("Enhanced Nighttime Cloud Cover Analysis", "增强的夜间云量分析"),
      description: t(
        "Our system now analyzes cloud cover separately for evening (6PM-12AM) and morning (1AM-8AM) to provide more accurate SIQS scores based on when you'll actually be observing.",
        "我们的系统现在分别分析傍晚（18:00-24:00）和早晨（1:00-8:00）的云量，根据您实际观测的时间提供更准确的SIQS评分。"
      ),
      new: true
    },
    {
      title: t("Clear Sky Rate", "晴空率"),
      description: t(
        "We now include historical clear sky rate data to help you understand how often a location typically has clear skies suitable for astronomy throughout the year.",
        "我们现在包含历史晴空率数据，帮助您了解全年中某一地点通常有多少时间拥有适合天文观测的晴朗天空。"
      ),
      new: true
    },
    {
      title: t("Dynamic Bortle Scale", "动态博特尔等级"),
      description: t(
        "Our app now automatically calculates the Bortle Scale (light pollution level) for any location globally, with enhanced accuracy for China and major cities worldwide.",
        "我们的应用现在可以自动计算全球任何地点的博特尔等级（光污染水平），对中国和全球主要城市提供更高的准确度。"
      ),
      new: true
    },
    {
      title: t("Weather Forecasts", "天气预报"),
      description: t(
        "Get detailed hourly and 15-day forecasts specifically optimized for astronomy, highlighting the best viewing periods based on cloud cover and other conditions.",
        "获取专为天文观测优化的详细每小时和15天预报，突出显示基于云量和其他条件的最佳观测时段。"
      ),
      new: false
    },
    {
      title: t("AstroSpots Sharing", "天文观测点分享"),
      description: t(
        "Share and discover great observation locations with the astronomy community. Spots with SIQS scores above 5.0 are recommended for sharing.",
        "与天文社区分享和发现优质观测地点。建议分享SIQS评分高于5.0的观测点。"
      ),
      new: true
    }
  ];
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gradient-blue">
            {t("About AstroWeather", "关于天文天气")}
          </h1>
          
          <Card className="mb-8 border-cosmic-700/30 bg-cosmic-900/60 backdrop-blur">
            <CardHeader>
              <CardTitle>{t("Welcome to AstroWeather", "欢迎使用天文天气")}</CardTitle>
              <CardDescription>
                {t(
                  "AstroWeather is a specialized weather app designed for astronomers and astrophotographers, providing the data you need to plan your observations.",
                  "天文天气是一款专为天文学家和天文摄影师设计的天气应用，提供您规划观测所需的数据。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert">
              <p>
                {t(
                  "Our mission is to help astronomy enthusiasts find the best locations and times for stargazing and astrophotography by providing accurate, astronomy-specific weather and environmental data.",
                  "我们的使命是通过提供准确的、专为天文设计的天气和环境数据，帮助天文爱好者找到最佳的观星和天文摄影地点和时间。"
                )}
              </p>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-6 text-center">
            {t("Key Features", "主要功能")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    {feature.new && (
                      <Badge className="bg-primary/80 text-primary-foreground">
                        {t("New", "新功能")}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mb-8 border-cosmic-700/30 bg-cosmic-950/60">
            <CardHeader>
              <CardTitle>{t("How SIQS Works", "SIQS 如何工作")}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert">
              <p>
                {t(
                  "Our Sky Index Quality Score (SIQS) analyzes multiple factors that affect astronomical observations:",
                  "我们的天空指数质量评分（SIQS）分析影响天文观测的多个因素："
                )}
              </p>
              <ul>
                <li>
                  <strong>{t("Cloud Cover", "云层覆盖")}</strong> - {t("Now separately analyzed for evening (6PM-12AM) and morning (1AM-8AM) periods", "现在分别分析傍晚（18:00-24:00）和早晨（1:00-8:00）时段")}
                </li>
                <li>
                  <strong>{t("Light Pollution", "光污染")}</strong> - {t("Based on the Bortle Scale (1-9)", "基于博特尔等级（1-9）")}
                </li>
                <li>
                  <strong>{t("Seeing Conditions", "视宁度")}</strong> - {t("Atmospheric stability affecting image sharpness", "影响图像清晰度的大气稳定性")}
                </li>
                <li>
                  <strong>{t("Moon Phase", "月相")}</strong> - {t("Impact of moonlight on sky darkness", "月光对天空黑暗度的影响")}
                </li>
                <li>
                  <strong>{t("Wind Speed", "风速")}</strong> - {t("Affects telescope stability", "影响望远镜稳定性")}
                </li>
                <li>
                  <strong>{t("Humidity", "湿度")}</strong> - {t("Can cause dew formation on optics", "可能导致光学元件结露")}
                </li>
                <li>
                  <strong>{t("Air Quality", "空气质量")}</strong> - {t("Impacts visibility and image contrast", "影响可见度和图像对比度")}
                </li>
                <li>
                  <strong>{t("Clear Sky Rate", "晴空率")}</strong> - {t("Historical percentage of clear nights", "历史晴朗夜晚百分比")}
                </li>
              </ul>
              <p>
                {t(
                  "SIQS combines these factors into a single score from 0-10, with higher scores indicating better conditions for astronomy. Locations with scores above 5.0 are generally good for astrophotography.",
                  "SIQS 将这些因素合并为一个从0到10的单一评分，评分越高表示天文条件越好。评分高于5.0的地点通常适合天文摄影。"
                )}
              </p>
            </CardContent>
          </Card>
          
          <div className="text-center text-muted-foreground text-sm mt-12">
            <p>© 2023-2024 AstroWeather</p>
            <p className="mt-2">
              {t(
                "Created with passion for stargazers everywhere.",
                "为全世界的观星者而创建。"
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
