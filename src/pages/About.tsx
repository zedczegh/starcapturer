
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, Moon, SunMoon, Lightbulb, Camera, Gauge, MapPin } from "lucide-react";
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

        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="text-cosmic-400" />
            {t("Bortle Now Sky Measurement", "Bortle Now 天空测量")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("Our in-app sky measurement tool gives you the ability to measure the actual brightness of your night sky using your device's camera. This provides a more accurate Bortle scale reading than estimates based on light pollution maps.", 
              "我们的应用内天空测量工具让您能够使用设备的相机测量夜空的实际亮度。这提供了比基于光污染地图的估计更准确的波特尔量表读数。")}
          </p>
          <p className="mb-4 text-cosmic-200">
            {t("The Bortle Now measurement system accounts for multiple factors that affect sky brightness readings:", 
              "Bortle Now 测量系统考虑了影响天空亮度读数的多种因素：")}
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 text-cosmic-200 ml-4">
            <li>{t("Camera sensor sensitivity and calibration", "相机传感器灵敏度和校准")}</li>
            <li>{t("Exposure time optimization for different devices", "为不同设备优化曝光时间")}</li>
            <li>{t("Zenith angle correction (measurement direction)", "天顶角校正（测量方向）")}</li>
            <li>{t("Airglow compensation", "大气辉光补偿")}</li>
            <li>{t("Logarithmic perception matching (Weber-Fechner law)", "对数感知匹配（韦伯-费希纳定律）")}</li>
            <li>{t("Magnitudes per square arcsecond (MPSAS) calculation", "每平方角秒星等（MPSAS）计算")}</li>
          </ul>
          <p className="text-cosmic-200">
            {t("When you take a sky brightness measurement with Bortle Now, we automatically update all relevant calculations for your location to provide the most accurate SIQS score possible.", 
              "当您使用Bortle Now进行天空亮度测量时，我们会自动更新您所在位置的所有相关计算，以提供最准确的SIQS评分。")}
          </p>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Gauge className="text-cosmic-400" />
            {t("Understanding SIQS Scores", "理解SIQS评分")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("The Sky Quality Index for Stargazing (SIQS) is our proprietary scoring system that ranges from 0 to 10, with higher scores indicating better viewing conditions:", 
              "观星天空质量指数（SIQS）是我们专有的评分系统，范围从0到10，较高的分数表示更好的观测条件：")}
          </p>
          <ul className="mb-6">
            <li className="flex items-center py-2 border-b border-cosmic-800">
              <div className="w-10 h-6 bg-green-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-green-400">8-10: </span>
                <span className="text-cosmic-200">{t("Excellent - Ideal conditions for all types of astronomical observation", "极佳 - 适合各种天文观测的理想条件")}</span>
              </div>
            </li>
            <li className="flex items-center py-2 border-b border-cosmic-800">
              <div className="w-10 h-6 bg-blue-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-blue-400">6-7.9: </span>
                <span className="text-cosmic-200">{t("Good - Very favorable for deep sky astrophotography", "良好 - 非常适合深空天文摄影")}</span>
              </div>
            </li>
            <li className="flex items-center py-2 border-b border-cosmic-800">
              <div className="w-10 h-6 bg-olive-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-olive-400">5-5.9: </span>
                <span className="text-cosmic-200">{t("Above Average - Good for most astronomy activities", "较好 - 适合大多数天文活动")}</span>
              </div>
            </li>
            <li className="flex items-center py-2 border-b border-cosmic-800">
              <div className="w-10 h-6 bg-yellow-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-yellow-400">4-4.9: </span>
                <span className="text-cosmic-200">{t("Average - Suitable for casual stargazing and bright objects", "一般 - 适合休闲观星和观察明亮天体")}</span>
              </div>
            </li>
            <li className="flex items-center py-2 border-b border-cosmic-800">
              <div className="w-10 h-6 bg-orange-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-orange-400">2-3.9: </span>
                <span className="text-cosmic-200">{t("Poor - Limited to brighter celestial objects", "较差 - 仅限于较亮的天体")}</span>
              </div>
            </li>
            <li className="flex items-center py-2">
              <div className="w-10 h-6 bg-red-500/80 mr-3 rounded"></div>
              <div>
                <span className="font-medium text-red-400">0-1.9: </span>
                <span className="text-cosmic-200">{t("Bad - Not recommended for astronomical observations", "糟糕 - 不建议进行天文观测")}</span>
              </div>
            </li>
          </ul>
          <p className="text-cosmic-200">
            {t("Our SIQS scores are continuously refined through real-world user measurements and feedback from astronomers around the world.", 
              "我们的SIQS评分通过来自世界各地天文学家的实际用户测量和反馈不断完善。")}
          </p>
        </div>

        <div className="bg-cosmic-900 rounded-lg p-6 mb-8 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="text-cosmic-400" />
            {t("Global Coverage", "全球覆盖")}
          </h2>
          <p className="mb-4 text-cosmic-200">
            {t("Bortle Now provides worldwide coverage with specialized data for many regions:", 
              "Bortle Now提供全球覆盖，为许多地区提供专业数据：")}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4 md:grid-cols-3">
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("North America", "北美洲")}
            </div>
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("Europe", "欧洲")}
            </div>
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("Asia", "亚洲")}
            </div>
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("Australia", "澳大利亚")}
            </div>
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("South America", "南美洲")}
            </div>
            <div className="bg-cosmic-800/50 p-3 rounded text-center text-cosmic-200">
              {t("Africa", "非洲")}
            </div>
          </div>
          <p className="text-cosmic-200">
            {t("Our database includes enhanced accuracy for regions in China, with specialized light pollution data for major cities and rural areas.", 
              "我们的数据库为中国地区提供了增强的准确性，为主要城市和农村地区提供专门的光污染数据。")}
          </p>
        </div>
        
        <div className="bg-cosmic-900 rounded-lg p-6 shadow-md shadow-cosmic-800/50">
          <h2 className="text-2xl font-semibold mb-4">
            {t("Useful Links", "有用链接")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://www.darksky.org", "_blank")}>
              <span>{t("International Dark-Sky Association", "国际暗空协会")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://www.globeatnight.org", "_blank")}>
              <span>{t("Globe at Night Project", "Globe at Night 项目")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://www.darkskymeter.com", "_blank")}>
              <span>{t("Dark Sky Meter App", "暗空测量应用")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://www.lightpollutionmap.info", "_blank")}>
              <span>{t("Light Pollution Map", "光污染地图")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://www.cleardarksky.com/csk", "_blank")}>
              <span>{t("Clear Dark Sky Charts", "晴朗暗空图表")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://bortlenow.app", "_blank")}>
              <span>{t("Bortle Now Mobile App", "Bortle Now 移动应用")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://bortlenow.com/blog", "_blank")}>
              <span>{t("Bortle Now Astrophotography Blog", "Bortle Now天文摄影博客")}</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="border-cosmic-700 text-cosmic-200 hover:bg-cosmic-800 hover:text-cosmic-50 flex justify-between" onClick={() => window.open("https://bortlenow.com/community", "_blank")}>
              <span>{t("Bortle Now Community", "Bortle Now社区")}</span>
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
