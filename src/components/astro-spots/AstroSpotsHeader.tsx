
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface AstroSpotsHeaderProps {
  spotsCount: number;
  editMode: boolean;
  onToggleEditMode: () => void;
}

const AstroSpotsHeader: React.FC<AstroSpotsHeaderProps> = ({ 
  spotsCount, 
  editMode, 
  onToggleEditMode 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm mb-1">
          {t("My AstroSpots", "我的观星点")}
        </h1>
        <p className="text-cosmic-300">
          {t("Manage and track your favorite astronomical observation locations", "管理和追踪您最喜欢的天文观测地点")}
        </p>
      </div>
      {spotsCount > 0 && (
        <Button
          variant={editMode ? "default" : "outline"}
          size="sm"
          className={`
            font-semibold rounded-full px-5 py-2 shadow 
            transition-all
            ${editMode 
              ? "bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 text-white border-0 hover:from-purple-700 hover:to-blue-700"
              : "text-primary border-primary hover:bg-primary/10"}
          `}
          onClick={onToggleEditMode}
        >
          {editMode ? t("Done", "完成") : t("Edit", "编辑")}
        </Button>
      )}
    </div>
  );
};

export default AstroSpotsHeader;
