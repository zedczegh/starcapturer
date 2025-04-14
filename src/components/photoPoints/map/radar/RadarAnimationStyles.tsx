
import React from 'react';

const RadarAnimationStyles: React.FC = () => {
  React.useEffect(() => {
    // Create style element if it doesn't exist
    if (!document.getElementById('radar-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'radar-animation-styles';
      style.innerHTML = `
        /* Radar container styles */
        .radar-container {
          z-index: 400;
          pointer-events: none;
        }
        
        /* Radar sweep animation */
        .radar-sweep {
          position: absolute;
          transform-origin: center center;
          border-radius: 50%;
          background: transparent;
          border: 2px solid transparent;
          overflow: hidden;
          opacity: 0.7;
          transition: opacity 0.3s ease-out;
        }
        
        .radar-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(150, 130, 255, 0.2) 0%,
            rgba(150, 130, 255, 0) 15%,
            rgba(150, 130, 255, 0) 85%,
            rgba(150, 130, 255, 0.2) 100%
          );
          animation: radar-rotate 4s linear infinite;
          transform-origin: center center;
        }
        
        @keyframes radar-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Pulse effect for the radar */
        .radar-pulse {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          border: 2px solid rgba(150, 130, 255, 0.6);
          animation: radar-pulse 2s infinite;
        }
        
        @keyframes radar-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          70% {
            transform: scale(1.05);
            opacity: 0;
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up the style element on unmount
      const styleElement = document.getElementById('radar-animation-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  return null;
};

export default RadarAnimationStyles;
