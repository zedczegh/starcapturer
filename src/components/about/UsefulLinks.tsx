
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, ExternalLink, BookOpen, FileText, Video, Github } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResourceLink {
  title: string;
  titleZh: string;
  url: string;
  icon: React.ReactNode;
  category: string;
  categoryZh: string;
  description: string;
  descriptionZh: string;
}

const UsefulLinks = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  const resources: ResourceLink[] = [
    {
      title: "International Dark-Sky Association",
      titleZh: "国际暗夜协会",
      url: "https://www.darksky.org",
      icon: <BookOpen className="h-4 w-4 text-blue-400" />,
      category: "Dark Sky Conservation",
      categoryZh: "暗夜保护",
      description: "Leading organization in dark sky preservation",
      descriptionZh: "暗夜保护领域的领先组织"
    },
    {
      title: "Light Pollution Map",
      titleZh: "光污染地图",
      url: "https://www.lightpollutionmap.info",
      icon: <Link2 className="h-4 w-4 text-purple-400" />,
      category: "Research Tool",
      categoryZh: "研究工具",
      description: "Global light pollution visualization",
      descriptionZh: "全球光污染可视化"
    },
    {
      title: "NASA Night Sky Network",
      titleZh: "NASA夜空网络",
      url: "https://nightsky.jpl.nasa.gov",
      icon: <Link2 className="h-4 w-4 text-teal-400" />,
      category: "Education",
      categoryZh: "教育",
      description: "Astronomy education resources",
      descriptionZh: "天文教育资源"
    },
    {
      title: "Bortle Scale Guide",
      titleZh: "伯特尔等级指南",
      url: "https://skyandtelescope.org/astronomy-resources/light-pollution-bortle-scale/",
      icon: <FileText className="h-4 w-4 text-yellow-400" />,
      category: "Reference",
      categoryZh: "参考资料",
      description: "Understanding the Bortle Dark-Sky Scale",
      descriptionZh: "了解伯特尔暗空等级"
    },
    {
      title: "Astrophotography Tutorials",
      titleZh: "天文摄影教程",
      url: "https://www.lonelyspeck.com/",
      icon: <Video className="h-4 w-4 text-green-400" />,
      category: "Photography",
      categoryZh: "摄影",
      description: "Learn night sky photography techniques",
      descriptionZh: "学习夜空摄影技术"
    },
    {
      title: "Bortle Now Github",
      titleZh: "Bortle Now Github",
      url: "https://github.com/bortle-now",
      icon: <Github className="h-4 w-4 text-cosmic-400" />,
      category: "Development",
      categoryZh: "开发",
      description: "Open-source code repository",
      descriptionZh: "开源代码仓库"
    }
  ];

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="text-cosmic-400" />
            {t("Useful Resources", "实用资源")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <p className="mb-6 text-cosmic-200">
            {t(
              "Expand your knowledge about stargazing, light pollution, and astrophotography with these trusted resources.",
              "通过这些值得信赖的资源，扩展您对观星、光污染和天文摄影的知识。"
            )}
          </p>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} mt-4`}>
            {resources.map((resource, index) => (
              <a 
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer" 
                className="bg-cosmic-800/30 p-4 rounded-lg border border-cosmic-700/20 hover:bg-cosmic-800/50 hover:border-cosmic-700/40 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs py-1 px-2 bg-cosmic-800/50 rounded-full text-cosmic-300">
                    {language === 'en' ? resource.category : resource.categoryZh}
                  </span>
                  <ExternalLink className="h-3 w-3 text-cosmic-500" />
                </div>
                
                <div className="flex items-center gap-2">
                  {resource.icon}
                  <h4 className="text-sm font-medium text-cosmic-100">
                    {language === 'en' ? resource.title : resource.titleZh}
                  </h4>
                </div>
                
                <p className="text-xs text-cosmic-300 mt-1">
                  {language === 'en' ? resource.description : resource.descriptionZh}
                </p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UsefulLinks;
