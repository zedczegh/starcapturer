
import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";
import { cn } from "@/lib/utils";
import UtilitiesButton from "./UtilitiesButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavHeaderProps {
  scrolled: boolean;
  children?: React.ReactNode;
}

const NavHeader: React.FC<NavHeaderProps> = ({
  scrolled,
  children
}) => {
  const { language } = useLanguage();
  
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out", 
        scrolled ? "py-2 glassmorphism shadow-lg" : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-0 sm:px-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center space-x-2 z-20 transition-all duration-300 hover:opacity-80 hover:scale-[1.02]"
        >
          <Compass className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            {language === 'zh' ? (
              <span className="text-primary">趣小众</span>
            ) : (
              <><span className="text-primary">Meteo</span>tinary</>
            )}
          </span>
        </Link>
        
        {children}
        
        <div className="flex md:hidden items-center space-x-3">
          <UtilitiesButton />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
