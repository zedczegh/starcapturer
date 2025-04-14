
import { MotionProps } from 'framer-motion';

/**
 * Shared animation variants for map legend components
 */

export const containerVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      staggerChildren: 0.05
    }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, x: -8, y: 2 },
  visible: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
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

// Marker hover animations
export const markerHoverVariants = {
  rest: { 
    scale: 1,
    boxShadow: "0 0 0 rgba(0, 0, 0, 0.2)"
  },
  hover: { 
    scale: 1.1,
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

// Legend tab animations
export const tabGlowVariants = {
  initial: {
    boxShadow: "0 0 0 rgba(139, 92, 246, 0)"
  },
  animate: {
    boxShadow: [
      "0 0 0 rgba(139, 92, 246, 0)",
      "0 0 15px rgba(139, 92, 246, 0.5)",
      "0 0 0 rgba(139, 92, 246, 0)"
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: "loop"
    }
  }
};

// Arrowhead specific animations
export const arrowHeadVariants = {
  collapsed: {
    rotate: 180,
    scale: 1
  },
  expanded: {
    rotate: 0,
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  }
};

// Label fade animations
export const labelVariants = {
  hidden: {
    opacity: 0,
    y: 5
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.3
    }
  }
};
