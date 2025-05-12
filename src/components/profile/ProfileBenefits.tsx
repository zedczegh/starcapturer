
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2 } from 'lucide-react';

const ProfileBenefits = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-cosmic-800/60 to-cosmic-900/80 rounded-lg p-6 border border-cosmic-700/40 shadow-lg hover:shadow-cosmic-700/10 transition-all duration-300">
      <h3 className="font-medium text-cosmic-100 mb-4 flex items-center gap-2 pb-2 border-b border-cosmic-700/30">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        {t("Profile Benefits", "个人资料优势")}
      </h3>
      <ul className="space-y-3 text-cosmic-200">
        <li className="flex items-start gap-3 group hover:bg-cosmic-800/30 p-2 rounded-md transition-colors">
          <div className="min-w-5 mt-0.5 text-primary group-hover:scale-110 transition-transform">•</div>
          <span>{t("Personalized stargazing recommendations", "个性化的观星推荐")}</span>
        </li>
        <li className="flex items-start gap-3 group hover:bg-cosmic-800/30 p-2 rounded-md transition-colors">
          <div className="min-w-5 mt-0.5 text-primary group-hover:scale-110 transition-transform">•</div>
          <span>{t("Save favorite astronomy locations", "保存喜爱的天文位置")}</span>
        </li>
        <li className="flex items-start gap-3 group hover:bg-cosmic-800/30 p-2 rounded-md transition-colors">
          <div className="min-w-5 mt-0.5 text-primary group-hover:scale-110 transition-transform">•</div>
          <span>{t("Track your observation history", "跟踪您的观测历史")}</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfileBenefits;
