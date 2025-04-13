
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star, Telescope, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutIntro = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900/80 border-cosmic-700/40 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-blue-400" />
            {t("About Bortle Now", "关于 Bortle Now")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 space-y-5">
          <p className="text-cosmic-200">
            {t("Bortle Now helps astrophotographers find ideal viewing conditions by providing real-time Sky Quality Index (SIQS) scores. Our platform combines light pollution data, weather forecasts, and astronomical conditions to help you plan perfect stargazing sessions.", 
              "Bortle Now 通过提供实时天空质量指数（SIQS）评分，帮助天文摄影师找到理想的观测条件。我们的平台结合了光污染数据、天气预报和天文条件，帮助您规划完美的观星活动。")}
          </p>
          
          {/* New Bortle Now Instructions */}
          <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/40 mt-4">
            <h3 className="text-sm font-medium text-cosmic-100 mb-2 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-400" />
              {t("How to Use Bortle Now", "如何使用 Bortle Now")}
            </h3>
            <p className="text-xs text-cosmic-300 mb-3">
              {t("Bortle Now measures light pollution levels at your location using the Bortle Dark-Sky Scale (1-9):", 
                 "Bortle Now 使用伯特尔暗空量表（1-9）测量您所在位置的光污染水平：")}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/10 p-1.5 rounded-full mt-0.5">
                  <span className="text-xs font-semibold text-blue-400">1</span>
                </div>
                <p className="text-xs text-cosmic-300">
                  {t("Allow access to your device's camera or location to measure light pollution.", 
                     "允许访问您的设备摄像头或位置以测量光污染。")}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/10 p-1.5 rounded-full mt-0.5">
                  <span className="text-xs font-semibold text-blue-400">2</span>
                </div>
                <p className="text-xs text-cosmic-300">
                  {t("For camera-based measurements, point your camera at the night sky in a dark area.", 
                     "对于基于摄像头的测量，将摄像头对准暗区的夜空。")}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/10 p-1.5 rounded-full mt-0.5">
                  <span className="text-xs font-semibold text-blue-400">3</span>
                </div>
                <p className="text-xs text-cosmic-300">
                  {t("Bortle Now will calculate the Bortle scale value (1-9) based on your image or location data.", 
                     "Bortle Now 将根据您的图像或位置数据计算伯特尔量表值（1-9）。")}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/10 p-1.5 rounded-full mt-0.5">
                  <span className="text-xs font-semibold text-blue-400">4</span>
                </div>
                <p className="text-xs text-cosmic-300">
                  {t("Lower numbers (1-3) indicate excellent dark skies, while higher numbers (7-9) indicate high light pollution.", 
                     "较低的数字（1-3）表示极佳的暗空，而较高的数字（7-9）表示较高的光污染。")}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-cosmic-700/20">
              <h4 className="text-xs font-medium text-cosmic-200 mb-2">
                {t("What You'll Get", "您将获得")}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-cosmic-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                  {t("Your location's Bortle scale rating (1-9)", "您所在位置的伯特尔量表评级（1-9）")}
                </li>
                <li className="flex items-center gap-2 text-xs text-cosmic-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                  {t("Estimated number of visible stars", "估计可见星星数量")}
                </li>
                <li className="flex items-center gap-2 text-xs text-cosmic-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                  {t("Recommendations for astrophotography settings", "天文摄影设置建议")}
                </li>
              </ul>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 ${isMobile ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-3 gap-4'} mt-4`}>
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Global Coverage", "全球覆盖")}</h4>
                <p className="text-xs text-cosmic-300">{t("All continents supported", "支持所有大陆")}</p>
              </div>
            </div>
            
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-full">
                <Telescope className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Real-time Data", "实时数据")}</h4>
                <p className="text-xs text-cosmic-300">{t("Always up-to-date", "始终保持最新")}</p>
              </div>
            </div>
            
            <div className={`bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 flex items-center gap-3 ${isMobile ? 'md:col-span-2' : ''}`}>
              <div className="bg-teal-500/10 p-2 rounded-full">
                <Camera className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Mobile Optimized", "移动优化")}</h4>
                <p className="text-xs text-cosmic-300">{t("Use anywhere, anytime", "随时随地使用")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutIntro;
