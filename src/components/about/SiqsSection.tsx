
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stars, BookOpen, Calendar, ArrowUpRight, ChevronRight, Binary, Compass } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const SiqsSection = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
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
            <Stars className="text-cosmic-400" />
            {t("Our Tools and Resources", "我们的工具和资源")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 transition-all hover:bg-cosmic-800/40 group">
              <div className="flex items-center mb-3">
                <div className="bg-blue-900/30 p-1.5 rounded mr-2.5">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-cosmic-100 font-medium">
                  {t("Useful Links Collection", "实用链接集合")}
                </h3>
              </div>
              <p className="text-xs text-cosmic-300 mb-3.5">
                {t("Our curated collection of resources, tools, and websites for astronomy enthusiasts.", 
                   "我们为天文爱好者策划的资源、工具和网站集合。")}
              </p>
              <Link to="/useful-links">
                <Button size="sm" variant="secondary" className="w-full text-xs group-hover:bg-blue-600/20 transition-all">
                  {t("Explore Resources", "探索资源")}
                  <ArrowUpRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 transition-all hover:bg-cosmic-800/40 group">
              <div className="flex items-center mb-3">
                <div className="bg-purple-900/30 p-1.5 rounded mr-2.5">
                  <Binary className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-cosmic-100 font-medium">
                  {t("SIQS Calculator", "SIQS计算器")}
                </h3>
              </div>
              <p className="text-xs text-cosmic-300 mb-3.5">
                {t("Calculate the Stellar Imaging Quality Score for any location to determine stargazing potential.", 
                   "计算任何位置的恒星成像质量评分，以确定观星潜力。")}
              </p>
              <Link to="/siqs">
                <Button size="sm" variant="secondary" className="w-full text-xs group-hover:bg-purple-600/20 transition-all">
                  {t("Open SIQS Calculator", "打开SIQS计算器")}
                  <ArrowUpRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-5 space-y-3">
            <div className="bg-cosmic-800/20 border border-cosmic-700/30 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-cosmic-800/60 to-cosmic-900/60 px-4 py-2.5 border-b border-cosmic-700/20">
                <h3 className="text-sm font-medium text-cosmic-100 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                  {t("Latest Updates", "最新更新")}
                </h3>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="bg-cosmic-900/40 p-2.5 rounded border border-cosmic-800/30 flex items-start">
                  <div className="mt-0.5">
                    <ChevronRight className="h-3.5 w-3.5 text-blue-400 mr-1" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cosmic-200">{t("Tools & Resources", "工具和资源")}</p>
                    <p className="text-xs text-cosmic-300">{t("Added 70+ new astronomy resources and links", "新增70多个天文资源和链接")}</p>
                  </div>
                </div>
                
                <div className="bg-cosmic-900/40 p-2.5 rounded border border-cosmic-800/30 flex items-start">
                  <div className="mt-0.5">
                    <ChevronRight className="h-3.5 w-3.5 text-purple-400 mr-1" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cosmic-200">{t("SIQS System", "SIQS系统")}</p>
                    <p className="text-xs text-cosmic-300">{t("Improved algorithm for more accurate sky quality prediction", "改进算法，提高天空质量预测准确性")}</p>
                  </div>
                </div>
                
                <div className="bg-cosmic-900/40 p-2.5 rounded border border-cosmic-800/30 flex items-start">
                  <div className="mt-0.5">
                    <ChevronRight className="h-3.5 w-3.5 text-green-400 mr-1" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-cosmic-200">{t("Location Discovery", "位置发现")}</p>
                    <p className="text-xs text-cosmic-300">{t("Enhanced search radius for finding optimal viewing spots", "增强搜索半径以寻找最佳观测点")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-5 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30">
            <div className="flex items-center gap-4">
              <div className="bg-cosmic-800/40 p-2 rounded-full">
                <Compass className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-cosmic-100 mb-1">
                  {t("Discover Dark Sky Locations", "发现暗空位置")}
                </h3>
                <p className="text-xs text-cosmic-300">
                  {t("Find certified dark sky preserves and optimal locations for astrophotography near you.", 
                     "在您附近寻找经认证的暗空保护区和天文摄影的最佳位置。")}
                </p>
              </div>
              <Link to="/photo-points">
                <Button size="sm" className="bg-cosmic-700 hover:bg-cosmic-600">
                  {t("Explore Map", "探索地图")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SiqsSection;
