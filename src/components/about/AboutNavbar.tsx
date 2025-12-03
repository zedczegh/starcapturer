import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ShieldAlert } from "lucide-react";

const baseSections = [
  { id: "developer", labelEn: "Developer", labelZh: "开发者", path: "/about/developer" },
  { id: "utilities", labelEn: "Utilities", labelZh: "工具", path: "/about/utilities" },
  { id: "siqs", labelEn: "SIQS System", labelZh: "SIQS系统", path: "/about/siqs" },
  { id: "darksky", labelEn: "Dark Sky", labelZh: "暗夜保护", path: "/about/darksky" },
  { id: "resources", labelEn: "Resources", labelZh: "资源", path: "/about/resources" },
];

const AboutNavbar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();

  const isActive = (path: string) => location.pathname === path;

  const sections = isAdmin 
    ? [...baseSections, { id: "accounts", labelEn: "Accounts", labelZh: "账户", path: "/about/accounts", isAdmin: true }]
    : baseSections;

  return (
    <motion.nav
      className="sticky top-16 z-40 bg-cosmic-900/80 backdrop-blur-md border-b border-cosmic-700 mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="container max-w-4xl mx-auto px-0 sm:px-5 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => navigate(section.path)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5
                ${
                  isActive(section.path)
                    ? section.id === "accounts" 
                      ? "bg-purple-600 text-white"
                      : "bg-cosmic-600 text-white"
                    : section.id === "accounts"
                      ? "text-purple-300 hover:text-white hover:bg-purple-800/50"
                      : "text-cosmic-300 hover:text-white hover:bg-cosmic-800/50"
                }
              `}
            >
              {section.id === "accounts" && <ShieldAlert className="h-3.5 w-3.5" />}
              {t(section.labelEn, section.labelZh)}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default AboutNavbar;
