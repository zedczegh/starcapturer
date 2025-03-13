
import React from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import SIQSCalculator from "@/components/SIQSCalculator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Star, Camera, Map, LocateFixed, CloudLightning } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <Hero />
      
      <section id="calculator-section" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-nebula-gradient -z-10" />
        
        {/* Background image for calculator section */}
        <div className="absolute inset-0 opacity-20 -z-10">
          <img 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" 
            alt={t("Starry lake", "星空湖泊")} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center max-w-3xl mx-auto">
            <div className="w-full animate-slide-up">
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-10 bg-primary mr-4" />
                <h2 className="text-lg font-medium text-primary">
                  {t("Calculate Your SIQS", "计算你的SIQS")}
                </h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-6">
                {t("Find Your Perfect ", "找到你完美的")}
                <span className="text-gradient-blue">
                  {t("Astrophotography Spot", "天文摄影地点")}
                </span>
              </h3>
              
              <p className="text-muted-foreground mb-8">
                {t(
                  "Enter your location details to calculate the Stellar Imaging Quality Score. AstroSIQS combines real-time weather data to provide a precise assessment for astrophotography.",
                  "输入您的位置详情以计算恒星成像质量分数。AstroSIQS结合实时天气数据，为天文摄影提供精确评估。"
                )}
              </p>
              
              <SIQSCalculator className="max-w-xl mx-auto shadow-lg" hideRecommendedPoints={true} noAutoLocationRequest={true} />
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-24 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cosmic-900/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1492321936769-b49830bc1d1e" 
            alt="Astronomy landscape" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-cosmic-glow -z-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            <span className="text-xs font-medium text-primary">
              {t("The Science Behind SIQS", "SIQS背后的科学")}
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-8 max-w-3xl mx-auto text-white">
            {t("Data-Driven ", "数据驱动的")}
            <span className="text-gradient-blue">
              {t("Astrophotography Planning", "天文摄影规划")}
            </span>
          </h2>
          
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-10">
            {t(
              "The Stellar Imaging Quality Score (SIQS) is a comprehensive metric that evaluates a location's suitability for astrophotography based on five critical factors.",
              "恒星成像质量分数（SIQS）是一个综合指标，基于五个关键因素评估地点适合天文摄影的程度。"
            )}
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <FeatureCard
              icon={<Star className="h-6 w-6 text-primary" />}
              title={t("Light Pollution", "光污染")}
              description={t(
                "Measures ambient light using the Bortle scale, which affects visibility of celestial objects.",
                "使用Bortle等级测量环境光，这影响天体的可见度。"
              )}
            />
            
            <FeatureCard
              icon={<LocateFixed className="h-6 w-6 text-primary" />}
              title={t("Seeing Conditions", "观测条件")}
              description={t(
                "Evaluates atmospheric stability which impacts image sharpness and clarity.",
                "评估大气稳定性，这影响图像的锐度和清晰度。"
              )}
            />
            
            <FeatureCard
              icon={<CloudLightning className="h-6 w-6 text-primary" />}
              title={t("Weather Data", "天气数据")}
              description={t(
                "Incorporates cloud cover, humidity, and wind speed from real-time meteorological sources.",
                "从实时气象源获取云量、湿度和风速数据。"
              )}
            />
          </div>
          
          <Button size="lg" className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90" asChild>
            <Link to="/about">
              {t("Learn More About SIQS", "了解更多关于SIQS")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      
      <section className="py-16 bg-cosmic-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
              <Map className="h-3.5 w-3.5 mr-2 text-primary" />
              <span className="text-xs font-medium text-primary">
                {t("Discover Photo Spots", "发现拍摄地点")}
              </span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              {t("Explore ", "探索")}
              <span className="text-gradient-blue">
                {t("Community Locations", "社区位置")}
              </span>
            </h2>
            
            <p className="text-muted-foreground max-w-2xl">
              {t(
                "Browse through our curated collection of astrophotography locations shared by the community. Find hidden gems with perfect conditions for your next shoot.",
                "浏览我们精选的社区分享的天文摄影地点。为你的下一次拍摄找到完美条件的隐藏宝地。"
              )}
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary/90 to-primary/70 hover:opacity-90" asChild>
              <Link to="/photo-points">
                <Camera className="mr-2 h-4 w-4" />
                {t("View All Photo Points", "查看所有拍摄点")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="bg-cosmic-900 border-t border-cosmic-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Star className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">
                Astro<span className="text-primary">SIQS</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6 md:mb-0">
              <Link to="/" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                {t("Home", "首页")}
              </Link>
              <Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                {t("About SIQS", "关于SIQS")}
              </Link>
              <Link to="/photo-points" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                {t("Explore Locations", "探索地点")}
              </Link>
              <Link to="/community" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                {t("Community", "社区")}
              </Link>
            </div>
            
            <div className="text-sm text-foreground/50">
              &copy; {new Date().getFullYear()} AstroSIQS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper component for feature cards
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glassmorphism p-6 rounded-xl text-left hover-card">
    <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
