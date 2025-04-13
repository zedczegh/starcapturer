
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stars, BookOpen, Calendar, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
            <Stars className="text-cosmic-400" />
            {t("Our Tools and Resources", "我们的工具和资源")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 transition-all hover:bg-cosmic-800/40">
              <div className="flex items-center mb-3">
                <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
                <h3 className="text-cosmic-100 font-medium">
                  {t("Useful Links Collection", "实用链接集合")}
                </h3>
              </div>
              <p className="text-xs text-cosmic-300 mb-3">
                {t("Our curated collection of resources, tools, and websites for astronomy enthusiasts.", 
                   "我们为天文爱好者策划的资源、工具和网站集合。")}
              </p>
              <Link to="/useful-links">
                <Button size="sm" variant="secondary" className="w-full text-xs">
                  {t("Explore Resources", "探索资源")}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30 transition-all hover:bg-cosmic-800/40">
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                <h3 className="text-cosmic-100 font-medium">
                  {t("Latest Updates", "最新更新")}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-cosmic-300 border-l-2 border-cosmic-700 pl-2">
                  <p className="text-cosmic-200">{t("Tools & Resources", "工具和资源")}</p>
                  <p>{t("Added 70+ new astronomy resources and links", "新增70多个天文资源和链接")}</p>
                </div>
                <div className="text-xs text-cosmic-300 border-l-2 border-cosmic-700 pl-2">
                  <p className="text-cosmic-200">{t("SIQS System", "SIQS系统")}</p>
                  <p>{t("Improved algorithm for more accurate sky quality prediction", "改进算法，提高天空质量预测准确性")}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30">
            <p className="text-sm text-center text-cosmic-300">
              {t("Looking for resources? Check out our extensive collection of astronomy tools, websites, and guides.", 
                 "寻找资源？查看我们广泛的天文工具、网站和指南集合。")}
            </p>
            <div className="flex justify-center mt-3">
              <Link to="/useful-links">
                <Button size="sm" className="bg-cosmic-700 hover:bg-cosmic-600">
                  {t("Browse Astronomy Resources", "浏览天文资源")}
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
