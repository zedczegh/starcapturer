
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
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
            <BarChart className="text-cosmic-400" />
            {t("Advanced Sky Quality Index", "先进的天空质量指数")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-4 text-cosmic-200">
            {t("Our SIQS (Sky Quality Index) combines multiple data sources to give you the most accurate prediction of stargazing conditions. The enhanced algorithm now accounts for seasonal variations and provides more accurate scoring in remote regions.", 
              "我们的SIQS（天空质量指数）结合多个数据源，为您提供最准确的观星条件预测。增强的算法现在考虑季节变化，并在偏远地区提供更准确的评分。")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                {t("Dynamic Factor Weighting", "动态因素权重")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("Our enhanced algorithm now uses dynamic factor weighting that adapts to geographic regions and seasonal conditions for more accurate predictions.", 
                  "我们增强的算法现在使用动态因素权重，适应地理区域和季节条件，以提供更准确的预测。")}
              </p>
            </div>
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                {t("Multi-day Forecasting", "多日预报")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("Plan your stargazing sessions days in advance with our multi-day forecast that predicts optimal viewing windows based on all environmental factors.", 
                  "基于所有环境因素预测最佳观测窗口，提前几天规划您的观星活动。")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SiqsSection;
