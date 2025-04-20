
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2 } from 'lucide-react';

const ProfileBenefits = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-cosmic-800/30 backdrop-blur-sm rounded-lg p-6 border border-cosmic-700/30 hover:bg-cosmic-800/40 transition-all duration-300 animate-fade-in">
      <h3 className="font-medium text-cosmic-100 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        {t("Profile Benefits", "个人资料优势")}
      </h3>
      <ul className="space-y-3 text-cosmic-300">
        <li className="flex items-start gap-3">
          <div className="text-primary mt-1">•</div>
          <span className="opacity-90 hover:opacity-100 transition-opacity">{t("Personalized stargazing recommendations", "个性化的观星推荐")}</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="text-primary mt-1">•</div>
          <span className="opacity-90 hover:opacity-100 transition-opacity">{t("Save favorite astronomy locations", "保存喜爱的天文位置")}</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="text-primary mt-1">•</div>
          <span className="opacity-90 hover:opacity-100 transition-opacity">{t("Track your observation history", "跟踪您的观测历史")}</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfileBenefits;
