
import React from 'react';

/**
 * Injects the necessary styles for radar animation into the document head
 */
const RadarAnimationStyles: React.FC = () => {
  React.useEffect(() => {
    // Create style element if it doesn't exist
    if (!document.getElementById('radar-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'radar-animation-styles';
      style.innerHTML = `
        .radar-sweep {
          position: absolute;
          transform-origin: center center;
          border-radius: 50%;
          background: conic-gradient(
            rgba(14, 165, 233, 0.2) 0deg,
            rgba(14, 165, 233, 0) 30deg,
            rgba(14, 165, 233, 0) 330deg,
            rgba(14, 165, 233, 0.2) 360deg
          );
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
          z-index: 400;
          pointer-events: none;
          animation: radar-rotate 4s linear infinite;
          transform: scale(1);
          opacity: 0;
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        
        @keyframes radar-rotate {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.03);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .radar-sweep {
            animation-duration: 3.5s;
          }
        }
        
        /* Reduce animation for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .radar-sweep {
            animation: none;
            opacity: 0.5;
            background: radial-gradient(
              circle, 
              rgba(14, 165, 233, 0.1) 0%,
              rgba(14, 165, 233, 0.05) 70%,
              rgba(14, 165, 233, 0) 100%
            );
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Cleanup
    return () => {
      const styleElement = document.getElementById('radar-animation-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  return null;
};

export default RadarAnimationStyles;
