
import React from 'react';
import { motion } from 'framer-motion';
import StatusMessage from '../StatusMessage';
import { animationVariants } from './utils/animationUtils';

interface CalculatorStatusProps {
  message: string | null;
  loading: boolean;
  calculationInProgress: boolean;
}

const CalculatorStatus: React.FC<CalculatorStatusProps> = ({
  message,
  loading,
  calculationInProgress
}) => {
  return (
    <motion.div 
      variants={animationVariants} 
      transition={{ delay: 0.1 }}
    >
      <StatusMessage 
        message={message} 
        loading={calculationInProgress || loading} 
      />
    </motion.div>
  );
};

export default CalculatorStatus;
