
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MapPin, 
  Star, 
  Cloud, 
  Moon, 
  Search,
  CalendarCheck,
  Award,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const About = () => {
  const { t, language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {t("About AstroFinder", "关于天文观测点查找器")}
      </h1>
      
      <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center mb-4">
          <Info className="h-6 w-6 mr-3 text-primary" />
          <h2 className="text-xl font-semibold">
            {t("What is AstroFinder?", "什么是天文观测点查找器?")}
          </h2>
        </div>
        
        <p className="mb-4 text-muted-foreground">
          {t(
            "AstroFinder helps astronomy enthusiasts find ideal locations for stargazing and astrophotography with real-time sky quality information and forecasts.",
            "天文观测点查找器帮助天文爱好者找到理想的观星和天文摄影地点，提供实时天空质量信息和预报。"
          )}
        </p>
      </Card>
      
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Star className="h-5 w-5 mr-2 text-yellow-400" />
        {t("Key Features", "主要功能")}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Feature 1 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("Location Discovery", "位置发现")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Find certified dark sky locations and calculated astronomy spots with detailed quality scores.",
                  "找到认证的暗夜保护区和计算出的天文观测点，附带详细的质量评分。"
                )}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Feature 2 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("SIQS Ratings", "SIQS评分系统")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Stellar Imaging Quality Score (SIQS) provides a 0-10 rating of observation conditions based on multiple factors.",
                  "恒星成像质量评分 (SIQS) 根据多种因素提供0-10的观测条件评级。"
                )}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Feature 3 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("Real-time Weather", "实时天气")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Check current cloud cover, seeing conditions, humidity, and other astronomy-relevant weather factors.",
                  "查看当前的云层覆盖、大气稳定性、湿度和其他天文相关天气因素。"
                )}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Feature 4 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("Nighttime Focus", "夜间数据")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Optimized for nighttime astronomy with specialized calculations for evening to morning hours.",
                  "专为夜间天文观测优化，对晚上到早晨时段进行特殊计算。"
                )}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Feature 5 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("Interactive Maps", "交互式地图")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Explore locations on interactive maps with color-coded markers based on quality scores.",
                  "在交互式地图上探索位置，通过基于质量评分的颜色编码标记进行导航。"
                )}
              </p>
            </div>
          </div>
        </Card>
        
        {/* Feature 6 */}
        <Card className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
              <CalendarCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">
                {t("Forecasts", "预报")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "View hourly and multi-day forecasts to plan your astronomy sessions in advance.",
                  "查看每小时和多日预报，提前规划您的天文观测活动。"
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-amber-400" />
          {t("Dark Sky Certification", "暗夜保护区认证")}
        </h2>
        <p className="text-muted-foreground mb-4">
          {t(
            "AstroFinder includes officially certified dark sky locations from the International Dark-Sky Association (IDA) and other recognized organizations. These locations are specifically protected to maintain their pristine night skies.",
            "天文观测点查找器包括来自国际暗夜协会 (IDA) 和其他认可组织的官方认证暗夜地点。这些地点受到专门保护，以维持其原始的夜空。"
          )}
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2 text-blue-400" />
          {t("SIQS Factors", "SIQS因素")}
        </h2>
        <p className="text-muted-foreground mb-2">
          {t(
            "The Stellar Imaging Quality Score (SIQS) considers multiple factors including:",
            "恒星成像质量评分 (SIQS) 考虑多个因素，包括："
          )}
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>{t("Cloud cover percentage", "云层覆盖百分比")}</li>
          <li>{t("Light pollution (Bortle scale)", "光污染 (波特尔量表)")}</li>
          <li>{t("Seeing conditions", "大气稳定性")}</li>
          <li>{t("Humidity levels", "湿度水平")}</li>
          <li>{t("Wind speed", "风速")}</li>
          <li>{t("Moon phase", "月相")}</li>
          <li>{t("Air quality", "空气质量")}</li>
        </ul>
      </div>
      
      <div className="text-center text-sm text-muted-foreground mt-12">
        <p>© {new Date().getFullYear()} AstroFinder</p>
        <p className="mt-1">
          {t(
            "Created for astronomy enthusiasts and astrophotographers",
            "为天文爱好者和天文摄影师创建"
          )}
        </p>
      </div>
    </div>
  );
};

export default About;
