import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calculator } from 'lucide-react';

interface SiQSCalculatorSectionProps {
  className?: string;
}

const SiQSCalculatorSection: React.FC<SiQSCalculatorSectionProps> = ({ className }) => {
  const { t } = useLanguage();
  const barRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (barRef.current) {
        const rect = barRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if element is in viewport
        if (rect.top < windowHeight * 0.85 && rect.bottom > 0) {
          barRef.current.classList.add('extended');
        } else {
          barRef.current.classList.remove('extended');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check in case element is already in viewport
    setTimeout(handleScroll, 300);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <section className={`relative py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 ${className}`}>
      <div className="container px-4 mx-auto">
        <div className="flex flex-col gap-2 items-center text-center mb-12">
          <div className="flex items-center justify-center space-x-2">
            <Calculator className="h-7 w-7 text-primary animate-pulse" />
            <div className="flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {t("Sky Imaging Quality Score", "天空成像质量分数")}
              </h2>
              <div className="relative h-1 mt-2 w-full max-w-xs">
                <div ref={barRef} className="absolute left-0 h-full bg-primary rounded-full transition-all duration-1000 w-0 extending-bar"></div>
              </div>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl">
            {t(
              "Our advanced algorithm calculates the optimal conditions for astrophotography at your location.",
              "我们的高级算法计算您所在位置的最佳天文摄影条件。"
            )}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg shadow-md bg-card">
            <h3 className="text-xl font-semibold mb-4">{t("Real-time Conditions", "实时条件")}</h3>
            <p className="text-muted-foreground">{t("Get up-to-the-minute data for your location.", "获取您所在位置的最新数据。")}</p>
          </div>
          
          <div className="p-6 rounded-lg shadow-md bg-card">
            <h3 className="text-xl font-semibold mb-4">{t("Location Recommendations", "地点推荐")}</h3>
            <p className="text-muted-foreground">{t("Discover the best spots for astrophotography nearby.", "发现附近最适合天文摄影的地点。")}</p>
          </div>
          
          <div className="p-6 rounded-lg shadow-md bg-card">
            <h3 className="text-xl font-semibold mb-4">{t("Community Insights", "社区见解")}</h3>
            <p className="text-muted-foreground">{t("Share and view astrophotography experiences from other users.", "分享和查看其他用户的天文摄影体验。")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SiQSCalculatorSection;
