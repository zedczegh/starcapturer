
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { AboutContent } from "@/components/about/AboutContent";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Map, Info, Camera } from "lucide-react";
import AboutHeader from "@/components/about/AboutHeader";
import AboutFooter from "@/components/about/AboutFooter";

const About = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 text-cosmic-50 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("Back to Home", "返回首页")}
            </Button>
          </Link>
        </div>
        
        <AboutHeader />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { 
                staggerChildren: 0.15,
                delayChildren: 0.1
              }
            }
          }}
          className="space-y-12"
        >
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard 
              icon={Star} 
              title={t("Sky Quality Index", "天空质量指数")}
              description={t(
                "Our advanced SIQS algorithm helps you find the perfect conditions for astrophotography and stargazing",
                "我们先进的SIQS算法帮助您找到适合天文摄影和观星的完美条件"
              )}
            />
            <FeatureCard 
              icon={Map} 
              title={t("Dark Sky Locations", "暗夜地点")}
              description={t(
                "Discover certified dark sky reserves and parks worldwide for the best stargazing experience",
                "探索全球认证的暗夜保护区和公园，获得最佳的观星体验"
              )}
            />
            <FeatureCard 
              icon={Camera} 
              title={t("Photo Points", "摄影点")}
              description={t(
                "Find optimal locations for astrophotography based on your current position and conditions",
                "根据您当前的位置和条件，找到最适合天文摄影的地点"
              )}
            />
          </div>
          
          <AboutContent />
          
          <AboutFooter />
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      className="bg-cosmic-800/40 backdrop-blur-sm border border-cosmic-700/50 p-6 rounded-xl shadow-lg"
    >
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-cosmic-50">{title}</h3>
      <p className="text-cosmic-300 text-sm">{description}</p>
    </motion.div>
  );
};

export default About;
