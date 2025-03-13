
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Star, LocateFixed, CloudLightning } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import FeatureCard from "./FeatureCard";

const ScienceSection: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
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
  );
};

export default ScienceSection;
