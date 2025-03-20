
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import UsefulLinksSection from "@/components/UsefulLinksSection";

const AboutSIQS = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">{t("About Sky Image Quality Score (SIQS)", "关于天空图像质量评分 (SIQS)")}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("What is SIQS?", "什么是SIQS？")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {t(
                    "The Sky Image Quality Score (SIQS) is a comprehensive rating system designed specifically for astrophotographers to evaluate the quality of potential imaging locations based on multiple environmental factors.",
                    "天空图像质量评分（SIQS）是一个专为天文摄影师设计的综合评分系统，用于基于多种环境因素评估潜在成像位置的质量。"
                  )}
                </p>
                <p>
                  {t(
                    "SIQS provides a standardized way to assess and compare different locations for astrophotography, helping you find the perfect spot for your next imaging session.",
                    "SIQS提供了一种标准化的方法来评估和比较不同的天文摄影位置，帮助您为下一次成像会话找到完美的拍摄地点。"
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("Key Factors Analyzed", "关键分析因素")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">CC</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Cloud Cover", "云层覆盖")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The percentage of sky covered by clouds, directly impacting visibility of celestial objects.",
                          "被云层覆盖的天空百分比，直接影响天体的可见度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">LP</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Light Pollution (Bortle Scale)", "光污染（波特尔量表）")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "A numerical scale that quantifies the night sky's brightness due to artificial light.",
                          "一种量化由人工光源导致的夜空亮度的数值尺度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">SC</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Seeing Conditions", "视宁度")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The steadiness of the atmosphere, measured in arcseconds, affecting image sharpness.",
                          "大气稳定性，以角秒为单位测量，影响图像清晰度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">WS</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Wind Speed", "风速")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Higher wind speeds can cause telescope vibration and degrade image quality.",
                          "较高的风速会导致望远镜振动并降低图像质量。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">HM</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Humidity", "湿度")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Higher humidity increases dew risk on optical surfaces and can reduce transparency.",
                          "较高的湿度会增加光学表面结露的风险并可能降低透明度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-lg font-semibold">MP</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{t("Moon Phase", "月相")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The phase of the moon affects sky brightness and contrast for deep sky imaging.",
                          "月相影响深空成像的天空亮度和对比度。"
                        )}
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("How SIQS Works", "SIQS的工作原理")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {t(
                    "SIQS analyzes multiple environmental factors and combines them using our proprietary algorithm to generate a single score from 0-10 that represents the overall quality of a location for astrophotography.",
                    "SIQS分析多种环境因素，并使用我们专有的算法将它们组合在一起，生成一个从0-10的单一分数，代表天文摄影位置的整体质量。"
                  )}
                </p>
                <p>
                  {t(
                    "Each factor is weighted based on its relative importance to image quality, with cloud cover and light pollution having the most significant impact on the final score.",
                    "每个因素根据其对图像质量的相对重要性进行加权，其中云层覆盖和光污染对最终得分有最显著的影响。"
                  )}
                </p>
                <p>
                  {t(
                    "A location is considered viable for imaging if it meets our minimum threshold criteria, with higher scores indicating better conditions.",
                    "如果一个地点满足我们的最低阈值标准，则被认为适合成像，更高的分数表示更好的条件。"
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t("Score Interpretation", "分数解释")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t("Exceptional (8.0-10.0)", "卓越 (8.0-10.0)")}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "100%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Perfect conditions for all types of astrophotography", "适合所有类型天文摄影的完美条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t("Excellent (6.0-7.9)", "优秀 (6.0-7.9)")}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#8A9A5B] to-[#606C38]" style={{ width: "75%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Very good conditions for most imaging targets", "对大多数成像目标而言非常好的条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t("Good (4.0-5.9)", "良好 (4.0-5.9)")}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400" style={{ width: "50%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Acceptable conditions for brighter objects", "适合较亮天体的可接受条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t("Fair (2.0-3.9)", "一般 (2.0-3.9)")}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Limited imaging potential, consider planetary targets", "成像潜力有限，可考虑行星目标")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t("Poor (0.0-1.9)", "较差 (0.0-1.9)")}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: "15%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Not recommended for imaging", "不推荐用于成像")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Add the Useful Links section */}
        <UsefulLinksSection />
      </main>
    </div>
  );
};

export default AboutSIQS;
