
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2 } from 'lucide-react';

const ProfileBenefits = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-cosmic-800/50 rounded-lg p-4 border border-cosmic-700/50">
      <h3 className="font-medium text-cosmic-100 mb-2 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        {t("Profile Benefits", "个人资料优势")}
      </h3>
      <ul className="space-y-2 text-cosmic-300">
        <li className="flex items-start gap-2">
          <div className="min-w-5 mt-1">•</div>
          <span>{t("Personalized stargazing recommendations", "个性化的观星推荐")}</span>
        </li>
        <li className="flex items-start gap-2">
          <div className="min-w-5 mt-1">•</div>
          <span>{t("Save favorite astronomy locations", "保存喜爱的天文位置")}</span>
        </li>
        <li className="flex items-start gap-2">
          <div className="min-w-5 mt-1">•</div>
          <span>{t("Track your observation history", "跟踪您的观测历史")}</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfileBenefits;
