
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ProfileButton = () => {
  const { t } = useLanguage();
  
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
      <User className="h-5 w-5" />
      <span className="sr-only">{t("Account", "账户")}</span>
    </Button>
  );
};

export default ProfileButton;
