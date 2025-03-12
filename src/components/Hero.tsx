
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Telescope } from "lucide-react";

const Hero = () => {
  const starFieldRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Create stars dynamically
    if (starFieldRef.current) {
      const starField = starFieldRef.current;
      starField.innerHTML = '';
      
      const width = starField.offsetWidth;
      const height = starField.offsetHeight;
      
      // Create 100 stars with varying sizes and positions
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 1;
        
        star.classList.add('star');
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * width}px`;
        star.style.top = `${Math.random() * height}px`;
        star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        
        starField.appendChild(star);
      }
      
      // Add a few "special" brighter stars
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
    <div className="relative overflow-hidden pt-20">
      {/* Star field background */}
      <div ref={starFieldRef} className="absolute inset-0 z-0 star-field"></div>
      
      {/* Orbital decoration elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] z-0">
        <div className="orbit w-full h-full"></div>
        <div className="orbit w-[600px] h-[600px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '25s' }}></div>
        <div className="orbit w-[400px] h-[400px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '30s' }}></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 pt-10 pb-12 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 py-1.5 px-6 border-primary/20 bg-primary/5 text-primary">
            <Star className="h-3.5 w-3.5 mr-1" />
            <span>Stellar Imaging Quality Scores</span>
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight animate-slide-up">
            <span className="text-gradient-blue">Perfect Astrophotography</span><br />
            <span>Starts with the Perfect Location</span>
          </h1>
          
          <p className="text-base md:text-lg text-foreground/80 mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Discover optimal shooting locations with data-driven Stellar Imaging Quality Scores.
            Find the best spots for breathtaking night sky images anywhere on Earth.
          </p>
        </div>
      </div>
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent"></div>
    </div>
  );
};

export default Hero;
