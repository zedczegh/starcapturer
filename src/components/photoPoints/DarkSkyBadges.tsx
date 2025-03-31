
import React from 'react';
import { Award, Shield, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DarkSkyCertificationType } from '@/lib/api/astroSpots';

interface DarkSkyBadgeProps {
  type: DarkSkyCertificationType;
}

const DarkSkyBadge: React.FC<DarkSkyBadgeProps> = ({ type }) => {
  const { t } = useLanguage();
  
  const getBadgeContent = () => {
    switch (type) {
      case 'goldtier':
        return {
          icon: <Shield className="h-3.5 w-3.5 text-amber-400" fill="rgba(251, 191, 36, 0.2)" />,
          text: t("Gold Tier", "金级认证"),
          className: "bg-amber-900/20 border-amber-700/30 text-amber-300"
        };
      case 'park':
        return {
          icon: <Award className="h-3.5 w-3.5 text-sky-400" fill="rgba(56, 189, 248, 0.2)" />,
          text: t("Dark Sky Park", "暗夜公园"),
          className: "bg-sky-900/20 border-sky-700/30 text-sky-300"
        };
      case 'reserve':
        return {
          icon: <Shield className="h-3.5 w-3.5 text-indigo-400" fill="rgba(99, 102, 241, 0.2)" />,
          text: t("Dark Sky Reserve", "暗夜保护区"),
          className: "bg-indigo-900/20 border-indigo-700/30 text-indigo-300"
        };
      case 'sanctuary':
        return {
          icon: <Star className="h-3.5 w-3.5 text-purple-400" fill="rgba(168, 85, 247, 0.2)" />,
          text: t("Dark Sky Sanctuary", "暗夜圣殿"),
          className: "bg-purple-900/20 border-purple-700/30 text-purple-300"
        };
      case 'community':
        return {
          icon: <Shield className="h-3.5 w-3.5 text-teal-400" fill="rgba(45, 212, 191, 0.2)" />,
          text: t("Dark Sky Community", "暗夜社区"),
          className: "bg-teal-900/20 border-teal-700/30 text-teal-300"
        };
    }
  };
  
  const { icon, text, className } = getBadgeContent() || {};
  
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${className}`}>
      {icon}
      <span className="text-xs">{text}</span>
    </div>
  );
};

const DarkSkyBadges: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium text-blue-300">
        {t("International Dark-Sky Association Certifications", "国际暗夜协会认证")}
      </h3>
      <div className="flex flex-wrap gap-2">
        <DarkSkyBadge type="goldtier" />
        <DarkSkyBadge type="park" />
        <DarkSkyBadge type="reserve" />
        <DarkSkyBadge type="sanctuary" />
        <DarkSkyBadge type="community" />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("These badges represent official designations by the International Dark-Sky Association, indicating locations with exceptional starry nights and protected dark skies.", 
           "这些徽章代表国际暗夜协会的官方认证，表示这些地点拥有极佳的夜空和受保护的暗夜环境。")}
      </p>
    </div>
  );
};

export default React.memo(DarkSkyBadges);
