
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Link as LinkIcon, Star, Sun, CloudMoon, Telescope, Wind, Droplets, Compass, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const AboutSIQS = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("what-is-siqs");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat py-12">
      <div className="container mx-auto mt-32 px-4">
        <Tabs 
          defaultValue="what-is-siqs" 
          className="w-full max-w-4xl mx-auto" 
          onValueChange={handleTabChange}
        >
          <div className="flex justify-center mb-12">
            <TabsList className="bg-cosmic-800/70 p-1 rounded-xl border border-cosmic-600/20 shadow-lg">
              <TabsTrigger 
                value="what-is-siqs" 
                className={`text-lg px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === "what-is-siqs" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-cosmic-700/50 hover:text-primary-foreground hover:scale-105"
                }`}
              >
                {t("What is SIQS?", "什么是SIQS？")}
              </TabsTrigger>
              <TabsTrigger 
                value="dark-sky-knowledge" 
                className={`text-lg px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === "dark-sky-knowledge" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-cosmic-700/50 hover:text-primary-foreground hover:scale-105"
                }`}
              >
                {t("Dark Sky Knowledge", "暗夜知识")}
              </TabsTrigger>
              <TabsTrigger 
                value="useful-links" 
                className={`text-lg px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === "useful-links" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-cosmic-700/50 hover:text-primary-foreground hover:scale-105"
                }`}
              >
                {t("Useful Links", "实用链接")}
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* What is SIQS? content */}
          <TabsContent value="what-is-siqs" className="animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-cosmic-900/80 border-cosmic-600/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-center text-gradient-blue">
                    {t("Sky Imaging Quality Score (SIQS)", "天空成像质量分数 (SIQS)")}
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    {t("A comprehensive metric for astrophotography conditions", "天文摄影条件的综合指标")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg">
                    {t(
                      "SIQS is a comprehensive scoring system that evaluates and predicts the suitability of a location for astrophotography and night sky observation. It combines multiple environmental factors to provide a single, easy-to-understand score from 0-100.",
                      "SIQS是一个综合评分系统，用于评估和预测某个位置对天文摄影和夜空观测的适宜性。它结合了多个环境因素，提供一个从0到100的简单易懂的分数。"
                    )}
                  </p>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary">
                      {t("Key Factors in SIQS Calculation", "SIQS计算中的关键因素")}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <Sun className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Light Pollution", "光污染")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Measures artificial light that obscures celestial objects", "测量遮挡天体的人工光源")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <CloudMoon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Cloud Cover", "云层覆盖")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Percentage of sky obscured by clouds", "被云层遮挡的天空百分比")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <Telescope className="h-5 w-5 text-purple-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Seeing", "视宁度")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Atmospheric stability affecting image sharpness", "影响图像清晰度的大气稳定性")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <Wind className="h-5 w-5 text-teal-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Wind Speed", "风速")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Affects equipment stability and image quality", "影响设备稳定性和图像质量")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <Droplets className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Humidity", "湿度")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Can cause condensation on optical equipment", "可能导致光学设备上的冷凝")}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-600/10">
                        <Compass className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium">{t("Transparency", "透明度")}</h4>
                          <p className="text-sm text-muted-foreground">{t("Clarity of the atmosphere for observing", "观测大气的清晰度")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-cosmic-800/50 p-5 rounded-lg border border-cosmic-600/30">
                    <h3 className="text-xl font-semibold mb-3 text-primary">
                      {t("Interpreting SIQS Scores", "解读SIQS分数")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-green-400">90-100</span>
                          <span className="bg-green-500/30 rounded px-2 py-0.5 text-xs">{t("Excellent", "极佳")}</span>
                        </div>
                        <p className="text-sm">{t("Ideal conditions for all types of astrophotography", "适合所有类型天文摄影的理想条件")}</p>
                      </div>
                      
                      <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-emerald-400">75-89</span>
                          <span className="bg-emerald-500/30 rounded px-2 py-0.5 text-xs">{t("Very Good", "非常好")}</span>
                        </div>
                        <p className="text-sm">{t("Great for detailed imaging of most deep sky objects", "非常适合大多数深空天体的详细成像")}</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-yellow-400">60-74</span>
                          <span className="bg-yellow-500/30 rounded px-2 py-0.5 text-xs">{t("Good", "良好")}</span>
                        </div>
                        <p className="text-sm">{t("Suitable for many types of astrophotography", "适合多种类型的天文摄影")}</p>
                      </div>
                      
                      <div className="p-3 bg-orange-900/20 border border-orange-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-orange-400">40-59</span>
                          <span className="bg-orange-500/30 rounded px-2 py-0.5 text-xs">{t("Fair", "一般")}</span>
                        </div>
                        <p className="text-sm">{t("Challenging for deep sky, usable for moon and bright planets", "深空观测有挑战，可用于月球和明亮行星")}</p>
                      </div>
                      
                      <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-red-400">20-39</span>
                          <span className="bg-red-500/30 rounded px-2 py-0.5 text-xs">{t("Poor", "较差")}</span>
                        </div>
                        <p className="text-sm">{t("Limited to basic moon photographs and brightest planets", "仅限于基本的月球照片和最亮的行星")}</p>
                      </div>
                      
                      <div className="p-3 bg-red-950/30 border border-red-800/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-red-500">0-19</span>
                          <span className="bg-red-800/30 rounded px-2 py-0.5 text-xs">{t("Very Poor", "很差")}</span>
                        </div>
                        <p className="text-sm">{t("Not recommended for any astrophotography", "不建议进行任何天文摄影")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-cosmic-600/10 pt-4">
                  <p className="text-sm text-center text-muted-foreground max-w-md">
                    {t(
                      "SIQS is calculated using real-time weather data, light pollution maps, and astronomical models to help you find the perfect time and place for your astrophotography session.",
                      "SIQS使用实时天气数据、光污染地图和天文模型计算，帮助您找到天文摄影的最佳时间和地点。"
                    )}
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Dark Sky Knowledge content */}
          <TabsContent value="dark-sky-knowledge" className="animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-cosmic-900/80 border-cosmic-600/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-center text-gradient-blue">
                    {t("Dark Sky Knowledge", "暗夜知识")}
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    {t("Essential information for astronomy enthusiasts", "天文爱好者的重要信息")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-400" />
                      {t("Light Pollution & Bortle Scale", "光污染与波特尔等级")}
                    </h3>
                    <p className="mb-4">
                      {t(
                        "Light pollution is one of the most significant factors affecting astronomical observation. The Bortle Scale is a nine-level numeric scale that measures the night sky's brightness at a particular location.",
                        "光污染是影响天文观测的最重要因素之一。波特尔等级是一个九级数字等级，用于测量特定位置的夜空亮度。"
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-blue-900 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 1-2", "波特尔 1-2")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Excellent dark skies, Milky Way casts shadows", "极佳的暗夜天空，银河能投射阴影")}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-blue-800 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 3-4", "波特尔 3-4")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Rural skies, Milky Way details visible", "乡村天空，可见银河细节")}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-indigo-500 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 5-6", "波特尔 5-6")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Suburban skies, Milky Way faint", "郊区天空，银河模糊")}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-purple-500 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 7", "波特尔 7")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Suburban/urban transition, Milky Way barely visible", "郊区/城市过渡，银河几乎不可见")}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-pink-600 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 8", "波特尔 8")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Urban skies, only brightest stars visible", "城市天空，仅可见最亮的恒星")}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cosmic-800/90 to-cosmic-700/50 p-4 rounded-lg border border-cosmic-600/10">
                        <div className="text-center mb-2">
                          <span className="inline-block w-8 h-8 rounded-full bg-red-500 mb-2"></span>
                          <h4 className="font-medium">{t("Bortle 9", "波特尔 9")}</h4>
                        </div>
                        <p className="text-xs text-center">{t("Inner-city skies, few stars visible", "市中心天空，几乎看不到恒星")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
                      {t("Seeing & Transparency", "视宁度与透明度")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="font-medium text-lg mb-2">{t("Seeing", "视宁度")}</h4>
                        <p className="mb-2 text-sm">
                          {t(
                            "Seeing refers to the steadiness of Earth's atmosphere, which affects how clearly we can observe celestial objects. Poor seeing causes stars to 'twinkle' more and reduces image sharpness.",
                            "视宁度指地球大气的稳定性，它影响我们观察天体的清晰度。不良的视宁度会导致恒星'闪烁'更多，降低图像清晰度。"
                          )}
                        </p>
                        <div className="bg-cosmic-800/40 p-3 rounded-lg text-sm border border-cosmic-600/10">
                          <p className="font-medium">{t("Factors affecting Seeing:", "影响视宁度的因素：")}</p>
                          <ul className="list-disc list-inside space-y-1 mt-1 text-xs text-muted-foreground">
                            <li>{t("Temperature differentials in the atmosphere", "大气中的温度差异")}</li>
                            <li>{t("Turbulence at different heights", "不同高度的湍流")}</li>
                            <li>{t("Proximity to mountains or large water bodies", "靠近山脉或大型水体")}</li>
                            <li>{t("Local heat sources", "本地热源")}</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-lg mb-2">{t("Transparency", "透明度")}</h4>
                        <p className="mb-2 text-sm">
                          {t(
                            "Transparency describes how clear the atmosphere is and how well light from distant objects can pass through it. High transparency allows for better observation of faint objects like distant galaxies and nebulae.",
                            "透明度描述大气的清晰程度以及远处天体的光线通过的情况。高透明度可以更好地观察到像遥远星系和星云这样的暗淡天体。"
                          )}
                        </p>
                        <div className="bg-cosmic-800/40 p-3 rounded-lg text-sm border border-cosmic-600/10">
                          <p className="font-medium">{t("Factors affecting Transparency:", "影响透明度的因素：")}</p>
                          <ul className="list-disc list-inside space-y-1 mt-1 text-xs text-muted-foreground">
                            <li>{t("Water vapor content in the atmosphere", "大气中的水蒸气含量")}</li>
                            <li>{t("Dust, pollen, and aerosols", "灰尘、花粉和气溶胶")}</li>
                            <li>{t("Air pollution and smog", "空气污染和烟雾")}</li>
                            <li>{t("Altitude (higher is generally better)", "海拔（通常越高越好）")}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />
                      {t("Dark Sky Preservation", "暗夜保护")}
                    </h3>
                    <p className="mb-4">
                      {t(
                        "Dark sky preservation involves efforts to reduce light pollution to protect the ability to view the night sky and for the benefit of nocturnal ecosystems.",
                        "暗夜保护涉及减少光污染的努力，以保护观察夜空的能力，并有利于夜间生态系统。"
                      )}
                    </p>
                    <div className="bg-cosmic-800/50 p-4 rounded-lg border border-cosmic-600/20">
                      <h4 className="font-medium mb-2">{t("International Dark Sky Places", "国际暗夜地点")}</h4>
                      <p className="text-sm mb-3">
                        {t(
                          "The International Dark-Sky Association (IDA) designates locations with exceptional starry nights and protected nocturnal environments.",
                          "国际暗夜协会(IDA)指定具有卓越星空和受保护夜间环境的地点。"
                        )}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="bg-cosmic-700/30 p-3 rounded-lg">
                          <h5 className="font-medium">{t("Dark Sky Parks", "暗夜公园")}</h5>
                          <p className="text-xs text-muted-foreground">{t("Public lands with exceptional starry skies", "拥有卓越星空的公共土地")}</p>
                        </div>
                        <div className="bg-cosmic-700/30 p-3 rounded-lg">
                          <h5 className="font-medium">{t("Dark Sky Reserves", "暗夜保护区")}</h5>
                          <p className="text-xs text-muted-foreground">{t("Larger areas with central dark zone and buffer region", "具有中央黑暗区和缓冲区的较大区域")}</p>
                        </div>
                        <div className="bg-cosmic-700/30 p-3 rounded-lg">
                          <h5 className="font-medium">{t("Dark Sky Sanctuaries", "暗夜圣地")}</h5>
                          <p className="text-xs text-muted-foreground">{t("Most remote and darkest locations globally", "全球最偏远和最黑暗的地点")}</p>
                        </div>
                        <div className="bg-cosmic-700/30 p-3 rounded-lg">
                          <h5 className="font-medium">{t("Urban Night Sky Places", "城市夜空地点")}</h5>
                          <p className="text-xs text-muted-foreground">{t("Sites near urban areas that protect dark skies", "靠近城市区域但保护黑暗天空的地点")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Useful Links content */}
          <TabsContent value="useful-links" className="animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-cosmic-900/80 border-cosmic-600/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-center text-gradient-blue">
                    {t("Useful Resources", "实用资源")}
                  </CardTitle>
                  <CardDescription className="text-center text-lg">
                    {t("Essential tools and websites for astrophotography enthusiasts", "天文摄影爱好者的重要工具和网站")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-cosmic-800/40 rounded-xl p-5 border border-cosmic-600/10 hover:shadow-md hover:bg-cosmic-800/60 transition-all duration-300">
                      <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-blue-400" />
                        {t("Light Pollution Maps & Tools", "光污染地图和工具")}
                      </h3>
                      <ul className="space-y-3">
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://www.lightpollutionmap.info" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Light Pollution Map</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Interactive world atlas of artificial night sky brightness", "人工夜空亮度的交互式世界地图")}
                            </span>
                          </a>
                        </li>
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://darksitefinder.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Dark Site Finder</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Find dark sky locations for stargazing worldwide", "在全球范围内寻找观星的黑暗天空位置")}
                            </span>
                          </a>
                        </li>
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://clearoutside.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Clear Outside</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Astronomer's forecast tool with cloud coverage data", "带有云层覆盖数据的天文学家预报工具")}
                            </span>
                          </a>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-cosmic-800/40 rounded-xl p-5 border border-cosmic-600/10 hover:shadow-md hover:bg-cosmic-800/60 transition-all duration-300">
                      <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2 text-blue-400" />
                        {t("Astronomy Planning Tools", "天文规划工具")}
                      </h3>
                      <ul className="space-y-3">
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://stellarium.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Stellarium</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Free open source planetarium software", "免费开源的天文馆软件")}
                            </span>
                          </a>
                        </li>
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://telescopius.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Telescopius</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Deep sky object planning and visualization", "深空天体规划和可视化")}
                            </span>
                          </a>
                        </li>
                        <li className="hover:translate-x-1 transition-transform duration-200">
                          <a 
                            href="https://www.timeanddate.com/astronomy" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center p-2 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200"
                          >
                            <span className="block text-primary">Time and Date Astronomy</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("Sun, moon, planet rise and set times, eclipses", "日、月、行星升落时间，日食和月食")}
                            </span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-cosmic-800/40 rounded-xl p-5 border border-cosmic-600/10 hover:shadow-md hover:bg-cosmic-800/60 transition-all duration-300">
                    <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
                      <LinkIcon className="h-5 w-5 mr-2 text-blue-400" />
                      {t("Astrophotography Communities", "天文摄影社区")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <a 
                        href="https://www.reddit.com/r/astrophotography" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">r/astrophotography</h4>
                        <p className="text-xs text-muted-foreground">{t("Reddit community for sharing and learning", "分享和学习的Reddit社区")}</p>
                      </a>
                      
                      <a 
                        href="https://www.astrobin.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">AstroBin</h4>
                        <p className="text-xs text-muted-foreground">{t("Image hosting and community for astrophotographers", "天文摄影师的图像托管和社区")}</p>
                      </a>
                      
                      <a 
                        href="https://www.cloudynights.com/forum/101-ccd-digital-astro-imaging" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">Cloudy Nights</h4>
                        <p className="text-xs text-muted-foreground">{t("Forum with expert discussions and advice", "有专家讨论和建议的论坛")}</p>
                      </a>
                      
                      <a 
                        href="https://telescopius.com/community" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">Telescopius Community</h4>
                        <p className="text-xs text-muted-foreground">{t("Share images and observation plans", "分享图像和观测计划")}</p>
                      </a>
                      
                      <a 
                        href="https://stargazerslounge.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">Stargazers Lounge</h4>
                        <p className="text-xs text-muted-foreground">{t("UK-based astronomy community with global users", "以英国为基地的全球天文社区")}</p>
                      </a>
                      
                      <a 
                        href="https://www.flickr.com/groups/astromeeting" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-cosmic-700/30 hover:bg-cosmic-700/50 transition-colors duration-200 hover:scale-105 transform"
                      >
                        <h4 className="font-medium text-primary">Flickr Astrophotography</h4>
                        <p className="text-xs text-muted-foreground">{t("Group for sharing astronomy photos", "分享天文照片的群组")}</p>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AboutSIQS;
