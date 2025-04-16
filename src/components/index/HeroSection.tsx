
import React, { useEffect, useRef } from "react";
import HeroContent from "./HeroContent";
import NavBar from "@/components/NavBar";
import BackgroundWrapper from "@/components/layout/BackgroundWrapper";

const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Optimize background animation to reduce CPU load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-active');
          } else {
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
    <BackgroundWrapper>
      <div ref={sectionRef} className="relative overflow-hidden pt-16 pb-8">
        <NavBar />
        <HeroContent />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
      </div>
    </BackgroundWrapper>
  );
};

export default HeroSection;
