
import React from "react";
import { Link } from "react-router-dom";
import { MoonStar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-cosmic-900 border-t border-cosmic-800 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-6 md:mb-0">
            <MoonStar className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-primary">SIQS</span>
            </span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6 md:mb-0">
            <Link to="/photo-points" className="text-sm text-foreground/70 hover:text-primary transition-colors">
              {t("Photo Points", "拍摄点")}
            </Link>
            <Link to="/share" className="text-sm text-foreground/70 hover:text-primary transition-colors">
              {t("Bortle Now", "实时光污染")}
            </Link>
            <Link to="/useful-links" className="text-sm text-foreground/70 hover:text-primary transition-colors">
              {t("Resources", "资源")}
            </Link>
            <Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors">
              {t("About SIQS", "关于SIQS")}
            </Link>
          </div>
          
          <div className="text-sm text-foreground/50">
            &copy; {new Date().getFullYear()} AstroSIQS
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
