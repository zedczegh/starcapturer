
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, GraduationCap, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutTeam = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-cosmic-400" />
            {t("Our Research Team", "我们的研究团队")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="bg-cosmic-800/30 rounded-lg p-5 border border-cosmic-700/30 transition-all hover:bg-cosmic-800/50 hover:border-cosmic-700/50 mb-6">
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="h-12 w-12 border-2 border-cosmic-700/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                  ZC
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-cosmic-100">Zed_Czegh</h3>
                <p className="text-sm text-cosmic-300">
                  {t("Astrophotography Enthusiast", "天文摄影爱好者")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-xs text-cosmic-400 mt-1">
                <GraduationCap className="h-3 w-3 mr-1.5" />
                {t("MA graduate from UAL, Doctorate student of Fine Arts at Burren College of Arts +AI", 
                   "来自UAL的艺术硕士，伯伦艺术学院艺术博士生+人工智能")}
              </div>
            </div>
          </div>
          
          <div className="mt-8 mb-4">
            <h3 className="text-lg font-medium text-cosmic-100 mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cosmic-400" />
              {t("About Bortle Scale", "关于波特尔量表")}
            </h3>
            <p className="text-sm text-cosmic-300 mb-4">
              {t("The Bortle scale is a nine-level numeric scale that measures the night sky's brightness of a particular location. It quantifies the astronomical observability of celestial objects and the interference caused by light pollution.", 
                 "波特尔量表是一个九级数字量表，用于测量特定位置夜空的亮度。它量化了天体的天文可观测性以及光污染造成的干扰。")}
            </p>
          </div>
          
          <Card className="bg-cosmic-800/20 border-cosmic-700/20 overflow-hidden mt-6">
            <CardHeader className="pb-2 pt-3 bg-gradient-to-r from-cosmic-800/60 to-cosmic-900/60 border-b border-cosmic-700/20">
              <CardTitle className="flex items-center gap-2 text-sm text-cosmic-100">
                {t("SIQS - Stellar Imaging Quality Score", "SIQS - 天文观测质量评分")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-cosmic-300">
                {t("The SIQS (Stellar Imaging Quality Score) is our proprietary rating system that evaluates locations based on their suitability for astrophotography and stargazing.", 
                   "SIQS（天文观测质量评分）是我们专有的评级系统，根据地点对天文摄影和观星的适宜性进行评估。")}
              </p>
              
              <div className="space-y-2 mt-2">
                <h4 className="text-xs font-medium text-cosmic-200">
                  {t("SIQS Calculation Factors", "SIQS计算因素")}
                </h4>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-cosmic-900/40 p-2 rounded border border-cosmic-800/30">
                    <h5 className="font-medium mb-1 text-cosmic-200">{t("Cloud Analysis", "云层分析")}</h5>
                    <p className="text-cosmic-400 text-[10px]">
                      {t("Separate evening (6PM-12AM) and morning (1AM-8AM) cloud cover prediction with weighted importance.", 
                        "分别对傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层覆盖进行加权预测。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-900/40 p-2 rounded border border-cosmic-800/30">
                    <h5 className="font-medium mb-1 text-cosmic-200">{t("Light Pollution", "光污染")}</h5>
                    <p className="text-cosmic-400 text-[10px]">
                      {t("Bortle scale measurements (1-9) show how dark the sky is at your location.", 
                        "波特尔量表测量（1-9）显示您所在位置的天空有多暗。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-900/40 p-2 rounded border border-cosmic-800/30">
                    <h5 className="font-medium mb-1 text-cosmic-200">{t("Clear Sky Rate", "晴空率")}</h5>
                    <p className="text-cosmic-400 text-[10px]">
                      {t("Historical percentage of nights with clear viewing conditions at this location.", 
                        "该位置历史上晴朗观测条件的夜晚百分比。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-900/40 p-2 rounded border border-cosmic-800/30">
                    <h5 className="font-medium mb-1 text-cosmic-200">{t("Weather Conditions", "天气条件")}</h5>
                    <p className="text-cosmic-400 text-[10px]">
                      {t("Wind, humidity, temperature, and seeing conditions that affect image clarity.", 
                        "风速、湿度、温度和视宁度等影响图像清晰度的条件。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-900/40 p-2 rounded border border-cosmic-800/30">
                    <h5 className="font-medium mb-1 text-cosmic-200">{t("Moon Phase", "月相")}</h5>
                    <p className="text-cosmic-400 text-[10px]">
                      {t("Impact of current moon phase on sky brightness and viewing conditions.", 
                        "当前月相对天空亮度和观测条件的影响。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded border border-blue-500/20 mt-3">
                  <h4 className="text-xs font-medium text-cosmic-200 mb-2">
                    {t("Real-Time Updates", "实时更新")}
                  </h4>
                  <ul className="text-[10px] text-cosmic-300 space-y-1.5">
                    <li>• {t("Location quality is constantly recalculated based on changing weather and astronomical conditions", 
                      "根据不断变化的天气和天文条件持续重新计算地点质量")}</li>
                    <li>• {t("Improved location finding with advanced filtering and sorting algorithms", 
                      "通过先进的过滤和排序算法改进位置查找")}</li>
                    <li>• {t("Optimized loading speeds for faster access to global dark sky locations", 
                      "优化加载速度，更快访问全球暗空位置")}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutTeam;
