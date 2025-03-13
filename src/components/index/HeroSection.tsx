
import React from "react";
import StarryBackground from "./StarryBackground";
import HeroContent from "./HeroContent";
import NavBar from "@/components/NavBar";

const HeroSection: React.FC = () => {
  return (
    <div className="relative overflow-hidden pt-20">
      <StarryBackground />
      <NavBar />
      <HeroContent />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default HeroSection;
