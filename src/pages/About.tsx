
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import BackButton from '@/components/navigation/BackButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Star, 
  Shield, 
  Award, 
  Moon, 
  Globe, 
  Info, 
  MapPin, 
  BookOpen,
  Cloud,
  Wind,
  Droplets,
  MoonStar,
  Eye,
  Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Helmet>
        <title>{t("About Sky Viewer", "关于天空观测")}</title>
      </Helmet>

      <div className="pt-20 md:pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton destination="/" />
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-3">{t("About Sky Viewer", "关于天空观测")}</h1>
              <p className="text-muted-foreground">
                {t(
                  "Learn about the Sky Viewer app, the SIQS calculation, and dark sky preservation efforts.",
                  "了解天空观测应用程序、SIQS计算和暗夜保护工作。"
                )}
              </p>
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="about" className="data-[state=active]:bg-primary/20">
                  <Info className="h-4 w-4 mr-2" />
                  {t("About App", "关于应用")}
                </TabsTrigger>
                <TabsTrigger value="ida" className="data-[state=active]:bg-primary/20">
                  <Shield className="h-4 w-4 mr-2" />
                  {t("IDA", "IDA")}
                </TabsTrigger>
                <TabsTrigger value="siqs" className="data-[state=active]:bg-primary/20">
                  <Star className="h-4 w-4 mr-2" />
                  {t("SIQS", "SIQS")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card className="bg-cosmic-800/50 border-cosmic-700">
                  <CardHeader>
                    <CardTitle>{t("Sky Viewer App", "天空观测应用")}</CardTitle>
                    <CardDescription>
                      {t("Your companion for astrophotography", "您的天文摄影伴侣")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      {t(
                        "Sky Viewer is a tool designed to help astrophotographers find the best conditions and locations for their craft. By combining weather data, light pollution information, and other astronomical factors, we provide a comprehensive analysis of viewing conditions.",
                        "天空观测是一个旨在帮助天文摄影师找到最佳条件和位置的工具。通过结合天气数据、光污染信息和其他天文因素，我们提供全面的观测条件分析。"
                      )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-cosmic-700/30 rounded-lg flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-400 mt-1" />
                        <div>
                          <h3 className="font-medium mb-1">{t("SIQS Calculator", "SIQS计算器")}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "Calculate the Stellar Imaging Quality Score for any location",
                              "计算任何位置的恒星成像质量评分"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-cosmic-700/30 rounded-lg flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-400 mt-1" />
                        <div>
                          <h3 className="font-medium mb-1">{t("Location Finder", "位置查找器")}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "Discover optimal astrophotography locations nearby",
                              "发现附近最佳的天文摄影地点"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ida" className="space-y-6">
                <Card className="bg-cosmic-800/50 border-cosmic-700">
                  <CardHeader>
                    <CardTitle>{t("International Dark-Sky Association", "国际暗夜协会")}</CardTitle>
                    <CardDescription>
                      {t("Protecting the night skies for present and future generations", "为当代和子孙后代保护夜空")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      {t(
                        "The International Dark-Sky Association (IDA) is the recognized authority on light pollution and is the leading organization combating light pollution worldwide.",
                        "国际暗夜协会（IDA）是光污染方面的公认权威，是全球抗击光污染的领先组织。"
                      )}
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-medium">{t("IDA Designations", "IDA认证")}</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-cosmic-700/30 rounded-lg flex items-start gap-3">
                          <Globe className="h-5 w-5 text-blue-400 mt-1" />
                          <div>
                            <h4 className="font-medium mb-1">{t("Dark Sky Reserve", "暗夜保护区")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t(
                                "A public or private land possessing an exceptional quality of starry nights and nocturnal environment that is specifically protected for its scientific, natural, educational, or cultural heritage, and/or for public enjoyment.",
                                "拥有出色的星空夜景和夜间环境的公共或私人土地，专门为其科学、自然、教育或文化遗产和/或公众享受而受到保护。"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-cosmic-700/30 rounded-lg flex items-start gap-3">
                          <Star className="h-5 w-5 text-green-400 mt-1" />
                          <div>
                            <h4 className="font-medium mb-1">{t("Dark Sky Park", "暗夜公园")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t(
                                "A park or other public land possessing exceptional starry skies and natural nocturnal habitat where light pollution is mitigated and natural darkness is valuable as an important educational, cultural, scenic, and natural resource.",
                                "拥有杰出星空和自然夜间栖息地的公园或其他公共土地，在那里光污染得到缓解，自然黑暗作为重要的教育、文化、风景和自然资源而受到珍视。"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-cosmic-700/30 rounded-lg flex items-start gap-3">
                          <Award className="h-5 w-5 text-amber-400 mt-1" />
                          <div>
                            <h4 className="font-medium mb-1">{t("Dark Sky Sanctuary", "暗夜保护地")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t(
                                "A public or private land that has an exceptional or distinguished quality of starry nights and a nocturnal environment that is protected for its scientific, natural, or educational value, its cultural heritage and/or public enjoyment.",
                                "拥有出色或卓越的星空夜景和夜间环境的公共或私人土地，因其科学、自然或教育价值、文化遗产和/或公众享受而受到保护。"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <Button asChild variant="outline">
                        <a href="https://www.darksky.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t("Visit IDA Website", "访问IDA网站")}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="siqs" className="space-y-6">
                <Card className="bg-cosmic-800/50 border-cosmic-700">
                  <CardHeader>
                    <CardTitle>{t("Stellar Imaging Quality Score (SIQS)", "恒星成像质量评分 (SIQS)")}</CardTitle>
                    <CardDescription>
                      {t("Understanding the factors that affect astrophotography", "了解影响天文摄影的因素")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      {t(
                        "The Stellar Imaging Quality Score (SIQS) is a comprehensive metric developed to evaluate the quality of astronomical viewing and imaging conditions at a specific location and time.",
                        "恒星成像质量评分 (SIQS) 是一种综合指标，用于评估特定位置和时间的天文观测和成像条件的质量。"
                      )}
                    </p>
                    
                    <h3 className="text-lg font-medium mt-4">{t("SIQS Factors", "SIQS因素")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Moon className="h-4 w-4 text-blue-300" />
                          {t("Light Pollution", "光污染")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "Measured by the Bortle scale (1-9), with lower numbers indicating darker skies.",
                            "由Bortle比例尺（1-9）衡量，较低的数字表示更暗的天空。"
                          )}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Cloud className="h-4 w-4 text-gray-300" />
                          {t("Cloud Coverage", "云层覆盖")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "The percentage of sky covered by clouds, with lower percentages being better.",
                            "被云层覆盖的天空百分比，百分比越低越好。"
                          )}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Wind className="h-4 w-4 text-cyan-300" />
                          {t("Wind Speed", "风速")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "Higher winds can cause vibrations in equipment, resulting in blurry images.",
                            "较高的风速会导致设备振动，从而产生模糊的图像。"
                          )}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Droplets className="h-4 w-4 text-blue-300" />
                          {t("Humidity", "湿度")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "High humidity can create haze and reduce visibility of celestial objects.",
                            "高湿度会产生薄雾并降低天体的可见度。"
                          )}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <MoonStar className="h-4 w-4 text-yellow-300" />
                          {t("Moon Phase", "月相")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "A full moon creates additional light that can wash out faint objects.",
                            "满月会产生额外的光线，可能会淡化微弱的天体。"
                          )}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-cosmic-700/30 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-purple-300" />
                          {t("Seeing Conditions", "视宁度")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            "Atmospheric turbulence affecting the steadiness of the image.",
                            "影响图像稳定性的大气湍流。"
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <Link to="/">
                        <Button variant="default" className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          {t("Try SIQS Calculator", "试用SIQS计算器")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
