
import React from 'react';
import { Container } from '@/components/ui/container';
import { useLanguage } from '@/contexts/LanguageContext';
import PageTitle from '@/components/layout/PageTitle';

const AboutPage = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Container className="pt-28 pb-20">
        <PageTitle 
          title={t("About SIQS", "关于SIQS")}
          description={t(
            "Learn more about the Sky Imaging Quality Score and how it helps astrophotographers",
            "了解更多关于天空成像质量评分如何帮助天文摄影师"
          )}
        />
        
        <div className="mt-8 space-y-8 bg-cosmic-900/60 backdrop-blur-sm border border-cosmic-700/30 rounded-lg p-6">
          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">
              {t("What is SIQS?", "什么是SIQS？")}
            </h2>
            <p className="text-lg">
              {t(
                "The Sky Imaging Quality Score (SIQS) is a comprehensive metric designed to help astrophotographers evaluate and predict the quality of night sky conditions for imaging. It combines various factors that affect astronomical imaging into a single, easy-to-understand score.",
                "天空成像质量评分（SIQS）是一个综合性指标，旨在帮助天文摄影师评估和预测夜空条件对成像的质量。它将影响天文成像的各种因素综合为一个简单易懂的评分。"
              )}
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">
              {t("How is SIQS Calculated?", "SIQS是如何计算的？")}
            </h2>
            <p className="text-lg mb-4">
              {t(
                "SIQS takes into account multiple environmental and astronomical factors:",
                "SIQS考虑了多种环境和天文因素："
              )}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                {t("Cloud Cover - The percentage of sky covered by clouds", 
                   "云层覆盖 - 云层覆盖天空的百分比")}
              </li>
              <li>
                {t("Light Pollution - Measured using the Bortle Scale", 
                   "光污染 - 使用Bortle量表测量")}
              </li>
              <li>
                {t("Seeing Conditions - Atmospheric stability", 
                   "视宁度 - 大气稳定性")}
              </li>
              <li>
                {t("Moon Phase - The current phase of the moon", 
                   "月相 - 当前的月球相位")}
              </li>
              <li>
                {t("Humidity - Atmospheric moisture content", 
                   "湿度 - 大气水分含量")}
              </li>
              <li>
                {t("Wind Speed - Affects mount stability", 
                   "风速 - 影响支架稳定性")}
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">
              {t("Using SIQS Effectively", "有效使用SIQS")}
            </h2>
            <p className="text-lg">
              {t(
                "SIQS ranges from 0 to 10, with higher scores indicating better conditions for astrophotography. A score above 7 generally indicates excellent conditions, while scores below 3 suggest poor imaging conditions. Use SIQS to plan your imaging sessions, compare locations, and make the most of your astrophotography equipment.",
                "SIQS范围从0到10，分数越高表示天文摄影的条件越好。得分超过7通常表示极佳的条件，而低于3的得分则表示成像条件较差。使用SIQS来计划您的成像会话、比较不同地点，并充分利用您的天文摄影设备。"
              )}
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default AboutPage;
