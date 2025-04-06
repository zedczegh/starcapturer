
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, Sun, CloudSun, GlobeLock, CloudSnow, Moon, Stars, Camera, Telescope, ExternalLink, Mountain, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const AboutContent = () => {
  const { t, language } = useLanguage();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="space-y-6">
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
            
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-md border border-blue-500/20 flex-1 min-w-[250px]">
                <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                  <Award className="h-4 w-4 mr-1.5 text-blue-400" />
                  {t("Our Mission", "我们的使命")}
                </h4>
                <p className="text-sm text-cosmic-200">
                  {t("To democratize access to the night sky by providing accurate, real-time data that helps anyone find optimal stargazing conditions anywhere on Earth.", 
                    "通过提供准确、实时的数据，帮助任何人在地球上任何地方找到最佳观星条件，从而使夜空观测变得更加普及。")}
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-md border border-purple-500/20 flex-1 min-w-[250px]">
                <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                  <Mountain className="h-4 w-4 mr-1.5 text-purple-400" />
                  {t("Terrain-Aware Technology", "地形感知技术")}
                </h4>
                <p className="text-sm text-cosmic-200">
                  {t("Our algorithms account for elevation, terrain type, and geographic features to provide more accurate sky quality predictions than ever before.", 
                    "我们的算法考虑了海拔、地形类型和地理特征，提供比以往更准确的天空质量预测。")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stars className="text-cosmic-400" />
              {t("SIQS - Stellar Imaging Quality Score", "SIQS - 天文观测质量评分")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
            <p className="mb-4 text-cosmic-200">
              {t("The SIQS (Stellar Imaging Quality Score) is our proprietary rating system that evaluates locations based on their suitability for astrophotography and stargazing.", 
                "SIQS（天文观测质量评分）是我们专有的评级系统，根据地点对天文摄影和观星的适宜性进行评估。")}
            </p>
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-3 text-cosmic-100">
                {t("SIQS Calculation Factors", "SIQS计算因素")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <CloudSun className="h-5 w-5 mr-2 mt-0.5 text-sky-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Cloud Analysis", "云层分析")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Separate evening (6PM-12AM) and morning (1AM-8AM) cloud cover prediction with weighted importance.", 
                        "分别对傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层覆盖进行加权预测。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <Stars className="h-5 w-5 mr-2 mt-0.5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Light Pollution", "光污染")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Bortle scale measurements (1-9) with terrain correction to show accurate darkness levels at your location.", 
                        "波特尔量表测量（1-9）结合地形校正，准确显示您所在位置的黑暗程度。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <Sun className="h-5 w-5 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Clear Sky Rate", "晴空率")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Historical percentage of nights with clear viewing conditions at this location.", 
                        "该位置历史上晴朗观测条件的夜晚百分比。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <CloudSnow className="h-5 w-5 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Weather Conditions", "天气条件")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Wind, humidity, temperature, and seeing conditions that affect image clarity.", 
                        "风速、湿度、温度和视宁度等影响图像清晰度的条件。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <Moon className="h-5 w-5 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Moon Phase", "月相")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Impact of current moon phase on sky brightness and viewing conditions.", 
                        "当前月相对天空亮度和观测条件的影响。")}
                    </p>
                  </div>
                </div>
                
                <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30 flex items-start">
                  <Mountain className="h-5 w-5 mr-2 mt-0.5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-cosmic-100">{t("Terrain Analysis", "地形分析")}</h5>
                    <p className="text-xs text-cosmic-300 mt-1">
                      {t("Evaluation of elevation and terrain type for better light pollution accuracy.", 
                        "评估海拔和地形类型，以提供更准确的光污染数据。")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-md border border-blue-500/20">
              <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                <Camera className="h-4 w-4 mr-1.5 text-blue-400" />
                {t("2025 Updates", "2025年更新")}
              </h4>
              <ul className="space-y-2 text-sm text-cosmic-200">
                <li className="flex items-start">
                  <Telescope className="h-4 w-4 mr-2 mt-0.5 text-purple-400 flex-shrink-0" />
                  <span>
                    {t("Advanced camera calibration technology with AI-powered star detection", 
                      "采用AI驱动的星星检测技术的高级相机校准功能")}
                  </span>
                </li>
                <li className="flex items-start">
                  <CloudSun className="h-4 w-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                  <span>
                    {t("Enhanced 72-hour nighttime cloud forecasts with hourly precision", 
                      "增强的72小时夜间云层预报，提供小时级精度")}
                  </span>
                </li>
                <li className="flex items-start">
                  <Stars className="h-4 w-4 mr-2 mt-0.5 text-amber-400 flex-shrink-0" />
                  <span>
                    {t("Global network of verified dark sky locations with local weather stations", 
                      "全球经过验证的暗空位置网络，配备本地气象站")}
                  </span>
                </li>
                <li className="flex items-start">
                  <Mountain className="h-4 w-4 mr-2 mt-0.5 text-teal-400 flex-shrink-0" />
                  <span>
                    {t("Real-time terrain-adjusted light pollution mapping with satellite verification", 
                      "基于卫星验证的实时地形调整光污染地图")}
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
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
                      {t("Research-Backed Technology", "研究支持的技术")}
                    </h4>
                    <p className="text-sm text-cosmic-200">
                      {t("We've calibrated our measurements against professional sky quality meters (SQMs) and collaborated with astronomers worldwide to ensure our results align with real-world observations.", 
                        "我们已经根据专业的天空质量仪（SQMs）校准了我们的测量，并与世界各地的天文学家合作，以确保我们的结果与现实世界的观测一致。")}
                    </p>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30">
                        <h5 className="text-xs font-medium text-cosmic-100">{t("Terrain Correction", "地形校正")}</h5>
                        <p className="text-xs text-cosmic-300 mt-1">
                          {t("We adjust light pollution readings based on elevation and terrain type to account for local geography.", 
                            "我们根据海拔和地形类型调整光污染读数，以考虑当地地理因素。")}
                        </p>
                      </div>
                      
                      <div className="bg-cosmic-800/30 p-3 rounded-md border border-cosmic-700/30">
                        <h5 className="text-xs font-medium text-cosmic-100">{t("Nighttime Forecast", "夜间预报")}</h5>
                        <p className="text-xs text-cosmic-300 mt-1">
                          {t("We separate evening (6PM-12AM) and morning (1AM-8AM) cloud forecasts for better imaging planning.", 
                            "我们分别预报傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层，以便更好地规划成像。")}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-cosmic-700/30">
                <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                  {t("Community & Sharing", "社区与分享")}
                </AccordionTrigger>
                <AccordionContent className="text-cosmic-200 pb-4">
                  <p className="mb-3">
                    {t("One of Bortle Now's key features is our community of stargazers who share and verify dark sky locations around the world. Each location is verified by our algorithms and community feedback to ensure high quality data.", 
                      "Bortle Now的主要特点之一是我们的观星者社区，他们分享和验证世界各地的暗空位置。每个位置都经过我们的算法和社区反馈验证，以确保高质量数据。")}
                  </p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                      <span>{t("Verified Dark Sky Map", "已验证的暗空地图")}</span>
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                    
                    <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                      <span>{t("Community Profiles", "社区资料")}</span>
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AboutContent;
