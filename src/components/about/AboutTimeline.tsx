
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimelineEvent {
  year: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  highlight?: boolean;
}

const timelineEvents: TimelineEvent[] = [
  {
    year: "2023",
    title: "Project Inception",
    titleZh: "项目启动",
    description: "Bortle Now started as a small project to help amateur astronomers find the best viewing conditions.",
    descriptionZh: "Bortle Now 最初是一个小项目，旨在帮助业余天文学家找到最佳的观测条件。",
  },
  {
    year: "2024",
    title: "Beta Launch",
    titleZh: "测试版发布",
    description: "First public beta with limited features covering major cities worldwide.",
    descriptionZh: "首次公开测试版，提供有限功能，覆盖全球主要城市。",
  },
  {
    year: "2025",
    title: "Global Release",
    titleZh: "全球发布",
    description: "Official launch with comprehensive coverage and the SIQS algorithm.",
    descriptionZh: "正式发布，提供全面覆盖和SIQS算法。",
    highlight: true,
  },
  {
    year: "Future",
    title: "Expanding Horizons",
    titleZh: "拓展视野",
    description: "Upcoming features include real-time updates and international dark sky location partnerships.",
    descriptionZh: "即将推出的功能包括实时更新和国际暗空地点合作伙伴关系。",
  },
];

const AboutTimeline = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  // Animation for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-cosmic-900 border-cosmic-700/50 overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-3 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="text-cosmic-400" />
            {t("Our Journey", "我们的旅程")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="relative">
            {/* Vertical timeline line */}
            {!isMobile && (
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-cosmic-700/30 z-0"></div>
            )}

            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={index} className={`relative ${isMobile ? '' : 'pl-12'}`}>
                  {!isMobile && (
                    <div className={`absolute left-0 top-0 h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                      event.highlight 
                        ? 'bg-blue-500/20 border-2 border-blue-400/50' 
                        : 'bg-cosmic-800 border border-cosmic-700/50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        event.highlight ? 'text-blue-400' : 'text-cosmic-300'
                      }`}>{event.year}</span>
                    </div>
                  )}

                  <div className={`bg-cosmic-800/30 rounded-lg p-4 border ${
                    event.highlight 
                      ? 'border-blue-500/30 bg-cosmic-800/40' 
                      : 'border-cosmic-700/30'
                  }`}>
                    {isMobile && (
                      <span className={`inline-block px-2 py-1 rounded text-xs mb-2 ${
                        event.highlight 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-cosmic-800/70 text-cosmic-300'
                      }`}>
                        {event.year}
                      </span>
                    )}
                    <h3 className="font-medium text-base text-cosmic-100 mb-1">
                      {language === 'en' ? event.title : event.titleZh}
                    </h3>
                    <p className="text-sm text-cosmic-300">
                      {language === 'en' ? event.description : event.descriptionZh}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AboutTimeline;
