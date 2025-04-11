
import React, { useState, useEffect } from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

// Create a global object to store the current SIQS value
export const currentSiqsStore = {
  value: null as number | null,
  setValue: (value: number | null) => {
    if (value !== null) {
      // Ensure value is on a 0-10 scale and is valid
      const validValue = Math.min(10, Math.max(0, value));
      console.log(`Setting current SIQS value to: ${validValue.toFixed(1)}`);
      currentSiqsStore.value = validValue;
      // Also save to localStorage for persistence
      localStorage.setItem('current_siqs_value', validValue.toString());
    } else {
      console.log("Setting current SIQS value to null");
      currentSiqsStore.value = null;
      // Clear from localStorage if null
      localStorage.removeItem('current_siqs_value');
    }
  },
  getValue: () => {
    // If no value in memory, try localStorage
    if (currentSiqsStore.value === null) {
      try {
        const storedValue = localStorage.getItem('current_siqs_value');
        if (storedValue) {
          const parsedValue = parseFloat(storedValue);
          if (!isNaN(parsedValue)) {
            // Ensure value is on a 0-10 scale
            currentSiqsStore.value = Math.min(10, Math.max(0, parsedValue));
          }
        } else {
          // Try getting from latest location data
          const savedLocationString = localStorage.getItem('latest_siqs_location');
          if (savedLocationString) {
            const savedLocation = JSON.parse(savedLocationString);
            if (savedLocation && typeof savedLocation.siqs === 'number') {
              currentSiqsStore.value = Math.min(10, Math.max(0, savedLocation.siqs));
            }
          }
        }
      } catch (error) {
        console.error("Error reading SIQS from storage:", error);
        // Explicitly set to null on error
        currentSiqsStore.value = null;
      }
    }
    return currentSiqsStore.value;
  }
};

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.currentSiqsStore = currentSiqsStore;
}

// Declare window interface extension for TypeScript
declare global {
  interface Window {
    currentSiqsStore?: typeof currentSiqsStore;
  }
}

interface CalculatorSectionProps {
  noAutoLocationRequest?: boolean;
}

const CalculatorSection: React.FC<CalculatorSectionProps> = ({ 
  noAutoLocationRequest = false 
}) => {
  const { t } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  
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
  
  // Initialize with the stored value immediately to prevent flicker
  useEffect(() => {
    console.log("CalculatorSection: Initializing SIQS value");
    
    // First try to get value from latest_siqs_location (most accurate)
    try {
      const savedLocationString = localStorage.getItem('latest_siqs_location');
      if (savedLocationString) {
        const savedLocation = JSON.parse(savedLocationString);
        if (savedLocation && typeof savedLocation.siqs === 'number') {
          const scoreValue = Math.min(10, Math.max(0, savedLocation.siqs));
          console.log(`CalculatorSection: Setting SIQS from latest_siqs_location: ${scoreValue}`);
          setCurrentSiqs(scoreValue);
          currentSiqsStore.setValue(scoreValue);
          return;
        } else {
          console.log("CalculatorSection: No valid SIQS in saved location, using null");
          setCurrentSiqs(null);
          currentSiqsStore.setValue(null);
          return;
        }
      } else {
        console.log("CalculatorSection: No saved location found, using null");
        setCurrentSiqs(null);
        currentSiqsStore.setValue(null);
      }
    } catch (error) {
      console.error("Error reading from latest_siqs_location:", error);
      setCurrentSiqs(null);
      currentSiqsStore.setValue(null);
    }
    
    // Fall back to current_siqs_value
    const storedValue = currentSiqsStore.getValue();
    if (storedValue !== null) {
      console.log(`CalculatorSection: Setting SIQS from currentSiqsStore: ${storedValue}`);
      setCurrentSiqs(storedValue);
    } else {
      console.log("CalculatorSection: No stored SIQS value found, using null");
      setCurrentSiqs(null);
      currentSiqsStore.setValue(null);
    }
  }, []);
  
  // Update current SIQS value when calculated
  const handleSiqsCalculated = (value: number | null) => {
    console.log(`CalculatorSection: SIQS calculated: ${value}`);
    
    if (value !== null) {
      // Ensure value is on a 0-10 scale
      const validValue = Math.min(10, Math.max(0, value));
      setCurrentSiqs(validValue);
      currentSiqsStore.setValue(validValue);
      
      // Also update latest_siqs_location
      try {
        const savedLocationString = localStorage.getItem('latest_siqs_location');
        if (savedLocationString) {
          const savedLocation = JSON.parse(savedLocationString);
          if (savedLocation) {
            savedLocation.siqs = validValue;
            localStorage.setItem('latest_siqs_location', JSON.stringify(savedLocation));
            console.log(`CalculatorSection: Updated latest_siqs_location with SIQS: ${validValue}`);
          }
        }
      } catch (error) {
        console.error("Error updating latest_siqs_location:", error);
      }
    } else {
      setCurrentSiqs(null);
      currentSiqsStore.setValue(null);
      console.log("CalculatorSection: Reset SIQS to null");
    }
  };
  
  // Check for value updates from other components
  useEffect(() => {
    const storedValue = currentSiqsStore.getValue();
    if (storedValue !== null && storedValue !== currentSiqs) {
      console.log(`CalculatorSection: Syncing with currentSiqsStore: ${storedValue}`);
      setCurrentSiqs(storedValue);
    }
    
    // Poll for updates from other components
    const intervalId = setInterval(() => {
      const latestValue = currentSiqsStore.getValue();
      if (latestValue !== null && latestValue !== currentSiqs) {
        console.log(`CalculatorSection: Updating from currentSiqsStore: ${latestValue}`);
        setCurrentSiqs(latestValue);
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(intervalId);
  }, [currentSiqs]);
  
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
            initialSiqs={currentSiqs}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CalculatorSection;
