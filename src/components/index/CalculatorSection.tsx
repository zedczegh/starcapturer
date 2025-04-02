
import React, { useState, createContext, useContext } from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import SectionContainer from "@/components/SectionContainer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Store } from "@/lib/store";

// Create a store for current SIQS value
export const currentSiqsStore = new Store<number | null>(null);

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
  cameraMeasurement?: number | null;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  noAutoLocationRequest = false,
  cameraMeasurement = null 
}) => {
  const { t } = useLanguage();
  const [siqsValue, setSiqsValue] = useState<number | null>(null);

  // Update both local state and the store
  const handleSiqsCalculated = (value: number | null) => {
    setSiqsValue(value);
    currentSiqsStore.setValue(value);
  };

  return (
    <SectionContainer id="calculator" className="bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-cosmic-50 mb-4">
            {t("Sky Quality Calculator", "天空质量计算器")}
          </h2>
          <p className="text-cosmic-300 max-w-2xl mx-auto">
            {t(
              "Calculate the current Sky Quality Index for Stargazing (SIQS) for any location. Our algorithm considers light pollution, weather conditions, and astronomical factors.",
              "计算任何位置的当前观星天空质量指数（SIQS）。我们的算法考虑了光污染、天气条件和天文因素。"
            )}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SIQSCalculator 
            noAutoLocationRequest={noAutoLocationRequest}
            onSiqsCalculated={handleSiqsCalculated}
            cameraMeasurement={cameraMeasurement}
          />
        </div>
      </div>
    </SectionContainer>
  );
};

export default CalculatorSection;
