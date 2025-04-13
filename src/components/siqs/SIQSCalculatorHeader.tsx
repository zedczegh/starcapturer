
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator } from "lucide-react";

interface SIQSCalculatorHeaderProps {
  className?: string;
}

const SIQSCalculatorHeader: React.FC<SIQSCalculatorHeaderProps> = ({ className }) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex justify-center items-center mb-6">
      <Calculator 
        className="mr-3" 
        size={32} 
        color="#F97316" // Bright Orange from the color palette 
        strokeWidth={2} 
      />
      <h2 className="text-xl font-bold text-center">
        {t("Calculate Stellar Imaging Quality Score", "计算天文观测质量评分")}
      </h2>
    </div>
  );
};

export default SIQSCalculatorHeader;
