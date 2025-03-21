
import React from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  noAutoLocationRequest = false 
}) => {
  const { t } = useLanguage();
  
  return (
    <section 
      id="calculator" 
      className="py-16 px-4 md:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center bg-gradient-to-b from-cosmic-900 to-cosmic-950"
    >
      <div className="container mx-auto max-w-5xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            {t("Sky Imaging Quality Score Calculator", "天空成像质量评分计算器")}
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t(
              "Get an accurate assessment of your location's astrophotography conditions with our SIQS calculator.",
              "使用我们的SIQS计算器准确评估您所在位置的天文摄影条件。"
            )}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <SIQSCalculator 
            className="mx-auto max-w-2xl" 
            noAutoLocationRequest={noAutoLocationRequest}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default CalculatorSection;
