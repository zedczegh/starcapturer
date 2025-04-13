
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoonStar, Shield, Lightbulb, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const DarkSkyKnowledge = () => {
  const { t } = useLanguage();
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
            <MoonStar className="text-purple-400" />
            {t("Dark Sky Knowledge", "暗夜知识")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-cosmic-100 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                {t("What are Dark Sky Preserves?", "什么是暗夜保护区？")}
              </h3>
              <p className="text-sm text-cosmic-200 mb-3">
                {t("Dark Sky Preserves are areas where light pollution is minimized to protect natural darkness. These areas are recognized by the International Dark-Sky Association (IDA) for their exceptional starry nights and commitment to reducing light pollution.", 
                  "暗夜保护区是指光污染被最小化以保护自然黑暗的区域。这些区域因其卓越的星空夜景和减少光污染的承诺而受到国际暗夜协会（IDA）的认可。")}
              </p>
              <p className="text-sm text-cosmic-200">
                {t("There are several types of dark sky designations, including International Dark Sky Parks, Reserves, Sanctuaries, and Communities. Each has specific criteria related to sky darkness, lighting policies, and public education efforts.", 
                  "暗夜区域有多种类型，包括国际暗夜公园、保护区、庇护所和社区。每种类型都有与天空黑暗度、照明政策和公共教育工作相关的特定标准。")}
              </p>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-cosmic-100 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                {t("Why Dark Skies Matter", "为什么暗夜空重要")}
              </h3>
              <p className="text-sm text-cosmic-200 mb-3">
                {t("Light pollution affects not just astronomy, but also wildlife, human health, and energy conservation. Excess light at night disrupts ecosystems, interferes with melatonin production in humans, and wastes billions in energy costs annually.", 
                  "光污染不仅影响天文学，还影响野生动物、人类健康和能源节约。夜间过量的灯光干扰生态系统，影响人体褪黑激素的产生，并每年浪费数十亿的能源成本。")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                  <h4 className="text-xs font-medium text-cosmic-100 mb-1">{t("Wildlife Impact", "对野生动物的影响")}</h4>
                  <p className="text-xs text-cosmic-300">{t("Disrupts migration patterns and affects nocturnal animals", "干扰迁徙模式并影响夜行动物")}</p>
                </div>
                <div className="bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                  <h4 className="text-xs font-medium text-cosmic-100 mb-1">{t("Human Health", "人类健康")}</h4>
                  <p className="text-xs text-cosmic-300">{t("Affects circadian rhythms and sleep quality", "影响生理节律和睡眠质量")}</p>
                </div>
                <div className="bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
                  <h4 className="text-xs font-medium text-cosmic-100 mb-1">{t("Energy Waste", "能源浪费")}</h4>
                  <p className="text-xs text-cosmic-300">{t("Billions wasted on unnecessary lighting", "数十亿浪费在不必要的照明上")}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-cosmic-800/40 rounded-lg border border-cosmic-700/30">
              <div>
                <h4 className="text-sm font-medium text-cosmic-100 mb-1">{t("Learn More", "了解更多")}</h4>
                <p className="text-xs text-cosmic-300">{t("Visit the International Dark-Sky Association for more information", "访问国际暗夜协会获取更多信息")}</p>
              </div>
              <a 
                href="https://www.darksky.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full transition-colors"
              >
                darksky.org
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DarkSkyKnowledge;
