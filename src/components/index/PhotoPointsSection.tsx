
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Map, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PhotoPointsSection: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <section className="py-16 bg-cosmic-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
            <Map className="h-3.5 w-3.5 text-primary mr-2" />
            <span className="text-xs font-medium text-primary">
              {t("Discover Photo Spots", "发现拍摄地点")}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">
            {t("Explore ", "探索")}
            <span className="text-gradient-blue">
              {t("Premium Locations", "优质位置")}
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Find the perfect locations for astrophotography with optimal viewing conditions. Our algorithm identifies the best spots based on SIQS factors.",
              "寻找具有最佳观测条件的天文摄影理想地点。我们的算法根据SIQS因素识别最佳地点。"
            )}
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-2 bg-cosmic-700/20 border border-cosmic-600/20 p-2 rounded-lg">
            <Award className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-200">
              {t(
                "Featuring official Dark Sky certified locations from around the world!",
                "收录来自世界各地的官方认证暗夜区域！"
              )}
            </p>
          </div>
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
  );
};

export default PhotoPointsSection;
