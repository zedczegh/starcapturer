import React, { useEffect } from "react";
import { motion } from "framer-motion";
import NavBar from "@/components/NavBar";
import AboutNavbar from "@/components/about/AboutNavbar";
import PersonalIntro from "@/components/about/PersonalIntro";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const DeveloperPage = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-16 relative overflow-hidden">
      <NavBar />
      
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 2 + 1}px`,
              width: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.4 + 0.2
            }}
            animate={{
              opacity: [
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.6 + 0.3,
                Math.random() * 0.4 + 0.2
              ]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>

      <div className="container max-w-4xl mx-auto px-5 py-8 md:py-10 relative z-10 pt-20">
        <div className="flex items-center mb-2">
          <Link to="/about">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t("Back to About", "返回关于页面")}
            </Button>
          </Link>
        </div>

        <motion.h1
          className="text-4xl font-bold text-cosmic-50 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t("About the Developer", "关于开发者")}
        </motion.h1>

        <AboutNavbar />

        <section id="developer" className="mt-8">
          <PersonalIntro />
        </section>
      </div>
    </div>
  );
};

export default DeveloperPage;
