
import { MotionProps } from 'framer-motion';

/**
 * Shared animation variants for map legend components
 */

export const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export const pulseVariants = {
  pulse: {
    boxShadow: [
      '0 0 0 0 rgba(139, 92, 246, 0)',
      '0 0 0 4px rgba(139, 92, 246, 0.2)',
      '0 0 0 0 rgba(139, 92, 246, 0)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatDelay: 1
    }
  }
};

export const markerAnimationProps = (delay: number = 0): MotionProps => ({
  animate: { 
    boxShadow: [
      '0 0 0 rgba(155, 135, 245, 0)', 
      '0 0 8px rgba(155, 135, 245, 0.5)', 
      '0 0 0 rgba(155, 135, 245, 0)'
    ] 
  },
  transition: { duration: 3, repeat: Infinity, delay }
});

export const hoverMotionProps: MotionProps = {
  whileHover: { x: 3 },
  transition: { type: 'spring', stiffness: 300 }
};
