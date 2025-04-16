
import React, { useEffect, useRef } from "react";
import HeroContent from "./HeroContent";
import NavBar from "@/components/NavBar";

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Optimize background animation to reduce CPU load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Only render animations when visible
            entry.target.classList.add('animate-active');
          } else {
            // Pause animations when not visible
            entry.target.classList.remove('animate-active');
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
    <div ref={sectionRef} className="relative overflow-hidden pt-16 pb-8">
      {/* Add a cosmic nebula background with opacity */}
      <div className="absolute inset-0 bg-cosmic-950 bg-cover bg-center bg-no-repeat opacity-50 -z-10" />
      <NavBar />
      <HeroContent />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default HeroSection;
