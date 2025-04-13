
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star, Telescope } from "lucide-react";
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
                <Sparkles className="h-5 w-5 text-teal-400" />
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
