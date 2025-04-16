import React, { useState } from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { DEEP_GALAXY_BG } from "@/assets/index";

// Create a global object to store the current SIQS value
export const currentSiqsStore = {
  value: null as number | null,
  setValue: (value: number | null) => {
    currentSiqsStore.value = value;
    // Also save to localStorage for persistence
    if (value !== null) {
      localStorage.setItem('current_siqs_value', value.toString());
    }
  },
  getValue: () => {
    // If no value in memory, try localStorage
    if (currentSiqsStore.value === null) {
      const storedValue = localStorage.getItem('current_siqs_value');
      if (storedValue) {
        const parsedValue = parseFloat(storedValue);
        if (!isNaN(parsedValue)) {
          currentSiqsStore.value = parsedValue;
        }
      }
    }
    return currentSiqsStore.value;
  }
};

// Version hash to detect algorithm tampering
// This should be updated whenever the algorithm is legitimately changed
export const SIQS_ALGORITHM_VERSION = "v1.0.3-protected";

// Check if algorithm has been tampered with
try {
  // Load the expected algorithm signature
  const expectedSignature = localStorage.getItem('siqs_algorithm_signature');
  
  // This is a simplified check - in a production environment this would use a
  // cryptographic hash function to verify algorithm integrity
  if (expectedSignature && expectedSignature !== SIQS_ALGORITHM_VERSION) {
    console.warn("SIQS algorithm version mismatch - possible unauthorized modification");
  } else if (!expectedSignature) {
    // First time running this version, save the signature
    localStorage.setItem('siqs_algorithm_signature', SIQS_ALGORITHM_VERSION);
  }
} catch (err) {
  // Non-critical error, just log it
  console.error("Error verifying algorithm integrity:", err);
}

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
  
  // Update current SIQS value when calculated
  const handleSiqsCalculated = (value: number | null) => {
    setCurrentSiqs(value);
    currentSiqsStore.setValue(value);
  };
  
  return (
    <section 
      id="calculator" 
      className="py-12 px-4 md:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center relative overflow-hidden"
    >
      {/* Background image with opacity */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${DEEP_GALAXY_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '0.5'
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-900/80 via-cosmic-950/50 to-cosmic-950/80 z-0" />
      
      {/* Content wrapper with higher z-index */}
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
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
