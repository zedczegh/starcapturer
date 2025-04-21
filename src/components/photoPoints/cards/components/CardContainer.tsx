
import React from 'react';
import { motion } from 'framer-motion';

interface CardContainerProps {
  children: React.ReactNode;
  index: number;
  isVisible: boolean;
  isMobile: boolean;
  onClick?: () => void; // Added onClick prop
}

const CardContainer: React.FC<CardContainerProps> = ({ 
  children, 
  index, 
  isVisible, 
  isMobile,
  onClick
}) => {
  return (
    <div 
      className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
        transition: `opacity 0.5s, transform 0.5s ease ${Math.min(index * 0.1, 0.5)}s`
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default CardContainer;
