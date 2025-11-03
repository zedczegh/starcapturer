
import React from "react";
import { Link } from "react-router-dom";
import { Compass, Github, Twitter, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AstroFooter: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="w-full bg-cosmic-900/80 border-t border-cosmic-800/30 py-8 relative z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Compass className="h-5 w-5 text-primary mr-2" />
            <span className="font-bold text-lg text-cosmic-100">
              {language === 'zh' ? (
                <span className="text-primary">趣小众</span>
              ) : (
                <><span className="text-primary">Meteo</span>tinary</>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-4 md:mb-0">
            <Link to="/photo-points" className="text-sm text-cosmic-300 hover:text-primary transition-colors">
              {t("Stargazing Points", "观星点")}
            </Link>
            <Link to="/share" className="text-sm text-cosmic-300 hover:text-primary transition-colors">
              {t("Bortle Now", "实时光污染")}
            </Link>
            <Link to="/useful-links" className="text-sm text-cosmic-300 hover:text-primary transition-colors">
              {t("Resources", "资源")}
            </Link>
            <Link to="/about" className="text-sm text-cosmic-300 hover:text-primary transition-colors">
              {t("About", "关于")}
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <a href="https://github.com/bortle-now" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-primary transition-colors">
              <Github size={18} />
            </a>
            <a href="https://twitter.com/bortlenow" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-primary transition-colors">
              <Twitter size={18} />
            </a>
            <a href="https://www.darksky.org" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-primary transition-colors">
              <BookOpen size={18} />
            </a>
          </div>
          <div className="text-xs text-cosmic-400 mt-2 md:mt-0">
            &copy; {new Date().getFullYear()} {t("Meteotinary", "趣小众")}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AstroFooter;
