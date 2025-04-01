
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyFactors: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/20 text-center">
      <p className="text-sm text-muted-foreground">
        {t("No specific factors available for this location.", "此位置没有具体的因素数据。")}
      </p>
    </div>
  );
};

export default EmptyFactors;
