import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const sections = [
  { id: "developer", labelEn: "Developer", labelZh: "开发者" },
  { id: "utilities", labelEn: "Utilities", labelZh: "工具" },
  { id: "siqs", labelEn: "SIQS System", labelZh: "SIQS系统" },
  { id: "darksky", labelEn: "Dark Sky", labelZh: "暗夜保护" },
  { id: "resources", labelEn: "Resources", labelZh: "资源" },
];

const AboutNavbar = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("developer");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.nav
      className="sticky top-16 z-40 bg-cosmic-900/80 backdrop-blur-md border-b border-cosmic-700 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="container max-w-4xl mx-auto px-5">
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${
                  activeSection === section.id
                    ? "bg-cosmic-600 text-white"
                    : "text-cosmic-300 hover:text-white hover:bg-cosmic-800/50"
                }
              `}
            >
              {t(section.labelEn, section.labelZh)}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default AboutNavbar;
