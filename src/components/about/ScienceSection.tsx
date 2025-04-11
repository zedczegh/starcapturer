
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Microscope } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const ScienceSection = () => {
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
            <Microscope className="text-cosmic-400" />
            {t("Scientific Algorithm", "科学算法")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-4 text-cosmic-200">
            {t("Our algorithm uses state-of-the-art machine learning to analyze 15 environmental factors including light pollution, cloud cover, and terrain elevation. We've enhanced it with terrain-specific calculations that adjust for mountains, valleys, and urban light diffusion patterns.", 
              "我们的算法使用最先进的机器学习分析15个环境因素，包括光污染、云层覆盖和地形高度。我们通过地形特定计算增强了它，根据山脉、山谷和城市光扩散模式进行调整。")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                {t("Enhanced Terrain Analysis", "增强的地形分析")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("Our updated algorithm now incorporates topographical data to adjust Bortle scale calculations based on elevation changes, mountain shadows, and natural barriers.", 
                  "我们更新的算法现在结合了地形数据，根据高度变化、山影和自然屏障调整Bortle等级计算。")}
              </p>
            </div>
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                {t("Light Diffusion Modeling", "光扩散建模")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("We now model light pollution diffusion patterns with greater accuracy, accounting for atmospheric conditions and regional variations in light sources.", 
                  "我们现在以更高的精度模拟光污染扩散模式，考虑大气条件和光源的区域差异。")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScienceSection;
