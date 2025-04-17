
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const NavBarLegacy = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-primary font-bold text-xl">AstroSpot</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/photo-points" className="border-transparent text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                {t("Photo Points", "摄影点")}
              </Link>
              <Link to="/about-siqs" className="border-transparent text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                {t("About SIQS", "关于SIQS")}
              </Link>
              <Link to="/useful-links" className="border-transparent text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                {t("Useful Links", "有用链接")}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleLanguage}>
              {language === 'en' ? '中文' : 'EN'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBarLegacy;
