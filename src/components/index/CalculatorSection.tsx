
import React from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";

const CalculatorSection: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <section id="calculator-section" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-nebula-gradient -z-10" />
      
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
  );
};

export default CalculatorSection;
