
import React, { useEffect, useRef } from 'react';

/**
 * Component for managing radar animation styles
 */
const RadarAnimationStyles: React.FC = () => {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  
  // Create and add styles only once
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = `
        .radar-container {
          pointer-events: none;
          z-index: 400;
        }
        .radar-sweep {
          position: absolute;
          border-radius: 50%;
          background: conic-gradient(
            rgba(59, 130, 246, 0.8) 0deg,
            rgba(59, 130, 246, 0.1) 30deg,
            rgba(59, 130, 246, 0) 120deg,
            rgba(59, 130, 246, 0) 360deg
          );
          transform-origin: center;
          animation: radar-sweep 4s linear infinite;
          z-index: 400;
          pointer-events: none;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    
    // Clean up styles when component is unmounted
    return () => {
      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  return null;
};

export default RadarAnimationStyles;
