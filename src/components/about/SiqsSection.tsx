
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stars, CloudSun, Sun, CloudSnow, Moon, Camera, Telescope, Navigation } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const SiqsSection = () => {
  const { t } = useLanguage();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stars className="text-cosmic-400" />
            {t("SIQS - Stellar Imaging Quality Score", "SIQS - 天文观测质量评分")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-4 text-cosmic-200">
            {t("The SIQS (Stellar Imaging Quality Score) is our proprietary rating system that evaluates locations based on their suitability for astrophotography and stargazing.", 
              "SIQS（天文观测质量评分）是我们专有的评级系统，根据地点对天文摄影和观星的适宜性进行评估。")}
          </p>
          
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-3 text-cosmic-100">
              {t("SIQS Calculation Factors", "SIQS计算因素")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                <CloudSun className="h-5 w-5 mr-2 mt-0.5 text-sky-400 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-cosmic-100">{t("Cloud Analysis", "云层分析")}</h5>
                  <p className="text-xs text-cosmic-300 mt-1">
                    {t("Separate evening (6PM-12AM) and morning (1AM-8AM) cloud cover prediction with weighted importance.", 
                      "分别对傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层覆盖进行加权预测。")}
                  </p>
                </div>
              </div>
              
              <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                <Stars className="h-5 w-5 mr-2 mt-0.5 text-indigo-400 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-cosmic-100">{t("Light Pollution", "光污染")}</h5>
                  <p className="text-xs text-cosmic-300 mt-1">
                    {t("Bortle scale measurements (1-9) show how dark the sky is at your location.", 
                      "波特尔量表测量（1-9）显示您所在位置的天空有多暗。")}
                  </p>
                </div>
              </div>
              
              <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                <Sun className="h-5 w-5 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-cosmic-100">{t("Clear Sky Rate", "晴空率")}</h5>
                  <p className="text-xs text-cosmic-300 mt-1">
                    {t("Historical percentage of nights with clear viewing conditions at this location.", 
                      "该位置历史上晴朗观测条件的夜晚百分比。")}
                  </p>
                </div>
              </div>
              
              <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                <CloudSnow className="h-5 w-5 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-cosmic-100">{t("Weather Conditions", "天气条件")}</h5>
                  <p className="text-xs text-cosmic-300 mt-1">
                    {t("Wind, humidity, temperature, and seeing conditions that affect image clarity.", 
                      "风速、湿度、温度和视宁度等影响图像清晰度的条件。")}
                  </p>
                </div>
              </div>
              
              <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                <Moon className="h-5 w-5 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-medium text-cosmic-100">{t("Moon Phase", "月相")}</h5>
                  <p className="text-xs text-cosmic-300 mt-1">
                    {t("Impact of current moon phase on sky brightness and viewing conditions.", 
                      "当前月相对天空亮度和观测条件的影响。")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-md border border-blue-500/20">
            <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
              <Camera className="h-4 w-4 mr-1.5 text-blue-400" />
              {t("Real-Time Updates", "实时更新")}
            </h4>
            <ul className="space-y-2 text-sm text-cosmic-200">
              <li className="flex items-start">
                <Telescope className="h-4 w-4 mr-2 mt-0.5 text-purple-400 flex-shrink-0" />
                <span>
                  {t("Location quality is constantly recalculated based on changing weather and astronomical conditions", 
                    "根据不断变化的天气和天文条件持续重新计算地点质量")}
                </span>
              </li>
              <li className="flex items-start">
                <CloudSun className="h-4 w-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                <span>
                  {t("Improved location finding with advanced filtering and sorting algorithms", 
                    "通过先进的过滤和排序算法改进位置查找")}
                </span>
              </li>
              <li className="flex items-start">
                <Navigation className="h-4 w-4 mr-2 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>
                  {t("Optimized loading speeds for faster access to global dark sky locations", 
                    "优化加载速度，更快访问全球暗空位置")}
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SiqsSection;
