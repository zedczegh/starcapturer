
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const PhotoPointsFeature = () => {
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
            <Camera className="text-teal-400" />
            {t("Photo Points Explorer", "摄影点探索器")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="space-y-5">
            <p className="text-cosmic-200">
              {t(
                "The Photo Points feature is designed to help astrophotographers find ideal locations for night sky photography. It combines SIQS data with terrain information to identify spots with minimal light pollution and optimal visibility.",
                "摄影点功能旨在帮助天文摄影师找到夜空摄影的理想位置。它将SIQS数据与地形信息相结合，以识别光污染最小和能见度最佳的地点。"
              )}
            </p>
            
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-3'} mt-4 bg-cosmic-800/20 p-4 rounded-lg border border-cosmic-700/20`}>
              <div className="flex flex-col gap-2">
                <div className="bg-blue-500/10 p-2 rounded-full w-10 h-10 flex items-center justify-center">
                  <MapPin size={20} className="text-blue-400" />
                </div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Curated Locations", "精选位置")}</h4>
                <p className="text-xs text-cosmic-300">{t("Includes official dark sky preserves and community recommendations", "包括官方认证的暗夜保护区和社区推荐")}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center">
                  <Star size={20} className="text-primary" />
                </div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("SIQS Ratings", "SIQS评分")}</h4>
                <p className="text-xs text-cosmic-300">{t("Each location is rated with our Sky Quality Index to help you plan", "每个位置都使用我们的天空质量指数进行评分，以帮助您规划")}</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="bg-teal-500/10 p-2 rounded-full w-10 h-10 flex items-center justify-center">
                  <Camera size={20} className="text-teal-400" />
                </div>
                <h4 className="text-sm font-medium text-cosmic-100">{t("Photographer Tips", "摄影师提示")}</h4>
                <p className="text-xs text-cosmic-300">{t("Access to angles, elevation data, and best times to visit", "获取角度、海拔数据和最佳参观时间")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PhotoPointsFeature;
