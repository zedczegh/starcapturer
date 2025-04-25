
import React from "react";
import { motion } from "framer-motion";
import { animationVariants } from "./utils/animationUtils";

interface CalculatorContainerProps {
  children: React.ReactNode;
  className?: string;
}

const CalculatorContainer: React.FC<CalculatorContainerProps> = ({ children, className }) => {
  return (
    <motion.div 
      className={`glassmorphism-strong rounded-xl p-6 ${className} shadow-lg hover:shadow-xl transition-all duration-300 bg-cosmic-800/60 backdrop-blur-sm`}
      initial="hidden"
      animate="visible"
      variants={animationVariants}
    >
      {children}
    </motion.div>
  );
};

export default React.memo(CalculatorContainer);
