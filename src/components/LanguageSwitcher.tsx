
import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = "ghost", 
  size = "sm",
  className = ""
}) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`flex items-center ${className}`} 
      onClick={toggleLanguage}
    >
      <Globe className="h-4 w-4 mr-1" />
      {language === 'en' ? "中文" : "English"}
    </Button>
  );
};

export default LanguageSwitcher;
