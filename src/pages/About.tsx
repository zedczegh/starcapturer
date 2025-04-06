
import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { AboutContent } from "@/components/about/AboutContent";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AboutHeader from "@/components/about/AboutHeader";
import AboutFooter from "@/components/about/AboutFooter";

const About = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t("Back", "返回")}
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
          className="space-y-8"
        >
          <AboutContent />
          
          <AboutFooter />
        </motion.div>
      </div>
    </div>
  );
};

export default About;
