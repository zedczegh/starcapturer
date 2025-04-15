
import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, ArrowRight, Github, Twitter, BookOpen, Info } from "lucide-react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";
import NavBar from '@/components/NavBar';

interface PhotoPointsLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const PhotoPointsLayout: React.FC<PhotoPointsLayoutProps> = ({ 
  children,
  pageTitle
}) => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation();
  
  // Default page title
  const title = pageTitle || t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测");
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      
      <NavBar />
      
      <div className="pt-20 md:pt-28 pb-20 will-change-transform">
        <div className="container mx-auto px-4">
          {children}
          
          <motion.div 
            className="mt-12 text-center space-y-6 bg-cosmic-900/60 backdrop-blur-sm p-6 rounded-xl border border-cosmic-700/30 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
            }}
          >
            <motion.h3 
              className="text-xl font-semibold text-cosmic-100 flex items-center justify-center gap-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
              }}
            >
              {t("Ready to explore the night sky?", "准备探索夜空了吗？")}
              <ArrowRight className="h-4 w-4 text-blue-400" />
            </motion.h3>
            
            <motion.div 
              className="flex flex-wrap gap-4 justify-center"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
              }}
            >
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 transition-all">
                  <Home className="mr-2 h-4 w-4" />
                  {t("Return to Home", "返回首页")}
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="border-cosmic-400/30 hover:bg-cosmic-800/50 hover:border-cosmic-400/50 transition-colors"
                onClick={handleSIQSClick}
              >
                <Info className="mr-2 h-4 w-4 text-teal-400" />
                {t("Calculate SIQS", "计算SIQS")}
              </Button>
            </motion.div>
            
            <motion.div 
              className="mt-8"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
              }}
            >
              <div className="flex justify-center gap-4 pt-4">
                <a href="https://github.com/bortle-now" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-cosmic-200 transition-colors">
                  <Github size={20} />
                </a>
                <a href="https://twitter.com/bortlenow" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-cosmic-200 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="https://www.darksky.org" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-cosmic-200 transition-colors">
                  <BookOpen size={20} />
                </a>
              </div>
              
              <div 
                className="text-xs text-cosmic-400 mt-6 pt-4 border-t border-cosmic-700/20"
              >
                {t("Bortle Now © 2025 — Making astronomical observation accessible for everyone", "Bortle Now © 2025 — 让天文观测人人可及")}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PhotoPointsLayout;
