
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
            <MapPin className="text-cosmic-400" />
            {t("The Science Behind Bortle Now", "Bortle Now背后的科学")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-cosmic-700/30">
              <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                {t("About the Bortle Scale", "关于波特尔量表")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200 pb-4">
                <p className="mb-3">
                  {t("The Bortle scale, developed by John Bortle in 2001, is a nine-level numeric scale that measures the night sky's brightness at a particular location. It ranges from Class 1 (excellent dark-sky sites) to Class 9 (inner-city skies).", 
                    "波特尔量表由John Bortle于2001年开发，是一个九级数字量表，用于测量特定位置的夜空亮度。它的范围从1级（优秀的暗空地点）到9级（市中心天空）。")}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 1-3", "波特尔1-3级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Dark to rural skies. Milky Way clearly visible with detailed structure.", 
                        "黑暗到乡村天空。银河系清晰可见，结构详细。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 4-6", "波特尔4-6级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Rural/suburban transition to bright suburban skies. Milky Way visible but with less detail.", 
                        "乡村/郊区过渡到明亮的郊区天空。银河系可见但细节较少。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 7-9", "波特尔7-9级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Suburban/urban to inner-city skies. Milky Way invisible or barely visible.", 
                        "郊区/城市到市中心天空。银河系不可见或几乎不可见。")}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-cosmic-700/30">
              <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                {t("Our Advanced Algorithms", "我们的先进算法")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200 pb-4">
                <p className="mb-3">
                  {t("Our SIQS algorithm builds upon the Bortle scale by incorporating dynamic factors like weather conditions, moon phase, and seeing conditions. This provides a more comprehensive and real-time assessment of stargazing quality.", 
                    "我们的SIQS算法在波特尔量表的基础上，结合了天气条件、月相和视宁度等动态因素。这提供了更全面和实时的观星质量评估。")}
                </p>
                
                <div className="bg-cosmic-800/20 p-4 rounded border border-cosmic-700/30 mt-4">
                  <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-red-400" />
                    {t("Optimized Location Finding", "优化的位置查找")}
                  </h4>
                  <p className="text-sm text-cosmic-200">
                    {t("Our latest updates include an enhanced location discovery algorithm that efficiently identifies and ranks both certified dark sky locations and calculated optimal viewing spots across all continents.", 
                      "我们的最新更新包括增强型位置发现算法，可以有效识别和排名所有大洲的认证暗空位置和计算出的最佳观测点。")}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-cosmic-700/30">
              <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                {t("Global Dark Sky Access", "全球暗空访问")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200 pb-4">
                <p className="mb-3">
                  {t("Our comprehensive database now includes certified dark sky locations across all continents, including previously underrepresented regions in Asia and the Southern Hemisphere. This ensures that users worldwide can find optimal stargazing conditions near them.", 
                    "我们的综合数据库现在包括所有大洲的认证暗空地点，包括以前在亚洲和南半球代表性不足的地区。这确保全球用户都能在他们附近找到最佳的观星条件。")}
                </p>
                
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Explore Dark Sky Map", "探索暗空地图")}</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Calculate Your SIQS", "计算您的SIQS")}</span>
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScienceSection;
