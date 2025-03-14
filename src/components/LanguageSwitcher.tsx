
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleLanguage} 
      className="relative"
      title={t("Switch to " + (language === 'en' ? "Chinese" : "English"), 
             "切换到" + (language === 'en' ? "中文" : "英文"))}
    >
      <Globe className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
        {language === 'en' ? 'EN' : '中'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;
