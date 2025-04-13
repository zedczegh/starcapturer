
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface CardContainerProps {
  compact?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({
  compact = false,
  onClick,
  children
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <Card 
        className={`overflow-hidden border border-cosmic-800 bg-cosmic-900/70 hover:bg-cosmic-900 transition-colors ${
          compact ? 'shadow-sm cursor-pointer' : 'shadow-md cursor-pointer'
        }`}
      >
        <CardContent className={compact ? "p-2.5" : "p-3"}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CardContainer;
