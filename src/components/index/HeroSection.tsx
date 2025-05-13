
import React, { useEffect, useRef } from "react";
import HeroContent from "./HeroContent";
import NavBar from "@/components/NavBar";
import { preloadImagesForRoute } from "@/utils/imageOptimizer";

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Optimize background animation to reduce CPU load
  useEffect(() => {
    // Preload critical images for the hero section
    preloadImagesForRoute('/');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Only render animations when visible
            entry.target.classList.add('animate-active');
            
            // Optimize background animation rendering
            requestAnimationFrame(() => {
              if (sectionRef.current) {
                sectionRef.current.style.willChange = 'opacity, transform';
              }
            });
          } else {
            // Pause animations when not visible
            entry.target.classList.remove('animate-active');
            
            // Reset optimizations when out of view
            if (sectionRef.current) {
              sectionRef.current.style.willChange = 'auto';
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={sectionRef} 
      className="relative overflow-hidden pt-16 pb-8"
      style={{ contain: 'paint' }} // Improve painting performance
    >
      {/* Add a cosmic nebula background with opacity */}
      <div 
        className="absolute inset-0 bg-cosmic-950 bg-cover bg-center bg-no-repeat opacity-50 -z-10" 
        style={{ willChange: 'opacity' }}
      />
      <NavBar />
      <HeroContent />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default React.memo(HeroSection);
