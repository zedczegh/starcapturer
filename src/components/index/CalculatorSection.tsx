
import React, { useState, useEffect } from "react";
import SIQSCalculator from "@/components/SIQSCalculator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

// Create a global object to store the current SIQS value
export const currentSiqsStore = {
  value: null as number | null,
  setValue: (value: number | null) => {
    currentSiqsStore.value = value;
    // Also save to localStorage for persistence
    if (value !== null) {
      try {
        localStorage.setItem('current_siqs_value', value.toString());
      } catch (e) {
        console.error("Error saving SIQS to localStorage:", e);
      }
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
            currentSiqsStore.value = parsedValue;
          }
        }
      } catch (e) {
        console.error("Error reading SIQS from localStorage:", e);
      }
    }
    return currentSiqsStore.value;
  },
  // Add metadata about the calculation
  metadata: {
    locationName: null as string | null,
    latitude: null as number | null,
    longitude: null as number | null,
    timestamp: null as string | null,
    setMetadata: (name: string, lat: number, lon: number) => {
      currentSiqsStore.metadata.locationName = name;
      currentSiqsStore.metadata.latitude = lat;
      currentSiqsStore.metadata.longitude = lon;
      currentSiqsStore.metadata.timestamp = new Date().toISOString();
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('siqs_metadata', JSON.stringify({
          locationName: name,
          latitude: lat,
          longitude: lon,
          timestamp: currentSiqsStore.metadata.timestamp
        }));
      } catch (e) {
        console.error("Error saving SIQS metadata to localStorage:", e);
      }
    },
    getMetadata: () => {
      if (!currentSiqsStore.metadata.locationName) {
        try {
          const storedMetadata = localStorage.getItem('siqs_metadata');
          if (storedMetadata) {
            const parsedMetadata = JSON.parse(storedMetadata);
            currentSiqsStore.metadata.locationName = parsedMetadata.locationName || null;
            currentSiqsStore.metadata.latitude = parsedMetadata.latitude || null;
            currentSiqsStore.metadata.longitude = parsedMetadata.longitude || null;
            currentSiqsStore.metadata.timestamp = parsedMetadata.timestamp || null;
          }
        } catch (e) {
          console.error("Error reading SIQS metadata from localStorage:", e);
        }
      }
      return {
        locationName: currentSiqsStore.metadata.locationName,
        latitude: currentSiqsStore.metadata.latitude,
        longitude: currentSiqsStore.metadata.longitude,
        timestamp: currentSiqsStore.metadata.timestamp
      };
    }
  }
};

// Version hash to detect algorithm tampering
// This should be updated whenever the algorithm is legitimately changed
export const SIQS_ALGORITHM_VERSION = "v1.0.4-astronomical-night";

// Check if algorithm has been tampered with
try {
  // Load the expected algorithm signature
  const expectedSignature = localStorage.getItem('siqs_algorithm_signature');
  
  // This is a simplified check - in a production environment this would use a
  // cryptographic hash function to verify algorithm integrity
  if (expectedSignature && expectedSignature !== SIQS_ALGORITHM_VERSION) {
    console.warn("SIQS algorithm version mismatch - possible unauthorized modification");
    // Update to the new version
    localStorage.setItem('siqs_algorithm_signature', SIQS_ALGORITHM_VERSION);
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
  
  // Load metadata when component mounts
  useEffect(() => {
    const metadata = currentSiqsStore.metadata.getMetadata();
    console.log("Loaded SIQS metadata:", metadata);
  }, []);
  
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
      {/* Background with cosmic styling */}
      <div className="absolute inset-0 bg-cosmic-950/60 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cosmic-950/90 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-950/90 to-transparent pointer-events-none" />
      
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
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CalculatorSection;
