
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import SIQSCalculator from '@/components/siqs/SIQSCalculator';
import SIQSSummary from '@/components/siqs/SIQSSummary';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CalculatorSection: React.FC = () => {
  const { t, language } = useLanguage();
  const [siqsScore, setSiqsScore] = useState<number>(0);
  const [isViable, setIsViable] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<any>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(calculatorRef, { once: true, amount: 0.2 });
  const navigate = useNavigate();
  
  // Title and paragraph variants for animations
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  // Card variants for animation
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2
      }
    }
  };
  
  // Handle SIQS calculation result
  const handleSiqsCalculation = (score: number, viable: boolean) => {
    setSiqsScore(score);
    setIsViable(viable);
  };
  
  // Handle location selection/change
  const handleLocationChange = (location: any) => {
    setLocationData(location);
  };
  
  // Handle view detailed report click
  const handleViewDetailedReport = () => {
    if (locationData && siqsScore > 0) {
      // Add SIQS data to the location
      const locationWithSiqs = {
        ...locationData,
        siqs: siqsScore,
        isViable: isViable
      };
      
      // Navigate to location details page with the data
      navigate(`/location/${locationData.id || 'custom'}`, { 
        state: locationWithSiqs
      });
    }
  };
  
  return (
    <section
      id="calculator"
      className="py-16 md:py-24 bg-cosmic-950 relative overflow-hidden"
      ref={calculatorRef}
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-950 via-cosmic-950/90 to-cosmic-950"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          variants={textVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-blue">
            {t("Calculate Sky Quality", "计算天空质量")}
          </h2>
          <p className="text-muted-foreground">
            {t(
              "Our Sky Imaging Quality Score (SIQS) helps you determine if conditions are right for astrophotography at your location.",
              "我们的天空成像质量评分（SIQS）帮助您确定您所在位置的条件是否适合天文摄影。"
            )}
          </p>
        </motion.div>
        
        <motion.div
          className="grid md:grid-cols-2 gap-8"
          variants={cardVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* SIQS Calculator */}
          <Card className="bg-cosmic-900/50 border-cosmic-700/30 shadow-xl hover:shadow-cosmic-800/20 transition-shadow duration-300">
            <CardContent className="p-0">
              <SIQSCalculator 
                onCalculate={handleSiqsCalculation}
                onLocationChange={handleLocationChange}
              />
            </CardContent>
          </Card>
          
          {/* SIQS Summary */}
          <Card className="bg-cosmic-900/50 border-cosmic-700/30 shadow-xl hover:shadow-cosmic-800/20 transition-shadow duration-300">
            <CardContent className="p-0">
              <SIQSSummary 
                score={siqsScore} 
                isViable={isViable}
                onViewDetails={handleViewDetailedReport}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CalculatorSection;
