
import React, { useState } from "react";
import { 
  CircleHelp, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEnhancedCloudDescription, getChineseCloudDescription } from "../utils/descriptions";
import { motion, AnimatePresence } from "framer-motion";

interface FactorItemProps {
  factor: {
    name: string;
    score: number;
    description: string;
    nighttimeData?: {
      average: number;
      timeRange: string;
      detail?: {
        evening: number;
        morning: number;
      };
    };
  };
  index: number;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor, index }) => {
  const [showDetails, setShowDetails] = useState(false);
  const { language } = useLanguage();
  
  // Determine the color based on the score (0-10 scale)
  const getColorClass = (score: number) => {
    if (score <= 2) return "bg-red-500/80 text-red-50";
    if (score <= 4) return "bg-orange-500/80 text-orange-50";
    if (score <= 6) return "bg-yellow-500/80 text-yellow-50";
    if (score <= 8) return "bg-green-500/80 text-green-50";
    return "bg-blue-500/80 text-blue-50";
  };
  
  // Format score to one decimal place
  const formattedScore = factor.score.toFixed(1);
  
  // Enhanced description for cloud cover with nighttime data
  const getDescriptionWithNighttime = () => {
    if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
      const cloudValue = parseFloat(factor.description.match(/\d+\.?\d*/)?.[0] || "0");
      
      // Use language-specific enhanced descriptions
      if (language === 'zh') {
        return getChineseCloudDescription(
          cloudValue,
          factor.nighttimeData?.average,
          factor.nighttimeData?.detail
        );
      } else {
        return getEnhancedCloudDescription(
          cloudValue, 
          factor.nighttimeData?.average,
          factor.nighttimeData?.detail
        );
      }
    }
    
    return factor.description;
  };
  
  const enhancedDescription = getDescriptionWithNighttime();
  
  return (
    <motion.div 
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-cosmic-800/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CircleHelp className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">{factor.name}</h4>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-semibold",
            getColorClass(factor.score)
          )}>
            {formattedScore}
          </span>
          {showDetails ? 
            <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </div>
      
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mb-1">{enhancedDescription}</p>
            
            {/* Display evening and morning cloud cover separately */}
            {factor.nighttimeData?.detail && (factor.name === "Cloud Cover" || factor.name === "云层覆盖") && (
              <div className="mt-3 space-y-2 bg-background/20 p-2 rounded">
                <h5 className="text-xs font-medium">
                  {language === 'en' ? 'Detailed Nighttime Cloud Cover' : '详细夜间云层覆盖'}
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-primary-foreground/80">
                      {language === 'en' ? 'Evening (6PM-12AM):' : '傍晚 (18:00-24:00):'}
                    </span>
                    <span className="float-right font-medium">
                      {factor.nighttimeData.detail.evening.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-primary-foreground/80">
                      {language === 'en' ? 'Morning (1AM-8AM):' : '清晨 (01:00-08:00):'}
                    </span>
                    <span className="float-right font-medium">
                      {factor.nighttimeData.detail.morning.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Simple nighttime average */}
            {factor.nighttimeData && !factor.nighttimeData.detail && (
              <p className="text-xs mt-2 text-primary-foreground/70">
                {language === 'en' 
                  ? `Nighttime average (${factor.nighttimeData.timeRange}): ${factor.nighttimeData.average.toFixed(1)}%` 
                  : `夜间平均 (${factor.nighttimeData.timeRange}): ${factor.nighttimeData.average.toFixed(1)}%`}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FactorItem;
