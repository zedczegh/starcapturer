
import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

const ProfileFooter: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="mt-auto py-8 bg-cosmic-900/60 border-t border-cosmic-800/30">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Star className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-gray-200">
              {t("AstroSIQS", "天文SIQS")}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link to="/photo-points" className="text-sm text-gray-400 hover:text-primary transition-colors">
              {t("Photo Points", "拍摄点")}
            </Link>
            <Link to="/share" className="text-sm text-gray-400 hover:text-primary transition-colors">
              {t("Bortle Now", "实时光污染")}
            </Link>
            <Link to="/useful-links" className="text-sm text-gray-400 hover:text-primary transition-colors">
              {t("Resources", "资源")}
            </Link>
            <Link to="/about" className="text-sm text-gray-400 hover:text-primary transition-colors">
              {t("About SIQS", "关于SIQS")}
            </Link>
          </div>
          <div className="text-sm text-gray-500 mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} AstroSIQS
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ProfileFooter;
