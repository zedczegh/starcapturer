
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SIQSCalculatorHeaderProps {
  className?: string;
}

const SIQSCalculatorHeader: React.FC<SIQSCalculatorHeaderProps> = ({ className }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">
        {t("Calculate Stellar Imaging Quality Score", "计算恒星成像质量评分")}
      </h2>
    </div>
  );
};

export default SIQSCalculatorHeader;
