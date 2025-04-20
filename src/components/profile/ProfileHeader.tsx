
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const ProfileHeader = () => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center md:text-left">
      <h1 className="text-3xl font-bold text-white mb-2">
        {t("Profile", "个人资料")}
      </h1>
      <p className="text-cosmic-300">
        {t("Update your personal information", "更新您的个人信息")}
      </p>
    </div>
  );
};

export default ProfileHeader;
