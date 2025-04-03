
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Star, Moon, SunMoon, Lightbulb, MapPin, CloudSun, Camera, Map, Telescope } from "lucide-react";
import { motion } from "framer-motion";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const About = () => {
  const { t } = useLanguage();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <motion.h1 
          className="text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t("About Bortle Now", "关于 Bortle Now")}
        </motion.h1>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SunMoon className="text-cosmic-400" />
                  {t("Our Mission", "我们的使命")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
                <p className="mb-4 text-cosmic-200">
                  {t("Bortle Now helps astrophotographers find ideal viewing conditions by providing real-time Sky Quality Index (SIQS) scores. Our platform combines light pollution data, weather forecasts, and astronomical conditions to help you plan perfect stargazing sessions.", 
                    "Bortle Now 通过提供实时天空质量指数（SIQS）评分，帮助天文摄影师找到理想的观测条件。我们的平台结合了光污染数据、天气预报和天文条件，帮助您规划完美的观星活动。")}
                </p>
                <p className="text-cosmic-200">
                  {t("We're passionate about making astronomy accessible to everyone, from beginners to professionals. Our goal is to create a global community of stargazers who can share their experiences and dark sky locations.", 
                    "我们热衷于让天文学变得人人可及，从初学者到专业人士。我们的目标是创建一个全球观星者社区，人们可以在这里分享他们的经验和暗空地点。")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="text-cosmic-400" />
                  {t("What is Bortle Now?", "什么是 Bortle Now？")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
                <div className="md:flex gap-6">
                  <div className="md:w-2/3">
                    <p className="mb-4 text-cosmic-200">
                      {t("Bortle Now is a comprehensive application that helps astrophotographers and stargazers find the best locations and times for observing the night sky. Our platform uses the Bortle scale (a measure of light pollution) combined with real-time weather data to calculate the Sky Quality Index for Stargazing (SIQS).", 
                        "Bortle Now 是一个综合应用程序，帮助天文摄影师和观星者找到观测夜空的最佳位置和时间。我们的平台使用波特尔量表（一种光污染测量方法）结合实时天气数据来计算观星天空质量指数（SIQS）。")}
                    </p>
                    
                    <h3 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Our SIQS algorithm processes multiple factors:", 
                        "我们的SIQS算法处理多种因素：")}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-indigo-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-indigo-300">1</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Light pollution (Bortle scale)", "光污染（波特尔量表）")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-blue-300">2</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Cloud cover analysis", "云层覆盖分析")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-green-300">3</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Humidity levels", "湿度水平")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-yellow-300">4</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Wind speed", "风速")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-orange-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-orange-300">5</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Seeing conditions", "视宁度")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-purple-300">6</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Moon phase", "月相")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-pink-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-pink-300">7</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Air quality", "空气质量")}</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 bg-teal-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs text-teal-300">8</span>
                        </div>
                        <span className="text-sm text-cosmic-200">{t("Clear sky rate", "晴空率")}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 px-3 py-2 border border-cosmic-600/30 rounded-md bg-cosmic-800/30">
                      <p className="text-sm text-cosmic-200">
                        {t("The result is a single score from 0-10 that represents how ideal conditions are for astrophotography and stargazing at any given location and time.", 
                          "结果是一个从0-10的单一分数，代表任何给定位置和时间的天文摄影和观星条件有多理想。")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="md:w-1/3 mt-6 md:mt-0">
                    <div className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/30">
                      <h3 className="text-sm font-semibold mb-3 text-cosmic-100 flex items-center">
                        <Star className="h-4 w-4 mr-1.5 text-yellow-400" />
                        {t("New in 2025", "2025年新功能")}
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <Camera className="h-4 w-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                          <span className="text-xs text-cosmic-200">
                            {t("Enhanced dark sky camera with auto-calibration", "增强型暗空相机，具有自动校准功能")}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CloudSun className="h-4 w-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                          <span className="text-xs text-cosmic-200">
                            {t("Nighttime cloud forecasting with separate evening/morning analysis", "夜间云层预报，分别对傍晚/清晨进行分析")}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Map className="h-4 w-4 mr-2 mt-0.5 text-purple-400 flex-shrink-0" />
                          <span className="text-xs text-cosmic-200">
                            {t("Improved dark site recommendation algorithm", "改进的暗空地点推荐算法")}
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Telescope className="h-4 w-4 mr-2 mt-0.5 text-amber-400 flex-shrink-0" />
                          <span className="text-xs text-cosmic-200">
                            {t("Specialized settings for different types of astronomy (deep sky, planetary, etc.)", "针对不同类型天文学的专业设置（深空、行星等）")}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="text-cosmic-400" />
                  {t("Key Features", "主要功能")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-cosmic-700/30">
                    <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                      {t("Real-time SIQS Calculation", "实时SIQS计算")}
                    </AccordionTrigger>
                    <AccordionContent className="text-cosmic-200 pb-4">
                      {t("Get instant Sky Quality Index scores for your current location or any place worldwide. Our algorithm processes multiple environmental factors to provide accurate stargazing forecasts.", 
                        "获取您当前位置或世界任何地方的即时天空质量指数评分。我们的算法处理多种环境因素，提供准确的观星预报。")}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2" className="border-cosmic-700/30">
                    <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                      {t("Nighttime Cloud Analysis", "夜间云层分析")}
                    </AccordionTrigger>
                    <AccordionContent className="text-cosmic-200 pb-4">
                      {t("Our advanced system separately analyzes evening (6PM-12AM) and morning (1AM-8AM) cloud cover to give you the most accurate prediction of viewing conditions throughout the night.", 
                        "我们的先进系统分别分析傍晚（下午6点至午夜12点）和清晨（凌晨1点至早上8点）的云层覆盖，为您提供整晚观测条件的最准确预测。")}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3" className="border-cosmic-700/30">
                    <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                      {t("Light Pollution Mapping", "光污染地图")}
                    </AccordionTrigger>
                    <AccordionContent className="text-cosmic-200 pb-4">
                      {t("Accurate Bortle scale measurements help you understand light pollution levels in your area. Our database includes thousands of locations globally with verified Bortle scale readings.", 
                        "准确的波特尔量表测量帮助您了解您所在地区的光污染水平。我们的数据库包括全球数千个具有经过验证的波特尔量表读数的位置。")}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4" className="border-cosmic-700/30">
                    <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                      {t("Astronomy Camera", "天文相机")}
                    </AccordionTrigger>
                    <AccordionContent className="text-cosmic-200 pb-4">
                      {t("Our specialized camera mode uses your device's camera to measure actual night sky brightness and estimate the Bortle scale. It can even count visible stars to help calibrate measurements in different viewing conditions.", 
                        "我们的专用相机模式使用您设备的相机来测量实际夜空亮度并估计波特尔量表。它甚至可以计算可见星星的数量，帮助在不同观测条件下校准测量。")}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-5" className="border-cosmic-700/30">
                    <AccordionTrigger className="text-cosmic-100 hover:text-cosmic-50 py-4">
                      {t("Astro Spot Sharing", "天文点分享")}
                    </AccordionTrigger>
                    <AccordionContent className="text-cosmic-200 pb-4">
                      {t("Discover and share dark sky locations with the community. Find verified dark sky reserves, astronomy parks, and user-recommended viewing spots.", 
                        "与社区发现和分享暗空位置。查找经过验证的暗空保护区、天文公园和用户推荐的观测点。")}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="text-cosmic-400" />
                  {t("The Science Behind Bortle Now", "Bortle Now背后的科学")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
                <p className="mb-4 text-cosmic-200">
                  {t("The Bortle scale, developed by John Bortle in 2001, is a nine-level numeric scale that measures the night sky's brightness at a particular location. It ranges from Class 1 (excellent dark-sky sites) to Class 9 (inner-city skies).", 
                    "波特尔量表由John Bortle于2001年开发，是一个九级数字量表，用于测量特定位置的夜空亮度。它的范围从1级（优秀的暗空地点）到9级（市中心天空）。")}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 1-3", "波特尔1-3级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Dark to rural skies. Milky Way clearly visible with detailed structure. Zodiacal light visible.", 
                        "黑暗到乡村天空。银河系清晰可见，结构详细。黄道光可见。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 4-6", "波特尔4-6级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Rural/suburban transition to bright suburban skies. Milky Way visible but with less detail. Light domes visible near cities.", 
                        "乡村/郊区过渡到明亮的郊区天空。银河系可见但细节较少。城市附近可见光穹。")}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-800/30 p-3 rounded border border-cosmic-700/30">
                    <h4 className="text-sm font-semibold mb-2 text-cosmic-100">
                      {t("Bortle Class 7-9", "波特尔7-9级")}
                    </h4>
                    <p className="text-xs text-cosmic-200">
                      {t("Suburban/urban to inner-city skies. Milky Way invisible or barely visible. Only brightest stars visible.", 
                        "郊区/城市到市中心天空。银河系不可见或几乎不可见。只有最亮的星星可见。")}
                    </p>
                  </div>
                </div>
                
                <p className="mb-4 text-cosmic-200">
                  {t("Our SIQS algorithm builds upon the Bortle scale by incorporating dynamic factors like weather conditions, moon phase, and seeing conditions. This provides a more comprehensive and real-time assessment of stargazing quality.", 
                    "我们的SIQS算法在波特尔量表的基础上，结合了天气条件、月相和视宁度等动态因素。这提供了更全面和实时的观星质量评估。")}
                </p>
                
                <div className="bg-cosmic-800/20 p-4 rounded border border-cosmic-700/30 mt-4">
                  <h4 className="text-sm font-semibold mb-2 text-cosmic-100 flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-red-400" />
                    {t("Research-Backed Technology", "研究支持的技术")}
                  </h4>
                  <p className="text-sm text-cosmic-200">
                    {t("We've calibrated our measurements against professional sky quality meters (SQMs) and collaborated with astronomers worldwide to ensure our results align with real-world observations while making them accessible to everyone without specialized equipment.", 
                      "我们已经根据专业的天空质量仪（SQMs）校准了我们的测量，并与世界各地的天文学家合作，以确保我们的结果与现实世界的观测一致，同时使它们对没有专业设备的每个人都可以使用。")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="text-cosmic-400" />
                  {t("Useful Resources", "有用资源")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("International Dark-Sky Association", "国际暗空协会")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Globe at Night Project", "Globe at Night 项目")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Dark Sky Meter App", "暗空测量应用")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Light Pollution Map", "光污染地图")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Clear Dark Sky Charts", "晴朗暗空图表")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between">
                    <span>{t("Bortle Now Mobile App", "Bortle Now 移动应用")}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-8">
                  <Link to="/">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      {t("Return to Home", "返回首页")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
