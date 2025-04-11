
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Stars, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const LocationDiscoverySection = () => {
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
            <Map className="text-cosmic-400" />
            {t("Enhanced Location Discovery", "增强的位置发现")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-4 text-cosmic-200">
            {t("Our advanced location finding algorithm helps you discover both certified dark sky locations and calculated optimal viewing spots worldwide. We use real-time data to sort locations by quality and accessibility.", 
              "我们先进的位置查找算法可帮助您发现全球认证的暗空位置和计算出的最佳观测点。我们使用实时数据按质量和可达性对位置进行排序。")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                <Stars className="h-4 w-4 mr-2 text-indigo-400" />
                {t("Certified Dark Sky Locations", "认证暗空地点")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("Access to all International Dark Sky Association (IDA) certified locations across all continents including previously hard-to-find Asian sites.", 
                  "获取所有国际暗空协会（IDA）认证的地点，包括以前难以找到的亚洲地点。")}
              </p>
            </div>
            
            <div className="bg-cosmic-800/30 p-4 rounded-md border border-cosmic-700/30">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                <Compass className="h-4 w-4 mr-2 text-green-400" />
                {t("Calculated Optimal Viewing", "计算最佳观测点")}
              </h4>
              <p className="text-sm text-cosmic-200">
                {t("Our algorithm calculates locations with optimal viewing conditions based on light pollution levels, terrain features, and accessibility.", 
                  "我们的算法根据光污染水平、地形特征和可达性计算出具有最佳观测条件的位置。")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LocationDiscoverySection;
