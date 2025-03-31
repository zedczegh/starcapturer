
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Map, Award, Shield } from "lucide-react";
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
              {t("Community Locations", "社区位置")}
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Browse through our curated collection of astrophotography locations shared by the community. Find hidden gems with perfect conditions for your next shoot.",
              "浏览我们精选的社区分享的天文摄影地点。为你的下一次拍摄找到完美条件的隐藏宝地。"
            )}
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-2 bg-cosmic-700/20 border border-cosmic-600/20 p-2 rounded-lg">
            <Award className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-blue-200">
              {t(
                "Now featuring official Dark Sky certified locations from around the world!",
                "现已收录来自世界各地的官方认证暗夜区域！"
              )}
            </p>
          </div>
          
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-800/20 px-3 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-blue-300">
                {t("IDA Gold Tier", "IDA金级认证")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-800/20 px-3 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-blue-300">
                {t("Dark Sky Parks", "暗夜公园")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-800/20 px-3 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-blue-300">
                {t("Dark Sky Reserves", "暗夜保护区")}
              </span>
            </div>
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
