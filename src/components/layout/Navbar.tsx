
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const Navbar = () => {
  const { t } = useLanguage();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cosmic-950/80 backdrop-blur-md border-b border-cosmic-800/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/80 transition">
              SIQS
            </Link>
            
            <div className="hidden md:flex space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/photo-points">
                  {t("Photo Points", "摄影点")}
                </Link>
              </Button>
              
              <Button asChild variant="ghost" size="sm">
                <Link to="/calculator">
                  {t("Calculator", "计算器")}
                </Link>
              </Button>
              
              <Button asChild variant="ghost" size="sm">
                <Link to="/about">
                  {t("About", "关于")}
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};
