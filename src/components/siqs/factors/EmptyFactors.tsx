
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const EmptyFactors: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center py-4 text-muted-foreground text-sm">
      {t("No factors available", "没有可用的因素")}
    </div>
  );
};

export default EmptyFactors;
