
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { linksData } from "@/components/links/linksData";

const getDarkSkyLinks = () => {
  // Return links with category/type/description mentioning "dark sky" or "暗夜"
  const keywords = ["dark sky", "暗夜", "暗空"];
  return linksData.filter(link => {
    const allText = [
      link.category,
      link.type,
      link.description,
      link.descriptionZh,
      link.title,
      link.titleZh
    ].join(" ").toLowerCase();
    return keywords.some(keyword => allText.includes(keyword));
  });
};

const AboutSiqsDarkSkyResources = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const darkSkyLinks = getDarkSkyLinks();

  if (darkSkyLinks.length === 0) return null;

  return (
    <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur">
      <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="text-blue-400" />
          {t("Dark Sky Resources", "暗夜资源")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
        <div className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 gap-4"}`}>
          {darkSkyLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/20 hover:bg-cosmic-800/50 hover:border-cosmic-700/40 transition-all flex flex-col gap-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs py-1 px-2 bg-cosmic-800/50 rounded-full text-cosmic-300">
                  {language === "en" ? link.category : link.category === "Data" ? "数据" : link.category}
                </span>
                <ExternalLink className="h-3 w-3 text-cosmic-500" />
              </div>
              <h4 className="text-sm font-medium text-cosmic-100">
                {language === "en" ? link.title : link.titleZh}
              </h4>
              <p className="text-xs text-cosmic-300 mt-1">
                {language === "en" ? link.description : link.descriptionZh}
              </p>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutSiqsDarkSkyResources;
