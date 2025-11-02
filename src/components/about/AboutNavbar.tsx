import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutNavbar = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["developer", "utilities", "siqs", "darksky", "resources"];
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const navItems = [
    { id: "developer", label: t("Developer", "开发者") },
    { id: "utilities", label: t("Utilities", "工具") },
    { id: "siqs", label: t("SIQS", "SIQS") },
    { id: "darksky", label: t("Dark Sky", "暗夜") },
    { id: "resources", label: t("Resources", "资源") },
  ];

  return (
    <motion.nav
      className="sticky top-16 z-40 bg-cosmic-900/80 backdrop-blur-md border-b border-cosmic-700 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeSection === item.id
                ? "text-cosmic-50 bg-cosmic-700"
                : "text-cosmic-300 hover:text-cosmic-50 hover:bg-cosmic-800/50"
            }`}
          >
            {item.label}
            {activeSection === item.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                layoutId="activeSection"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </motion.nav>
  );
};

export default AboutNavbar;
