
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, MoonIcon, CloudSun, Info, Award, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AboutContent = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center mb-8">
          <Star className="mr-2 text-yellow-400" />
          <h1 className="text-4xl font-bold text-white">
            {t("About SIQS", "关于SIQS")}
          </h1>
        </div>

        <div className="bg-cosmic-800/60 backdrop-blur-md rounded-xl p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t("What is the Stellar Imaging Quality Score?", "什么是恒星成像质量评分?")}
          </h2>
          
          <p className="text-cosmic-100 mb-6">
            {t(
              "SIQS (Stellar Imaging Quality Score) is a comprehensive metric designed to evaluate and predict the quality of astronomical imaging conditions at a specific location.",
              "SIQS（恒星成像质量评分）是一个综合指标，旨在评估和预测特定位置的天文成像条件质量。"
            )}
          </p>
          
          <p className="text-cosmic-100 mb-6">
            {t(
              "Unlike traditional measurements that focus on only one aspect (like seeing or transparency), SIQS combines multiple environmental factors to give astrophotographers a reliable prediction of imaging quality.",
              "与仅关注一个方面（如视宁度或透明度）的传统测量不同，SIQS结合了多种环境因素，为天文摄影师提供可靠的成像质量预测。"
            )}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            <InfoCard 
              icon={<MoonIcon className="h-8 w-8 text-blue-400" />}
              title={t("Dark Skies", "暗空")}
              description={t(
                "SIQS evaluates light pollution using the Bortle scale and other factors to determine sky darkness quality.",
                "SIQS使用波特尔量表和其他因素评估光污染，以确定天空暗度质量。"
              )}
            />
            
            <InfoCard 
              icon={<CloudSun className="h-8 w-8 text-yellow-400" />}
              title={t("Weather Conditions", "天气状况")}
              description={t(
                "Cloud cover, humidity, wind, and other atmospheric conditions are analyzed for their impact on imaging.",
                "分析云量、湿度、风力和其他大气条件对成像的影响。"
              )}
            />
            
            <InfoCard 
              icon={<Star className="h-8 w-8 text-purple-400" />}
              title={t("Astronomical Factors", "天文因素")}
              description={t(
                "Moon phase, seeing conditions, and seasonal variations are considered in the final score.",
                "月相、视宁度和季节变化都会影响最终评分。"
              )}
            />
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-cosmic-800/60 backdrop-blur-md rounded-xl p-8 shadow-lg mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Award className="mr-2 text-yellow-400" />
            {t("How SIQS Works", "SIQS如何工作")}
          </h2>
          
          <p className="text-cosmic-100 mb-6">
            {t(
              "SIQS uses a sophisticated algorithm that processes real-time and historical data from multiple sources. The score ranges from 0 to 10, with higher numbers indicating better imaging conditions.",
              "SIQS使用一种复杂的算法，处理来自多个来源的实时和历史数据。分数范围从0到10，数字越高表示成像条件越好。"
            )}
          </p>
          
          <h3 className="text-xl font-semibold text-white mt-6 mb-3">
            {t("Key Factors in SIQS Calculation:", "SIQS计算中的关键因素：")}
          </h3>
          
          <ul className="list-disc pl-6 text-cosmic-100 space-y-2 mb-6">
            <li>{t("Light pollution (Bortle scale)", "光污染（波特尔量表）")}</li>
            <li>{t("Cloud cover percentage", "云量百分比")}</li>
            <li>{t("Atmospheric seeing conditions", "大气视宁度条件")}</li>
            <li>{t("Humidity levels", "湿度水平")}</li>
            <li>{t("Wind speed", "风速")}</li>
            <li>{t("Moon phase and elevation", "月相和高度")}</li>
            <li>{t("Air quality and transparency", "空气质量和透明度")}</li>
            <li>{t("Elevation and terrain", "海拔和地形")}</li>
          </ul>
          
          <p className="text-cosmic-100">
            {t(
              "Our night forecast analysis examines hourly predictions from sunset to sunrise, providing specialized scores for evening and morning astronomical sessions.",
              "我们的夜间预报分析检查了从日落到日出的每小时预测，为晚上和早晨的天文观测会话提供专门的评分。"
            )}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-cosmic-800/60 backdrop-blur-md rounded-xl p-8 shadow-lg mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Lightbulb className="mr-2 text-yellow-400" />
            {t("Using SIQS Effectively", "有效使用SIQS")}
          </h2>
          
          <div className="space-y-4 text-cosmic-100">
            <p>
              {t(
                "SIQS is most valuable when used as a planning tool for your astrophotography sessions. Here's how to get the most from your SIQS data:",
                "SIQS作为天文摄影会话的规划工具最有价值。以下是如何充分利用您的SIQS数据："
              )}
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-4">
              {t("Score Interpretation", "分数解释")}
            </h3>
            
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <span className="text-green-400 font-semibold">8-10:</span> {t("Excellent conditions for all types of astrophotography", "适合所有类型天文摄影的极佳条件")}
              </li>
              <li>
                <span className="text-green-300 font-semibold">6-7.9:</span> {t("Very good conditions, suitable for most imaging", "非常好的条件，适合大多数成像")}
              </li>
              <li>
                <span className="text-yellow-300 font-semibold">4-5.9:</span> {t("Good conditions with some limitations", "有一些限制的良好条件")}
              </li>
              <li>
                <span className="text-orange-400 font-semibold">2-3.9:</span> {t("Fair conditions, best for bright objects", "一般条件，最适合明亮的天体")}
              </li>
              <li>
                <span className="text-red-400 font-semibold">0-1.9:</span> {t("Poor conditions, not recommended for imaging", "不良条件，不推荐成像")}
              </li>
            </ul>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button asChild className="bg-cosmic-600 hover:bg-cosmic-500">
              <Link to="/">
                <Star className="w-4 h-4 mr-2" />
                {t("Try SIQS Calculator", "尝试SIQS计算器")}
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const InfoCard = ({ icon, title, description }: InfoCardProps) => {
  return (
    <div className="bg-cosmic-700/60 p-6 rounded-lg shadow-md border border-cosmic-600/40 hover:border-cosmic-500/60 transition-all">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white text-center mb-3">{title}</h3>
      <p className="text-cosmic-100 text-center">{description}</p>
    </div>
  );
};

export default AboutContent;
