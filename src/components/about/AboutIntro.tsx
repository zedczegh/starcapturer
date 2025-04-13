
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star, Telescope } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutIntro = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-blue-400" />
            {t("About Bortle Now", "关于 Bortle Now")}
          </CardTitle>
        </CardHeader>
        <CardContent className={`p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30 ${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className="mb-4 text-cosmic-200">
                {t("Bortle Now helps astrophotographers find ideal viewing conditions by providing real-time Sky Quality Index (SIQS) scores. Our platform combines light pollution data, weather forecasts, and astronomical conditions to help you plan perfect stargazing sessions.", 
                  "Bortle Now 通过提供实时天空质量指数（SIQS）评分，帮助天文摄影师找到理想的观测条件。我们的平台结合了光污染数据、天气预报和天文条件，帮助您规划完美的观星活动。")}
              </p>
              <p className="text-cosmic-200">
                {t("We're passionate about making astronomy accessible to everyone, from beginners to professionals. Our 2025 goal is to create the world's largest community of stargazers who can share their experiences and dark sky locations.", 
                  "我们热衷于让天文学变得人人可及，从初学者到专业人士。我们2025年的目标是创建全球最大的观星者社区，人们可以在这里分享他们的经验和暗空地点。")}
              </p>
            </div>
            {!isMobile && (
              <div className="hidden md:flex md:flex-col md:justify-center md:items-center md:space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl transform -translate-y-1/2 translate-x-1/2" />
                  <Star size={48} className="text-blue-400 relative z-10" />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl transform translate-y-1/3" />
                  <Telescope size={48} className="text-purple-400 relative z-10" />
                </div>
              </div>
            )}
          </div>
          
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-3'} gap-4 mt-4 bg-cosmic-800/20 p-4 rounded-xl border border-cosmic-700/20`}>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <Star size={isMobile ? 20 : 24} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Global Coverage", "全球覆盖")}</h4>
                <p className="text-xs text-cosmic-300">{t("All continents supported", "支持所有大陆")}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 p-2 rounded-full">
                <Telescope size={isMobile ? 20 : 24} className="text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Real-time Data", "实时数据")}</h4>
                <p className="text-xs text-cosmic-300">{t("Always up-to-date", "始终保持最新")}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-teal-500/10 p-2 rounded-full">
                <Sparkles size={isMobile ? 20 : 24} className="text-teal-400" />
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
