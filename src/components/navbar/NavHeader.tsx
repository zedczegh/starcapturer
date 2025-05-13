
import React from 'react';
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavHeaderProps {
  scrolled: boolean;
  children: React.ReactNode;
}

const NavHeader: React.FC<NavHeaderProps> = ({ scrolled, children }) => {
  const { t } = useLanguage();
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-cosmic-900/90 backdrop-blur-sm shadow-md shadow-cosmic-950/20 h-16"
          : "bg-cosmic-900/50 h-20"
      )}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Star className="h-6 w-6 mr-2 text-primary" />
            <span className="text-lg font-medium text-white">
              {t("StarlightIQ", "星光IQ")}
            </span>
          </Link>
        </div>

        {children}
      </div>
    </header>
  );
};

export default NavHeader;
