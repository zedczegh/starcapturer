
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Moon, SunMoon, Lightbulb } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const About = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {t("About Bortle Now", "关于 Bortle Now")}
        </h1>
        
        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <SunMoon className="text-cosmic-400" />
            {t("Our Mission", "我们的使命")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("Bortle Now helps astrophotographers find ideal viewing conditions by providing real-time Sky Quality Index (SIQS) scores. Our platform combines light pollution data, weather forecasts, and astronomical conditions to help you plan perfect stargazing sessions.", 
              "Bortle Now 通过提供实时天空质量指数（SIQS）评分，帮助天文摄影师找到理想的观测条件。我们的平台结合了光污染数据、天气预报和天文条件，帮助您规划完美的观星活动。")}
          </p>
          <p className="text-cosmic-200">
            {t("We're passionate about making astronomy accessible to everyone, from beginners to professionals. Our goal is to create a global community of stargazers who can share their experiences and dark sky locations.", 
              "我们热衷于让天文学变得人人可及，从初学者到专业人士。我们的目标是创建一个全球观星者社区，人们可以在这里分享他们的经验和暗空地点。")}
          </p>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="text-cosmic-400" />
            {t("What is Bortle Now?", "什么是 Bortle Now？")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("Bortle Now is a comprehensive application that helps astrophotographers and stargazers find the best locations and times for observing the night sky. Our platform uses the Bortle scale (a measure of light pollution) combined with real-time weather data to calculate the Sky Quality Index for Stargazing (SIQS).", 
              "Bortle Now 是一个综合应用程序，帮助天文摄影师和观星者找到观测夜空的最佳位置和时间。我们的平台使用波特尔量表（一种光污染测量方法）结合实时天气数据来计算观星天空质量指数（SIQS）。")}
          </p>
          <p className="mb-4 text-cosmic-200">
            {t("Our algorithm processes multiple factors including:", 
              "我们的算法处理多种因素，包括：")}
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-cosmic-200 ml-4">
            <li>{t("Light pollution levels (Bortle scale)", "光污染水平（波特尔量表）")}</li>
            <li>{t("Cloud cover percentage", "云层覆盖百分比")}</li>
            <li>{t("Humidity levels", "湿度水平")}</li>
            <li>{t("Wind speed", "风速")}</li>
            <li>{t("Seeing conditions (atmospheric stability)", "视宁度（大气稳定性）")}</li>
            <li>{t("Moon phase and position", "月相和位置")}</li>
            <li>{t("Air quality index", "空气质量指数")}</li>
          </ul>
          <p className="text-cosmic-200">
            {t("The result is a single score from 0-10 that represents how ideal conditions are for astrophotography and stargazing at any given location and time.", 
              "结果是一个从0-10的单一分数，代表任何给定位置和时间的天文摄影和观星条件有多理想。")}
          </p>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Star className="text-cosmic-400" />
            {t("Features", "功能")}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-cosmic-100">
                {t("Real-time SIQS Calculation", "实时SIQS计算")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200">
                {t("Get instant Sky Quality Index scores for your current location or any place worldwide. Our algorithm processes multiple environmental factors to provide accurate stargazing forecasts.", 
                  "获取您当前位置或世界任何地方的即时天空质量指数评分。我们的算法处理多种环境因素，提供准确的观星预报。")}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-cosmic-100">
                {t("Light Pollution Mapping", "光污染地图")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200">
                {t("Accurate Bortle scale measurements help you understand light pollution levels in your area. Our database includes thousands of locations globally with verified Bortle scale readings.", 
                  "准确的波特尔量表测量帮助您了解您所在地区的光污染水平。我们的数据库包括全球数千个具有经过验证的波特尔量表读数的位置。")}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-cosmic-100">
                {t("Weather Integration", "天气集成")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200">
                {t("Our platform incorporates real-time weather data including cloud cover, humidity, wind speed, and air quality to provide comprehensive viewing condition forecasts.", 
                  "我们的平台集成了实时天气数据，包括云层覆盖、湿度、风速和空气质量，以提供全面的观测条件预报。")}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-cosmic-100">
                {t("Dark Sky Camera", "暗空相机")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200">
                {t("Measure the actual brightness of your night sky using your device's camera. This feature helps calibrate our estimates and provides you with real-time sky brightness measurements.", 
                  "使用您设备的相机测量夜空的实际亮度。此功能有助于校准我们的估计，并为您提供实时的天空亮度测量。")}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-cosmic-100">
                {t("Astro Spot Sharing", "天文点分享")}
              </AccordionTrigger>
              <AccordionContent className="text-cosmic-200">
                {t("Discover and share dark sky locations with the community. Find verified dark sky reserves, astronomy parks, and user-recommended viewing spots.", 
                  "与社区发现和分享暗空位置。查找经过验证的暗空保护区、天文公园和用户推荐的观测点。")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Moon className="text-cosmic-400" />
            {t("The Science Behind Bortle Now", "Bortle Now背后的科学")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("The Bortle scale, developed by John Bortle in 2001, is a nine-level numeric scale that measures the night sky's brightness at a particular location. It ranges from Class 1 (excellent dark-sky sites) to Class 9 (inner-city skies).", 
              "波特尔量表由John Bortle于2001年开发，是一个九级数字量表，用于测量特定位置的夜空亮度。它的范围从1级（优秀的暗空地点）到9级（市中心天空）。")}
          </p>
          <p className="mb-4 text-cosmic-200">
            {t("Our SIQS algorithm builds upon the Bortle scale by incorporating dynamic factors like weather conditions, moon phase, and seeing conditions. This provides a more comprehensive and real-time assessment of stargazing quality.", 
              "我们的SIQS算法在波特尔量表的基础上，结合了天气条件、月相和视宁度等动态因素。这提供了更全面和实时的观星质量评估。")}
          </p>
          <p className="text-cosmic-200">
            {t("We've calibrated our measurements against professional sky quality meters (SQMs) and the Dark Sky Meter app to ensure our results align with industry standards while making them accessible to everyone without specialized equipment.", 
              "我们已经根据专业的天空质量仪（SQMs）和Dark Sky Meter应用程序校准了我们的测量，以确保我们的结果与行业标准一致，同时使它们对没有专业设备的每个人都可以使用。")}
          </p>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4">
            {t("Useful Links", "有用链接")}
          </h2>
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
              <Button className="w-full bg-cosmic-700 hover:bg-cosmic-600">
                {t("Return to Home", "返回首页")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
