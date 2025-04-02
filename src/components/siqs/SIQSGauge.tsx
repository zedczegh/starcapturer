
import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { motion, useSpring, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface SIQSGaugeProps {
  score: number | null;
  level: string;
  color: string;
  loading: boolean;
  hasCalculatedOnce: boolean;
}

const SIQSGauge: React.FC<SIQSGaugeProps> = ({
  score,
  level,
  color,
  loading,
  hasCalculatedOnce
}) => {
  const { t } = useLanguage();
  const [displayScore, setDisplayScore] = useState<number>(0);
  
  // Animate score change
  useEffect(() => {
    if (score !== null) {
      const controls = animate(0, score, {
        duration: 1.5,
        onUpdate: (value) => {
          setDisplayScore(parseFloat(value.toFixed(1)));
        },
        ease: "easeOut"
      });
      
      return () => controls.stop();
    }
  }, [score]);
  
  // Get appropriate text color based on score
  const getTextColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-green-400";
    if (score >= 4) return "text-yellow-400";
    if (score >= 2) return "text-orange-400";
    return "text-red-400";
  };
  
  // Format score with 1 decimal place
  const formattedScore = displayScore.toFixed(1);
  
  return (
    <div className="flex flex-col items-center w-full max-w-[220px]">
      <div className="relative w-full aspect-square flex items-center justify-center mb-2">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-cosmic-800/50 border border-cosmic-700/50"></div>
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : !hasCalculatedOnce ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground text-sm">
              {t("Enter location to calculate SIQS", "输入位置以计算SIQS")}
            </p>
          </div>
        ) : (
          <>
            {/* Circular progress indicator */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden bg-gradient-to-br"
              style={{ 
                background: `conic-gradient(${color} ${score !== null ? (score * 10) : 0}%, transparent 0%)`,
                opacity: 0.2
              }}
            />
            
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ 
                background: `conic-gradient(${color} ${score !== null ? (score * 10) : 0}%, transparent 0%)`,
                opacity: 0.1,
                filter: "blur(20px)",
                transform: "scale(1.1)"
              }}
            />
            
            {/* SIQS score value */}
            <div className="flex flex-col items-center justify-center z-10">
              <motion.span 
                className={cn("text-5xl font-bold", getTextColor(score))}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {formattedScore}
              </motion.span>
              <motion.span 
                className="text-sm mt-1 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {t("SIQS", "SIQS")}
              </motion.span>
            </div>
          </>
        )}
      </div>
      
      {/* Progress bar */}
      {hasCalculatedOnce && (
        <div className="w-full">
          <Progress 
            value={score !== null ? score * 10 : 0} 
            className="h-2 my-2 bg-cosmic-800/40"
            style={{
              backgroundColor: 'rgba(25, 25, 35, 0.3)',
              backgroundImage: `linear-gradient(to right, ${color}99, ${color})`
            }}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{t("Poor", "较差")}</span>
            <span 
              className={score !== null ? getTextColor(score) : ""}
            >
              {level}
            </span>
            <span>{t("Excellent", "优秀")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SIQSGauge;
