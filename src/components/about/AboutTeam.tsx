
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const AboutTeam = () => {
  const { t } = useLanguage();
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // SIQS color scale for demonstration
  const siqsColorLevels = [
    { score: "8-10", color: "bg-green-500", description: t("Excellent", "极佳"), colorName: t("Green", "绿色") },
    { score: "6-7.9", color: "bg-blue-500", description: t("Good", "良好"), colorName: t("Blue", "蓝色") },
    { score: "5-5.9", color: "bg-olive-500", description: t("Above Average", "较好"), colorName: t("Olive", "橄榄色") },
    { score: "4-4.9", color: "bg-yellow-500", description: t("Average", "一般"), colorName: t("Yellow", "黄色") },
    { score: "2-3.9", color: "bg-orange-500", description: t("Poor", "较差"), colorName: t("Orange", "橙色") },
    { score: "0-1.9", color: "bg-red-500", description: t("Bad", "糟糕"), colorName: t("Red", "红色") }
  ];

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900/80 border-cosmic-700/40 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="text-cosmic-400" />
            {t("Our Team & SIQS System", "我们的团队和SIQS系统")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/20 to-cosmic-900/20 space-y-6">
          {/* Team Member */}
          <div className="bg-cosmic-800/30 rounded-lg p-4 border border-cosmic-700/30 transition-all hover:bg-cosmic-800/40">
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="h-12 w-12 border-2 border-cosmic-700/50">
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                  ZC
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-cosmic-100">Zed_Czegh</h3>
                <p className="text-sm text-cosmic-300">
                  {t("Professional fine art producer", "专业艺术制作人")}
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs text-cosmic-400">
              <GraduationCap className="h-3.5 w-3.5 mr-2" />
              {t("Camberwell College of Arts MA, Amateur Astronomer, Tibetologist, Loving husband and father of 1", 
                 "坎伯韦尔艺术学院硕士，业余天文学家，藏学家，慈爱的丈夫和1个孩子的父亲")}
            </div>
          </div>
          
          {/* SIQS Information */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-cosmic-100 mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cosmic-400" />
              {t("SIQS - Stellar Imaging Quality Score", "SIQS - 天文观测质量评分")}
            </h3>
            
            <p className="text-sm text-cosmic-300 mb-4">
              {t("The SIQS (Stellar Imaging Quality Score) is our proprietary rating system that evaluates locations based on their suitability for astrophotography and stargazing.", 
                 "SIQS（天文观测质量评分）是我们专有的评级系统，根据地点对天文摄影和观星的适宜性进行评估。")}
            </p>
            
            {/* New SIQS Color Scale Visual Guide */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-cosmic-200 flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-green-400 to-blue-400"></span>
                {t("SIQS Color Scale Guide", "SIQS颜色比例指南")}
              </h4>
              
              <div className="bg-cosmic-800/40 p-4 rounded-lg border border-cosmic-700/30">
                <p className="text-xs text-cosmic-300 mb-3">
                  {t("Our SIQS system uses a color-coded scale from 0-10 to help you quickly visualize location quality:", 
                     "我们的SIQS系统使用0-10的彩色编码比例尺，帮助您快速直观地了解位置质量：")}
                </p>
                
                <div className="space-y-2.5">
                  {siqsColorLevels.map((level, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1/6 shrink-0">
                        <span className="text-xs font-medium text-cosmic-200">{level.score}</span>
                      </div>
                      <div className="w-2/6">
                        <Progress value={100} className={`h-3 ${level.color}`} />
                      </div>
                      <div className="w-3/6">
                        <span className="text-xs text-cosmic-300">
                          {level.description} <span className="opacity-70">({level.colorName})</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-cosmic-400 mt-3 italic">
                  {t("Higher scores (greener colors) indicate better conditions for astrophotography.", 
                     "较高的分数（绿色系）表示更适合天文摄影的条件。")}
                </p>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <h4 className="text-sm font-medium text-cosmic-200">
                {t("SIQS Calculation Factors", "SIQS计算因素")}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                  <h5 className="font-medium text-xs mb-1 text-cosmic-200">{t("Cloud Analysis", "云层分析")}</h5>
                  <p className="text-cosmic-400 text-xs">
                    {t("Separate evening (6PM-12AM) and morning (1AM-8AM) cloud cover prediction with weighted importance.", 
                      "分别对傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层覆盖进行加权预测。")}
                  </p>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                  <h5 className="font-medium text-xs mb-1 text-cosmic-200">{t("Light Pollution", "光污染")}</h5>
                  <p className="text-cosmic-400 text-xs">
                    {t("Bortle scale measurements (1-9) show how dark the sky is at your location.", 
                      "波特尔量表测量（1-9）显示您所在位置的天空有多暗。")}
                  </p>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                  <h5 className="font-medium text-xs mb-1 text-cosmic-200">{t("Clear Sky Rate", "晴空率")}</h5>
                  <p className="text-cosmic-400 text-xs">
                    {t("Historical percentage of nights with clear viewing conditions at this location.", 
                      "该位置历史上晴朗观测条件的夜晚百分比。")}
                  </p>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                  <h5 className="font-medium text-xs mb-1 text-cosmic-200">{t("Weather Conditions", "天气条件")}</h5>
                  <p className="text-cosmic-400 text-xs">
                    {t("Wind, humidity, temperature, and seeing conditions that affect image clarity.", 
                      "风速、湿度、温度和视宁度等影响图像清晰度的条件。")}
                  </p>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30 md:col-span-2">
                  <h5 className="font-medium text-xs mb-1 text-cosmic-200">{t("Moon Phase", "月相")}</h5>
                  <p className="text-cosmic-400 text-xs">
                    {t("Impact of current moon phase on sky brightness and viewing conditions.", 
                      "当前月相对天空亮度和观测条件的影响。")}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded border border-blue-500/20 mt-4">
                <h4 className="text-xs font-medium text-cosmic-200 mb-2">
                  {t("Real-Time Updates", "实时更新")}
                </h4>
                <ul className="text-xs text-cosmic-300 space-y-1.5">
                  <li>• {t("Location quality is constantly recalculated based on changing weather and astronomical conditions", 
                    "根据不断变化的天气和天文条件持续重新计算地点质量")}</li>
                  <li>• {t("Improved location finding with advanced filtering and sorting algorithms", 
                    "通过先进的过滤和排序算法改进位置查找")}</li>
                  <li>• {t("Optimized loading speeds for faster access to global dark sky locations", 
                    "优化加载速度，更快访问全球暗空位置")}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutTeam;
