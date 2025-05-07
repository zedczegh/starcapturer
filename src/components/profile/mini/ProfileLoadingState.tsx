
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const ProfileLoadingState: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
      {t("Loading...", "加载中...")}
    </div>
  );
};

export default ProfileLoadingState;
