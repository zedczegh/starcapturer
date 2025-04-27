
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getScoreColor } from "./utils/scoreUtils";

interface ScoreBadgeContainerProps {
  score: number | null;
  isTransitioning: boolean;
  children: React.ReactNode;
}

const ScoreBadgeContainer: React.FC<ScoreBadgeContainerProps> = ({
  score,
  isTransitioning,
  children
}) => {
  // Always provide a fallback color class in case score is null
  const colorClass = score !== null ? getScoreColor(score) : 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';

  return (
    <AnimatePresence>
      <motion.div 
        className={`flex items-center ${colorClass} px-2 py-0.5 rounded-full border`}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: isTransitioning ? 0.5 : 1 }}
        transition={{ duration: 0.2 }}
        layout
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(ScoreBadgeContainer);
