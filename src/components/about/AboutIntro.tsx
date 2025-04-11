
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const AboutIntro = () => {
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
            <Sparkles className="text-cosmic-400" />
            {t("About Bortle Now", "关于 Bortle Now")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-4 text-cosmic-200">
            {t("Bortle Now helps astrophotographers find ideal viewing conditions by providing real-time Sky Quality Index (SIQS) scores. Our platform combines light pollution data, weather forecasts, and astronomical conditions to help you plan perfect stargazing sessions.", 
              "Bortle Now 通过提供实时天空质量指数（SIQS）评分，帮助天文摄影师找到理想的观测条件。我们的平台结合了光污染数据、天气预报和天文条件，帮助您规划完美的观星活动。")}
          </p>
          <p className="text-cosmic-200">
            {t("We're passionate about making astronomy accessible to everyone, from beginners to professionals. Our 2025 goal is to create the world's largest community of stargazers who can share their experiences and dark sky locations.", 
              "我们热衷于让天文学变得人人可及，从初学者到专业人士。我们2025年的目标是创建全球最大的观星者社区，人们可以在这里分享他们的经验和暗空地点。")}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutIntro;
