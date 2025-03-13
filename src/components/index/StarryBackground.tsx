
import React, { useEffect, useRef } from "react";

const StarryBackground: React.FC = () => {
  const starFieldRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (starFieldRef.current) {
      const starField = starFieldRef.current;
      starField.innerHTML = '';
      
      const width = starField.offsetWidth;
      const height = starField.offsetHeight;
      
      // Small stars
      for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 1;
        
        star.classList.add('star');
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * width}px`;
        star.style.top = `${Math.random() * height}px`;
        star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        starField.appendChild(star);
      }
      
      // Medium stars
      for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 2;
        
        star.classList.add('star');
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * width}px`;
        star.style.top = `${Math.random() * height}px`;
        star.style.opacity = '0.9';
        star.style.boxShadow = '0 0 5px 1px rgba(255,253,247,0.3)';
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        starField.appendChild(star);
      }
      
      // Large stars with glow
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2 + 3;
        
        star.classList.add('star');
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * width}px`;
        star.style.top = `${Math.random() * height}px`;
        star.style.opacity = '1';
        star.style.boxShadow = '0 0 10px 2px rgba(255,253,247,0.4)';
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        starField.appendChild(star);
      }
    }
  }, []);
  
  return (
    <>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-cosmic-900/80 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1470813740244-df37b8c1edcb" 
          alt="Night sky" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      
      <div ref={starFieldRef} className="absolute inset-0 z-10 star-field"></div>
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] z-0">
        <div className="orbit w-full h-full"></div>
        <div className="orbit w-[600px] h-[600px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '25s' }}></div>
        <div className="orbit w-[400px] h-[400px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '30s' }}></div>
      </div>
    </>
  );
};

export default StarryBackground;
