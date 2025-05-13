
import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavHeaderProps {
  scrolled: boolean;
  children: React.ReactNode;
}

const NavHeader = ({ scrolled, children }: NavHeaderProps) => {
  const { t } = useLanguage();
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-cosmic-950/90 shadow-md backdrop-blur-md border-b border-cosmic-800/60"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/"
            className="mr-6 flex items-center space-x-2"
            aria-label={t("Home", "首页")}
          >
            <span className="font-bold text-lg hidden md:inline-block text-primary-foreground">
              SkyVision
            </span>
          </Link>
          {children}
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
