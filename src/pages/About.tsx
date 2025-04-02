
import React, { useState } from "react";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Moon, CloudRain, Compass, Camera, ArrowRight, Calculator, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 text-cosmic-50">
      <NavBar />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div 
          className="mb-12 text-center"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-cosmic-50">
            {t("About StarCapturer", "关于星空捕手")}
          </h1>
          <p className="text-xl text-cosmic-300 max-w-3xl mx-auto">
            {t(
              "Understand the science behind our stargazing quality predictions and learn how we help you capture the perfect night sky.",
              "了解我们观星质量预测背后的科学，学习我们如何帮助您捕捉完美的夜空。"
            )}
          </p>
        </motion.div>
        
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
            <TabsTrigger value="overview" className="text-sm md:text-base">
              {t("Overview", "概览")}
            </TabsTrigger>
            <TabsTrigger value="siqs" className="text-sm md:text-base">
              {t("SIQS", "SIQS")}
            </TabsTrigger>
            <TabsTrigger value="darksky" className="text-sm md:text-base">
              {t("Dark Sky Knowledge", "暗空知识")}
            </TabsTrigger>
            <TabsTrigger value="tech" className="text-sm md:text-base">
              {t("Technology", "技术")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="text-cosmic-100">
            <motion.div
              initial="hidden"
              animate={activeTab === "overview" ? "visible" : "hidden"}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Star className="h-6 w-6 text-yellow-400" />
                      {t("Our Mission", "我们的使命")}
                    </h2>
                    <p className="mb-4">
                      {t(
                        "StarCapturer brings together cutting-edge technology and extensive astronomical knowledge to help stargazers find the perfect time and place for observing and photographing the night sky.",
                        "星空捕手结合尖端技术和丰富的天文知识，帮助观星者找到观测和拍摄夜空的完美时间和地点。"
                      )}
                    </p>
                    <p>
                      {t(
                        "We analyze multiple factors including light pollution, weather conditions, and astronomical events to provide accurate predictions for stargazing quality anywhere in the world.",
                        "我们分析包括光污染、天气条件和天文事件在内的多种因素，为全球任何地方的观星质量提供准确预测。"
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-cyan-400" />
                    {t("SIQS Calculator", "SIQS计算器")}
                  </h3>
                  <p className="text-cosmic-200">
                    {t(
                      "Our Sky Quality Index for Stargazing (SIQS) helps you understand at a glance whether conditions are favorable for stargazing and astrophotography.",
                      "我们的观星天空质量指数（SIQS）帮助您一目了然地了解条件是否有利于观星和天文摄影。"
                    )}
                  </p>
                </div>
                
                <div className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-rose-400" />
                    {t("Location Intelligence", "位置智能")}
                  </h3>
                  <p className="text-cosmic-200">
                    {t(
                      "Discover the best spots for stargazing near you with our advanced location analysis that considers all factors affecting viewing quality.",
                      "通过我们考虑所有影响观测质量因素的高级位置分析，发现您附近最佳的观星地点。"
                    )}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="siqs" className="text-cosmic-100">
            <motion.div
              initial="hidden"
              animate={activeTab === "siqs" ? "visible" : "hidden"}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-400" />
                  {t("Sky Quality Index for Stargazing (SIQS)", "观星天空质量指数 (SIQS)")}
                </h2>
                <p className="mb-4">
                  {t(
                    "SIQS is our proprietary scoring system that evaluates the quality of the night sky for observation and photography on a scale from 0 to 10.",
                    "SIQS是我们专有的评分系统，用0到10的范围评估夜空观测和摄影的质量。"
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="border border-cosmic-700/40 rounded-lg p-4 bg-cosmic-800/20">
                    <h3 className="text-lg font-semibold mb-2 text-cosmic-50">
                      {t("Main Factors", "主要因素")}
                    </h3>
                    <ul className="space-y-2 text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Light Pollution (Bortle Scale)", "光污染（波特尔量表）")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        {t("Cloud Cover", "云层覆盖")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">•</span>
                        {t("Seeing Conditions", "视宁度条件")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        {t("Moon Phase", "月相")}
                      </li>
                    </ul>
                  </div>
                  <div className="border border-cosmic-700/40 rounded-lg p-4 bg-cosmic-800/20">
                    <h3 className="text-lg font-semibold mb-2 text-cosmic-50">
                      {t("Secondary Factors", "次要因素")}
                    </h3>
                    <ul className="space-y-2 text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        {t("Wind Speed", "风速")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        {t("Humidity", "湿度")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        {t("Air Quality", "空气质量")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        {t("Precipitation", "降水")}
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-emerald-400" />
                  {t("SIQS Score Interpretation", "SIQS评分解释")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-emerald-400">
                        {t("8-10: Excellent", "8-10: 极佳")}
                      </h4>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-cosmic-200">
                      {t(
                        "Perfect conditions. Ideal for deep-sky astrophotography and detailed observations.",
                        "完美条件。适合深空天体摄影和详细观测。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-blue-400">
                        {t("6-7.9: Good", "6-7.9: 良好")}
                      </h4>
                      <div className="flex">
                        {[1, 2, 3, 4].map(i => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="h-3 w-3 text-yellow-400" />
                      </div>
                    </div>
                    <p className="text-sm text-cosmic-200">
                      {t(
                        "Very favorable conditions. Great for most types of astronomical observation.",
                        "非常有利的条件。适合大多数类型的天文观测。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-yellow-400">
                        {t("4-5.9: Fair", "4-5.9: 一般")}
                      </h4>
                      <div className="flex">
                        {[1, 2, 3].map(i => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[1, 2].map(i => (
                          <Star key={i} className="h-3 w-3 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-cosmic-200">
                      {t(
                        "Adequate conditions. Suitable for casual observation and bright object photography.",
                        "足够的条件。适合休闲观测和亮天体摄影。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-orange-400">
                        {t("2-3.9: Poor", "2-3.9: 较差")}
                      </h4>
                      <div className="flex">
                        {[1, 2].map(i => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[1, 2, 3].map(i => (
                          <Star key={i} className="h-3 w-3 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-cosmic-200">
                      {t(
                        "Challenging conditions. Only the brightest objects will be visible.",
                        "条件有挑战性。只有最亮的天体可见。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-red-400">
                        {t("0-1.9: Very Poor", "0-1.9: 很差")}
                      </h4>
                      <div className="flex">
                        {[1].map(i => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[1, 2, 3, 4].map(i => (
                          <Star key={i} className="h-3 w-3 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-cosmic-200">
                      {t(
                        "Unfavorable conditions. Not recommended for stargazing.",
                        "不利条件。不推荐观星。"
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="darksky" className="text-cosmic-100">
            <motion.div
              initial="hidden"
              animate={activeTab === "darksky" ? "visible" : "hidden"}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Moon className="h-6 w-6 text-blue-300" />
                  {t("The Bortle Dark-Sky Scale", "波特尔暗空量表")}
                </h2>
                <p className="mb-4">
                  {t(
                    "The Bortle scale is a nine-level numeric scale that measures the night sky's brightness of a particular location. It quantifies the astronomical observability of celestial objects and the interference caused by light pollution.",
                    "波特尔量表是一个九级数字量表，用于测量特定位置夜空的亮度。它量化了天体的天文可观测性和光污染造成的干扰。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-cosmic-50">
                      {t("Scale Overview", "量表概述")}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-900"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">1:</span> {t("Excellent dark-sky site", "极佳的暗空地点")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-800"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">2:</span> {t("Typical truly dark site", "典型的真正暗空地点")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-700"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">3:</span> {t("Rural sky", "乡村天空")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">4:</span> {t("Rural/suburban transition", "乡村/郊区过渡")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">5:</span> {t("Suburban sky", "郊区天空")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-500"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">6:</span> {t("Bright suburban sky", "明亮的郊区天空")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-600"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">7:</span> {t("Suburban/urban transition", "郊区/城市过渡")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-700"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">8:</span> {t("City sky", "城市天空")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-700"></div>
                        <span className="text-cosmic-200">
                          <span className="font-semibold text-cosmic-50">9:</span> {t("Inner-city sky", "市中心天空")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-cosmic-50">
                      {t("Impact on Visibility", "对可见度的影响")}
                    </h3>
                    <div className="space-y-3 text-cosmic-200">
                      <p>
                        {t(
                          "Lower Bortle scales (1-3) offer exceptional conditions for observing deep-sky objects, the Milky Way, and faint celestial details.",
                          "较低的波特尔量表值（1-3）为观测深空天体、银河系和微弱的天体细节提供了极佳的条件。"
                        )}
                      </p>
                      <p>
                        {t(
                          "Mid-range values (4-6) still allow for good observation of brighter objects, but faint details are increasingly difficult to see.",
                          "中等范围的值（4-6）仍然允许对较亮的天体进行良好观测，但微弱的细节越来越难以看到。"
                        )}
                      </p>
                      <p>
                        {t(
                          "Higher scales (7-9) indicate significant light pollution where only the brightest stars and planets are visible.",
                          "较高的量表值（7-9）表明显著的光污染，只有最亮的恒星和行星可见。"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Camera className="h-6 w-6 text-emerald-400" />
                  {t("Bortle Now Advantages", "Bortle Now优势")}
                </h2>
                <p className="mb-4">
                  {t(
                    "Our Bortle Now technology uses your device's camera to directly measure sky brightness at your exact location, providing numerous advantages over traditional methods.",
                    "我们的Bortle Now技术使用您设备的相机直接测量您确切位置的天空亮度，比传统方法提供更多优势。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="border border-cosmic-700/30 rounded-lg p-4 bg-cosmic-800/10">
                    <h3 className="text-lg font-semibold mb-2 text-emerald-400">
                      {t("Real-time Accuracy", "实时精确度")}
                    </h3>
                    <p className="text-cosmic-200">
                      {t(
                        "Unlike static databases, Bortle Now captures the current sky conditions exactly as they are, accounting for temporary factors that affect visibility.",
                        "与静态数据库不同，Bortle Now准确捕捉当前的天空状况，考虑到影响可见度的临时因素。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-4 bg-cosmic-800/10">
                    <h3 className="text-lg font-semibold mb-2 text-emerald-400">
                      {t("Precise Location Data", "精确位置数据")}
                    </h3>
                    <p className="text-cosmic-200">
                      {t(
                        "Light pollution can vary significantly within short distances. Bortle Now measures your exact spot, not an approximation from the nearest known location.",
                        "光污染在短距离内可能有显著差异。Bortle Now测量您的确切位置，而不是来自最近已知位置的近似值。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-4 bg-cosmic-800/10">
                    <h3 className="text-lg font-semibold mb-2 text-emerald-400">
                      {t("Enhanced SIQS Calculations", "增强的SIQS计算")}
                    </h3>
                    <p className="text-cosmic-200">
                      {t(
                        "Bortle Now measurements are directly integrated into our SIQS system, resulting in more accurate stargazing quality predictions tailored to your specific location.",
                        "Bortle Now测量直接集成到我们的SIQS系统中，提供更准确的、针对您特定位置的观星质量预测。"
                      )}
                    </p>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-4 bg-cosmic-800/10">
                    <h3 className="text-lg font-semibold mb-2 text-emerald-400">
                      {t("Comprehensive Sky Analysis", "全面的天空分析")}
                    </h3>
                    <p className="text-cosmic-200">
                      {t(
                        "Our algorithm accounts for device-specific calibration, atmospheric conditions, and applies advanced logarithmic perception modeling based on human eye sensitivity.",
                        "我们的算法考虑了设备特定的校准、大气条件，并应用基于人眼敏感度的先进对数感知建模。"
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
          
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <CloudRain className="h-6 w-6 text-blue-400" />
                  {t("Astronomical Seeing", "天文视宁度")}
                </h2>
                <p className="mb-4">
                  {t(
                    "Astronomical seeing refers to the blurring and twinkling of objects caused by atmospheric turbulence. It's measured on a 1-10 scale where higher numbers represent more stable conditions.",
                    "天文视宁度指的是大气湍流导致的物体模糊和闪烁。它在1-10的量表上测量，数字越高代表条件越稳定。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <h4 className="font-semibold text-blue-400 mb-2">
                      {t("Factors Affecting Seeing", "影响视宁度的因素")}
                    </h4>
                    <ul className="space-y-1 text-sm text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Atmospheric turbulence", "大气湍流")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Temperature gradients", "温度梯度")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Altitude of observation", "观测高度")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Wind conditions", "风力条件")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Local geography", "当地地理")}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <h4 className="font-semibold text-blue-400 mb-2">
                      {t("Impact on Observation", "对观测的影响")}
                    </h4>
                    <ul className="space-y-1 text-sm text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Poor seeing: Stars twinkle rapidly", "差的视宁度：恒星快速闪烁")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Average seeing: Moderate detail visible", "一般视宁度：可见中等细节")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Excellent seeing: Fine details observable", "极佳视宁度：可观察精细细节")}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border border-cosmic-700/30 rounded-lg p-3 bg-cosmic-800/10">
                    <h4 className="font-semibold text-blue-400 mb-2">
                      {t("Best Practices", "最佳实践")}
                    </h4>
                    <ul className="space-y-1 text-sm text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Avoid observing over buildings", "避免在建筑物上方观测")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Higher altitudes often have better seeing", "较高海拔通常有更好的视宁度")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Coastal areas can have stable air", "沿海地区可能有稳定的空气")}
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="tech" className="text-cosmic-100">
            <motion.div
              initial="hidden"
              animate={activeTab === "tech" ? "visible" : "hidden"}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Compass className="h-6 w-6 text-blue-400" />
                  {t("Our Technology", "我们的技术")}
                </h2>
                <p className="mb-4">
                  {t(
                    "StarCapturer combines multiple data sources and advanced algorithms to provide accurate stargazing forecasts and recommendations.",
                    "星空捕手结合多种数据源和先进的算法，提供准确的观星预报和建议。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="border border-cosmic-700/40 rounded-lg p-4 bg-cosmic-800/20">
                    <h3 className="text-lg font-semibold mb-2 text-cosmic-50">
                      {t("Data Sources", "数据来源")}
                    </h3>
                    <ul className="space-y-2 text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        {t("Weather APIs for real-time conditions", "天气API提供实时状况")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">•</span>
                        {t("Light pollution databases and maps", "光污染数据库和地图")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 font-bold">•</span>
                        {t("Astronomical calendars for celestial events", "天文日历提供天体事件")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        {t("Elevation data for terrain analysis", "高程数据用于地形分析")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        {t("User device sensors for real-time measurements", "用户设备传感器提供实时测量")}
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border border-cosmic-700/40 rounded-lg p-4 bg-cosmic-800/20">
                    <h3 className="text-lg font-semibold mb-2 text-cosmic-50">
                      {t("Advanced Algorithms", "先进算法")}
                    </h3>
                    <ul className="space-y-2 text-cosmic-200">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        {t("Multi-factor SIQS calculation engine", "多因素SIQS计算引擎")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        {t("Bortle Now real-time sky quality measurement", "Bortle Now实时天空质量测量")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        {t("Predictive forecasting for multi-day planning", "多日规划的预测预报")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        {t("Optimal location finder with terrain analysis", "带有地形分析的最佳位置查找器")}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        {t("Camera calibration for accurate measurements", "相机校准以获得准确测量")}
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={fadeIn} className="bg-cosmic-800/30 rounded-xl p-6 backdrop-blur-sm border border-cosmic-700/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {t("Experience StarCapturer", "体验星空捕手")}
                    </h2>
                    <p className="text-cosmic-300 mb-4">
                      {t(
                        "Try our tools now to find the perfect time and place for your next stargazing adventure.",
                        "立即尝试我们的工具，为您的下一次观星冒险找到完美的时间和地点。"
                      )}
                    </p>
                    <Button className="group">
                      {t("Try SIQS Calculator", "尝试SIQS计算器")}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-cosmic-800 rounded-full flex items-center justify-center border-4 border-cosmic-700/50">
                      <Star className="h-12 w-12 md:h-16 md:w-16 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
