
import React from 'react';
import { Container } from '@/components/ui/container';
import { useLanguage } from '@/contexts/LanguageContext';
import PageTitle from '@/components/layout/PageTitle';
import SIQSCalculator from '@/components/SIQSCalculator';

const CalculatorPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Container className="pt-28 pb-20">
        <PageTitle 
          title={t("SIQS Calculator", "SIQS计算器")}
          description={t(
            "Determine the Sky Imaging Quality Score for any location",
            "计算任何位置的天空成像质量评分"
          )}
        />
        
        <div className="mt-8">
          <SIQSCalculator />
        </div>
      </Container>
    </div>
  );
};

export default CalculatorPage;
