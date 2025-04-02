
import React from "react";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface DynamicLightbulbIconProps {
  bortleScale: number | null;
  value?: number | null; // Alternative prop name for flexibility
  className?: string;
  animated?: boolean;
}

const DynamicLightbulbIcon: React.FC<DynamicLightbulbIconProps> = ({ 
  bortleScale, 
  value, 
  className,
  animated = false
}) => {
  // Allow using either bortleScale or value prop
  const actualValue = value !== undefined ? value : bortleScale;
  
  // If Bortle scale is null or invalid, use a default fallback value instead of showing a question mark
  const validBortleScale = actualValue !== null && actualValue >= 1 && actualValue <= 9 
    ? actualValue 
    : 4; // Default to 4 (moderate light pollution) instead of showing unknown
  
  // Higher Bortle scale = more light pollution = brighter bulb
  const fillOpacity = Math.min(validBortleScale / 9, 1);
  
  // Color changes with Bortle scale - using more accurate color representations
  let fillColor = "";
  let gradientColors = { from: "", to: "" };
  
  if (validBortleScale >= 7) {
    // High light pollution (7-9): orange to red
    fillColor = `rgba(239, 68, 68, ${fillOpacity})`;
    gradientColors = { 
      from: "rgba(249, 115, 22, 0.9)", 
      to: "rgba(239, 68, 68, 0.9)" 
    };
  } else if (validBortleScale >= 4) {
    // Moderate light pollution (4-6): yellow to green
    fillColor = `rgba(234, 179, 8, ${fillOpacity * 0.9})`;
    gradientColors = { 
      from: "rgba(234, 179, 8, 0.85)", 
      to: "rgba(132, 204, 22, 0.85)" 
    };
  } else {
    // Low light pollution (1-3): blue to cyan
    fillColor = `rgba(59, 130, 246, ${fillOpacity * 0.8})`;
    gradientColors = { 
      from: "rgba(59, 130, 246, 0.8)", 
      to: "rgba(6, 182, 212, 0.8)" 
    };
  }
  
  // Add tooltip description of the Bortle scale
  const getBortleDescription = () => {
    if (validBortleScale >= 7) {
      return "High light pollution (Bortle 7-9): Only brightest stars visible";
    } else if (validBortleScale >= 4) {
      return "Moderate light pollution (Bortle 4-6): Milky Way partially visible";
    } else {
      return "Low light pollution (Bortle 1-3): Good dark sky";
    }
  };

  // Animation variants for the icon
  const pulseAnimation = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.9, 1, 0.9],
      transition: { 
        duration: 2.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };
  
  // Create a gradient effect based on Bortle scale
  const gradientId = `lightbulb-gradient-${validBortleScale.toFixed(1)}`;
  
  return (
    <div className={`relative ${className || ''}`} title={getBortleDescription()}>
      {animated ? (
        <motion.div
          variants={pulseAnimation}
          animate="pulse"
          className="relative"
        >
          <svg width="16" height="16" className="absolute top-0 left-0">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors.from} />
                <stop offset="100%" stopColor={gradientColors.to} />
              </linearGradient>
            </defs>
          </svg>
          <Lightbulb 
            className="h-4 w-4 text-primary" 
            style={{
              fill: `url(#${gradientId})`,
              stroke: "currentColor"
            }}
          />
        </motion.div>
      ) : (
        <>
          <svg width="16" height="16" className="absolute top-0 left-0">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradientColors.from} />
                <stop offset="100%" stopColor={gradientColors.to} />
              </linearGradient>
            </defs>
          </svg>
          <Lightbulb 
            className="h-4 w-4 text-primary" 
            style={{
              fill: `url(#${gradientId})`,
              stroke: "currentColor"
            }}
          />
        </>
      )}
      <span className="sr-only">Light pollution level: {validBortleScale.toFixed(1)}</span>
    </div>
  );
};

export default React.memo(DynamicLightbulbIcon);
