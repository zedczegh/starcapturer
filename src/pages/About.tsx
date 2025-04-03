
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Sun, Stars, Gauge, Map, Droplets, Wind, Moon, Activity } from "lucide-react";

const AboutPage = () => {
  const { t, language } = useLanguage();
  
  const features = [
    {
      title: t("Sky Index Quality Score (SIQS)", "天空指数质量评分 (SIQS)"),
      description: t(
        "SIQS is our proprietary scoring system that combines multiple factors to rate how suitable a location is for astronomy and astrophotography. It includes cloud cover, light pollution, seeing conditions, and more.",
        "SIQS是我们的专有评分系统，结合多个因素来评价一个地点对天文观测和天文摄影的适宜程度。它包括云量、光污染、视宁度等多项指标。"
      ),
      icon: <Gauge className="h-5 w-5 text-primary" />,
      new: false
    },
    {
      title: t("Enhanced Nighttime Cloud Cover Analysis", "增强的夜间云量分析"),
      description: t(
        "Our system now analyzes cloud cover separately for evening (6PM-12AM) and morning (1AM-8AM) to provide more accurate SIQS scores based on when you'll actually be observing.",
        "我们的系统现在分别分析傍晚（18:00-24:00）和早晨（1:00-8:00）的云量，根据您实际观测的时间提供更准确的SIQS评分。"
      ),
      icon: <CloudSun className="h-5 w-5 text-sky-400" />,
      new: true
    },
    {
      title: t("Annual Clear Sky Rate", "年均晴空率"),
      description: t(
        "We now include historical clear sky rate data to help you understand how often a location typically has clear skies suitable for astronomy throughout the year.",
        "我们现在包含历史晴空率数据，帮助您了解全年中某一地点通常有多少时间拥有适合天文观测的晴朗天空。"
      ),
      icon: <Sun className="h-5 w-5 text-yellow-400" />,
      new: true
    },
    {
      title: t("Dynamic Bortle Scale", "动态博特尔等级"),
      description: t(
        "Our app now automatically calculates the Bortle Scale (light pollution level) for any location globally, with enhanced accuracy for China and major cities worldwide.",
        "我们的应用现在可以自动计算全球任何地点的博特尔等级（光污染水平），对中国和全球主要城市提供更高的准确度。"
      ),
      icon: <Stars className="h-5 w-5 text-indigo-400" />,
      new: true
    },
    {
      title: t("Weather Forecasts", "天气预报"),
      description: t(
        "Get detailed hourly and 15-day forecasts specifically optimized for astronomy, highlighting the best viewing periods based on cloud cover and other conditions.",
        "获取专为天文观测优化的详细每小时和15天预报，突出显示基于云量和其他条件的最佳观测时段。"
      ),
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      new: false
    },
    {
      title: t("AstroSpots Sharing", "天文观测点分享"),
      description: t(
        "Share and discover great observation locations with the astronomy community. Spots with SIQS scores above 5.0 are recommended for sharing.",
        "与天文社区分享和发现优质观测地点。建议分享SIQS评分高于5.0的观测点。"
      ),
      icon: <Map className="h-5 w-5 text-rose-400" />,
      new: true
    }
  ];
  
  const factors = [
    {
      name: t("Cloud Cover", "云层覆盖"),
      description: t("Nighttime cloud coverage with separate evening/morning analysis", "夜间云层覆盖率，分别分析傍晚和清晨时段"),
      icon: <CloudSun className="h-5 w-5 text-sky-400" />,
      weight: "30%"
    },
    {
      name: t("Light Pollution", "光污染"),
      description: t("Based on Bortle Scale (1-9) with improved global modeling", "基于博特尔等级（1-9），拥有改进的全球建模"),
      icon: <Stars className="h-5 w-5 text-indigo-400" />,
      weight: "25%"
    },
    {
      name: t("Clear Sky Rate", "晴空率"),
      description: t("Historical annual clear sky percentage", "历史年均晴空百分比"),
      icon: <Sun className="h-5 w-5 text-yellow-400" />,
      weight: "10%"
    },
    {
      name: t("Humidity", "湿度"),
      description: t("Affects dew formation on optics", "影响光学元件结露"),
      icon: <Droplets className="h-5 w-5 text-blue-400" />,
      weight: "10%"
    },
    {
      name: t("Wind", "风速"),
      description: t("Affects telescope stability", "影响望远镜稳定性"),
      icon: <Wind className="h-5 w-5 text-teal-400" />,
      weight: "10%"
    },
    {
      name: t("Moon Phase", "月相"),
      description: t("Impact of moonlight on sky darkness", "月光对天空黑暗度的影响"),
      icon: <Moon className="h-5 w-5 text-slate-400" />,
      weight: "15%"
    }
  ];
  
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-center mb-8 text-gradient-blue">
              {t("About AstroWeather", "关于天文天气")}
            </h1>
          </motion.div>
          
          <Card className="mb-8 border-cosmic-700/30 bg-cosmic-900/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{t("Welcome to AstroWeather", "欢迎使用天文天气")}</CardTitle>
              <CardDescription className="text-base">
                {t(
                  "AstroWeather is a specialized weather app designed for astronomers and astrophotographers, providing the data you need to plan your observations.",
                  "天文天气是一款专为天文学家和天文摄影师设计的天气应用，提供您规划观测所需的数据。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert">
              <p className="text-lg text-muted-foreground">
                {t(
                  "Our mission is to help astronomy enthusiasts find the best locations and times for stargazing and astrophotography by providing accurate, astronomy-specific weather and environmental data.",
                  "我们的使命是通过提供准确的、专为天文设计的天气和环境数据，帮助天文爱好者找到最佳的观星和天文摄影地点和时间。"
                )}
              </p>
            </CardContent>
          </Card>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              {t("Key Features", "主要功能")}
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 h-full shadow-md hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {feature.icon}
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </div>
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
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mb-8 border-cosmic-700/30 bg-cosmic-950/60 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-6 w-6 text-primary" />
                  {t("How SIQS Works", "SIQS 如何工作")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  {t(
                    "Our Sky Index Quality Score (SIQS) analyzes multiple factors that affect astronomical observations. Each factor is weighted according to its importance for optimal viewing conditions.",
                    "我们的天空指数质量评分（SIQS）分析影响天文观测的多个因素。每个因素根据其对最佳观测条件的重要性进行加权。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {factors.map((factor, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-cosmic-800/20 border border-cosmic-700/30">
                      <div className="mt-1">{factor.icon}</div>
                      <div>
                        <h3 className="font-medium text-lg mb-1 flex items-center justify-between">
                          {factor.name}
                          <span className="ml-2 text-sm bg-primary/20 text-primary-foreground px-2 py-0.5 rounded">
                            {factor.weight}
                          </span>
                        </h3>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/40">
                  <h3 className="font-medium text-lg mb-2">{t("SIQS Score Range", "SIQS 评分范围")}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-center">
                      <div className="text-lg font-medium text-red-500">0-2</div>
                      <div className="text-xs mt-1">{t("Poor", "较差")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-orange-500">2-4</div>
                      <div className="text-xs mt-1">{t("Fair", "一般")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-yellow-500">4-6</div>
                      <div className="text-xs mt-1">{t("Good", "良好")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-blue-500">6-8</div>
                      <div className="text-xs mt-1">{t("Very Good", "很好")}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium text-green-500">8-10</div>
                      <div className="text-xs mt-1">{t("Excellent", "优秀")}</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-cosmic-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <p className="mt-6 text-muted-foreground">
                  {t(
                    "SIQS combines these factors into a single score from 0-10, with higher scores indicating better conditions for astronomy. Locations with scores above 5.0 are generally good for astrophotography.",
                    "SIQS 将这些因素合并为一个从0到10的单一评分，评分越高表示天文条件越好。评分高于5.0的地点通常适合天文摄影。"
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
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
