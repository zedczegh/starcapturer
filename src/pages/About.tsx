
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { AboutContent } from "@/components/about/AboutContent";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Map, Info, Camera, Moon, Telescope, GitHub } from "lucide-react";
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
          
          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <FeatureCard 
              icon={Moon} 
              title={t("Bortle Scale Analysis", "伯尔特尺度分析")}
              description={t(
                "Accurate light pollution assessment using our enhanced Bortle Scale algorithm with terrain correction",
                "使用我们增强的伯尔特尺度算法和地形校正进行精确的光污染评估"
              )}
              variant="secondary"
            />
            <FeatureCard 
              icon={Telescope} 
              title={t("Astronomy Conditions", "天文条件")}
              description={t(
                "Real-time weather, moon phase, and seeing conditions to help plan your stargazing sessions",
                "实时天气、月相和观测条件，帮助您规划观星活动"
              )}
              variant="secondary"
            />
          </div>
          
          <AboutContent />
          
          <div className="bg-cosmic-800/30 backdrop-blur-sm border border-cosmic-700/50 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-3 text-cosmic-50 flex items-center">
              <GitHub className="h-5 w-5 mr-2" />
              {t("Open Source", "开源项目")}
            </h3>
            <p className="text-cosmic-300">
              {t(
                "This project is open source and welcomes community contributions to improve astronomy accessibility worldwide.",
                "这是一个开源项目，欢迎社区贡献，以改善全球天文可及性。"
              )}
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="text-cosmic-200 border-cosmic-700 hover:border-cosmic-500">
                <GitHub className="h-4 w-4 mr-2" />
                {t("View on GitHub", "在GitHub上查看")}
              </Button>
            </div>
          </div>
          
          <AboutFooter />
        </motion.div>
      </div>
    </div>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  variant = "primary" 
}: { 
  icon: any; 
  title: string; 
  description: string;
  variant?: "primary" | "secondary";
}) => {
  const bgGradient = variant === "primary" 
    ? "bg-gradient-to-br from-blue-500 to-purple-600"
    : "bg-gradient-to-br from-emerald-500 to-blue-600";
    
  const cardBg = variant === "primary"
    ? "bg-cosmic-800/40"
    : "bg-cosmic-800/30";
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      className={`${cardBg} backdrop-blur-sm border border-cosmic-700/50 p-6 rounded-xl shadow-lg`}
    >
      <div className={`${bgGradient} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-cosmic-50">{title}</h3>
      <p className="text-cosmic-300 text-sm">{description}</p>
    </motion.div>
  );
};

export default About;
