
import React, { useState } from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { currentSiqsStore } from "@/stores/siqsStore";

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  noAutoLocationRequest = false 
}) => {
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(currentSiqsStore.getValue());
  
  // Define animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.8
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };
  
  const handleSiqsCalculated = (value: number | null) => {
    setCurrentSiqs(value);
    currentSiqsStore.setValue(value);
  };
  
  return (
    <section 
      id="calculator" 
      className="py-12 px-4 md:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center bg-gradient-to-b from-cosmic-900/80 to-cosmic-950/80 relative overflow-hidden"
    >
      {/* Enhanced background with better opacity */}
      <div className="absolute inset-0 bg-star-field opacity-50 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-cosmic-900/90 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-cosmic-950/90 to-transparent pointer-events-none"></div>
      
      {/* Animated glow effects with improved visibility */}
      <motion.div 
        className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-cosmic-glow opacity-30 pointer-events-none"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 8, 
          ease: "easeInOut", 
          repeat: Infinity 
        }}
      />
      
      <motion.div 
        className="absolute bottom-40 left-1/4 w-80 h-80 rounded-full bg-cosmic-glow opacity-30 pointer-events-none"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.35, 0.2]
        }}
        transition={{ 
          duration: 10, 
          ease: "easeInOut", 
          repeat: Infinity,
          delay: 2
        }}
      />
      
      <motion.div 
        className="container mx-auto max-w-5xl relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div 
          className="text-center mb-6"
          variants={itemVariants}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400`}>
            {t("Sky Imaging Quality Score Calculator", "天空成像质量评分计算器")}
          </h2>
        </motion.div>
        
        <motion.div
          variants={itemVariants}
          className="transform-gpu hover:scale-[1.01] transition-transform duration-500 relative"
        >
          {/* Enhanced decorative light effect behind calculator */}
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl -z-10 transform -translate-y-4 scale-105"></div>
          
          <SIQSCalculator 
            className="mx-auto max-w-2xl" 
            noAutoLocationRequest={noAutoLocationRequest}
            onSiqsCalculated={handleSiqsCalculated}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CalculatorSection;
