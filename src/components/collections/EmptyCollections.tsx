
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyCollections: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 bg-cosmic-800/50 rounded-lg border border-cosmic-700/50">
      <div className="mb-4 text-muted-foreground">
        {t("You haven't saved any locations yet.", "您还没有保存任何位置。")}
      </div>
      <button
        onClick={() => navigate('/photo-points')}
        className="text-primary hover:underline"
      >
        {t("Browse Photo Points", "浏览摄影点")}
      </button>
    </div>
  );
};

export default EmptyCollections;
